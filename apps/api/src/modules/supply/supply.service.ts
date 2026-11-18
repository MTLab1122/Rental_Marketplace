import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { InviteLandlordDto, ImportPropertiesBatchDto, QualityCheckResponseDto } from './supply.dto';
import {
  validateEligibilityAndPropertyType,
  validatePeshawarCoordinates,
} from '../property/property.validator';
import { PropertyStatus } from '@prisma/client';

@Injectable()
export class SupplyService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Invite a landlord or hostel operator with tracking link
   */
  async inviteLandlord(dto: InviteLandlordDto, inviterId?: string) {
    const inviteCode = `LL-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const inviteUrl = `https://rentalpeshawar.pk/landlord/onboard?ref=${inviteCode}`;

    // Store in SystemSettings or AuditLog for permanent tracking
    await this.prisma.auditLog.create({
      data: {
        actorId: inviterId || null,
        action: 'LANDLORD_INVITE_CREATED',
        targetType: 'LandlordInvite',
        targetId: inviteCode,
        after: {
          recipient: dto.emailOrPhone,
          fullName: dto.fullName,
          targetLocality: dto.targetLocality,
          businessName: dto.businessName,
          inviteUrl,
        },
      },
    });

    return {
      inviteCode,
      inviteUrl,
      recipient: dto.emailOrPhone,
      fullName: dto.fullName,
      status: 'SENT',
      message: 'Landlord invitation dispatched successfully.',
    };
  }

  /**
   * Generates or retrieves landlord referral tracking link
   */
  async getLandlordReferralLink(landlordUserId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: landlordUserId },
      include: { landlordProfile: true },
    });

    if (!user) {
      throw new NotFoundException('Landlord user not found');
    }

    const referralCode = `PEW-${user.id.slice(0, 8).toUpperCase()}`;
    const referralUrl = `https://rentalpeshawar.pk/landlord/onboard?ref=${referralCode}`;

    // Count referrals signed up with this code
    const referralCount = await this.prisma.auditLog.count({
      where: {
        action: 'LANDLORD_INVITE_CLAIMED',
        targetId: referralCode,
      },
    });

    return {
      landlordId: user.id,
      referralCode,
      referralUrl,
      referredLandlordsCount: referralCount,
      bonusTier:
        referralCount >= 5 ? 'GOLD_PARTNER' : referralCount >= 2 ? 'SILVER_PARTNER' : 'STANDARD',
    };
  }

  /**
   * Supply Target Governance Dashboard
   * Evaluates current active supply against strict Peshawar launch thresholds:
   * - Total active listings: Target >= 100
   * - Student-only listings: Target >= 30
   * - Family-only listings: Target >= 30
   * - Priority Localities: Target >= 10 each
   */
  async getSupplyTargets() {
    const PRIORITY_LOCALITIES = [
      'University Town',
      'Hayatabad',
      'University Road',
      'Saddar',
      'Regi Model Town',
    ];

    const [totalActive, studentCount, familyCount, priorityStats] = await Promise.all([
      this.prisma.property.count({
        where: {
          status: PropertyStatus.APPROVED,
          isAvailable: true,
          deletedAt: null,
        },
      }),
      this.prisma.property.count({
        where: {
          status: PropertyStatus.APPROVED,
          isAvailable: true,
          deletedAt: null,
          eligibility: 'STUDENTS_ONLY',
        },
      }),
      this.prisma.property.count({
        where: {
          status: PropertyStatus.APPROVED,
          isAvailable: true,
          deletedAt: null,
          eligibility: 'FAMILIES_ONLY',
        },
      }),
      this.prisma.locality.findMany({
        where: {
          name: { in: PRIORITY_LOCALITIES },
          isActive: true,
        },
        include: {
          _count: {
            select: {
              properties: {
                where: {
                  status: PropertyStatus.APPROVED,
                  isAvailable: true,
                  deletedAt: null,
                },
              },
            },
          },
        },
      }),
    ]);

    const localityTargets = PRIORITY_LOCALITIES.map((name) => {
      const loc = priorityStats.find((p: any) => p.name.toLowerCase() === name.toLowerCase());
      const current = loc ? loc._count.properties : 0;
      const target = 10;
      return {
        localityName: name,
        currentSupply: current,
        targetSupply: target,
        deficit: Math.max(0, target - current),
        status: current >= target ? 'TARGET_MET' : 'DEFICIT',
      };
    });

    return {
      launchReadiness: {
        overallStatus:
          totalActive >= 100 &&
          studentCount >= 30 &&
          familyCount >= 30 &&
          localityTargets.every((lt) => lt.currentSupply >= 10)
            ? 'READY_FOR_PUBLIC_MARKETING'
            : 'ACQUISITION_IN_PROGRESS',
        totalActiveListings: {
          current: totalActive,
          target: 100,
          met: totalActive >= 100,
        },
        studentOnlyListings: {
          current: studentCount,
          target: 30,
          met: studentCount >= 30,
        },
        familyOnlyListings: {
          current: familyCount,
          target: 30,
          met: familyCount >= 30,
        },
        priorityLocalityTargets: localityTargets,
      },
    };
  }

  /**
   * Bulk import properties from CSV / operator data with validation
   */
  async importPropertiesBatch(dto: ImportPropertiesBatchDto, operatorUserId: string) {
    const results = {
      totalReceived: dto.properties.length,
      successfulCount: 0,
      failedCount: 0,
      createdPropertyIds: [] as string[],
      errors: [] as { index: number; title: string; reason: string }[],
    };

    for (let i = 0; i < dto.properties.length; i++) {
      const item = dto.properties[i]!;
      try {
        // 1. Validate eligibility and property type rule
        validateEligibilityAndPropertyType(item.eligibility, item.propertyType);

        // 2. Validate coordinates strictly inside Peshawar boundary
        validatePeshawarCoordinates(item.latitude, item.longitude);

        // 3. Find locality
        const locality = await this.prisma.locality.findFirst({
          where: {
            OR: [
              { name: { equals: item.localityName, mode: 'insensitive' } },
              { slug: { equals: item.localityName.toLowerCase().replace(/\s+/g, '-') } },
            ],
            isActive: true,
          },
        });

        if (!locality) {
          throw new BadRequestException(`Locality '${item.localityName}' not found or inactive`);
        }

        // 4. Find or identify landlord
        const landlord = await this.prisma.user.findFirst({
          where: {
            OR: [{ email: item.landlordEmailOrPhone }, { phoneNumber: item.landlordEmailOrPhone }],
          },
        });

        if (!landlord) {
          throw new BadRequestException(
            `Landlord '${item.landlordEmailOrPhone}' not registered. Register landlord first.`,
          );
        }

        // 5. Generate slug
        const baseSlug = item.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
        const slug = `${baseSlug}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`;

        // 6. Create Property in PENDING_REVIEW status for audit & moderation
        const property = await this.prisma.property.create({
          data: {
            landlordId: landlord.id,
            localityId: locality.id,
            title: item.title,
            slug,
            description: item.description,
            eligibility: item.eligibility,
            propertyType: item.propertyType,
            status: PropertyStatus.PENDING_REVIEW,
            monthlyRentPkr: item.monthlyRentPkr,
            securityDepositPkr: item.securityDepositPkr,
            bedrooms: item.bedrooms,
            bathrooms: item.bathrooms,
            areaSqFt: item.areaSqFt || null,
            furnishing: item.furnishing || 'UNFURNISHED',
            address: item.address,
            latitude: item.latitude,
            longitude: item.longitude,
            isAvailable: true,
          },
        });

        results.successfulCount++;
        results.createdPropertyIds.push(property.id);
      } catch (err: any) {
        results.failedCount++;
        results.errors.push({
          index: i,
          title: item.title,
          reason: err?.message || 'Validation failed',
        });
      }
    }

    // Record audit log for operator
    await this.prisma.auditLog.create({
      data: {
        actorId: operatorUserId,
        action: 'BULK_PROPERTY_IMPORT',
        targetType: 'PropertyBatch',
        targetId: `batch-${Date.now()}`,
        after: {
          total: results.totalReceived,
          successful: results.successfulCount,
          failed: results.failedCount,
          operatorNotes: dto.operatorNotes,
        },
      },
    });

    return results;
  }

  /**
   * Calculates comprehensive listing quality score (0 - 100)
   */
  async calculateListingQuality(propertyId: string): Promise<QualityCheckResponseDto> {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        images: true,
        amenities: true,
        locality: true,
      },
    });

    if (!property) {
      throw new NotFoundException(`Property ${propertyId} not found`);
    }

    const titleLengthValid = property.title.trim().length >= 15;
    const descriptionDetailed = property.description.trim().length >= 60;
    const pricingRealistic = Number(property.monthlyRentPkr) >= 3000;
    const imagesCountSufficient = property.images.length >= 3;
    let locationInsidePeshawar = true;
    try {
      validatePeshawarCoordinates(Number(property.latitude), Number(property.longitude));
    } catch {
      locationInsidePeshawar = false;
    }

    let eligibilityMatched = true;
    try {
      validateEligibilityAndPropertyType(property.eligibility as any, property.propertyType as any);
    } catch {
      eligibilityMatched = false;
    }

    const amenitiesSpecified = property.amenities.length >= 2;

    let score = 0;
    if (titleLengthValid) score += 15;
    if (descriptionDetailed) score += 20;
    if (imagesCountSufficient) score += 25;
    if (amenitiesSpecified) score += 15;
    if (property.furnishing) score += 10;
    if (pricingRealistic) score += 15;

    const recommendations: string[] = [];
    if (!titleLengthValid)
      recommendations.push(
        'Add a descriptive title (at least 15 characters, e.g. "Spacious 2-Bed Portion in University Town")',
      );
    if (!descriptionDetailed)
      recommendations.push(
        'Expand property description to at least 60 characters explaining utilities, proximity to landmarks, etc.',
      );
    if (!imagesCountSufficient)
      recommendations.push(
        `Upload at least 3 high-quality photos (currently ${property.images.length})`,
      );
    if (!amenitiesSpecified)
      recommendations.push(
        'Select at least 2 amenities (e.g. Backup UPS/Generator, Water Bore, Fiber WiFi)',
      );
    if (!locationInsidePeshawar)
      recommendations.push(
        'Coordinates must be located inside official Peshawar municipal boundary',
      );

    return {
      propertyId: property.id,
      qualityScore: Math.min(100, score),
      isPublishReady:
        score >= 70 && imagesCountSufficient && locationInsidePeshawar && eligibilityMatched,
      checks: {
        titleLengthValid,
        descriptionDetailed,
        pricingRealistic,
        imagesCountSufficient,
        locationInsidePeshawar,
        eligibilityMatched,
        amenitiesSpecified,
      },
      recommendations,
    };
  }
}
