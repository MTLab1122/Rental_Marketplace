import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateSavedSearchDto, CreateLandlordReviewDto, ClaimReferralDto } from './growth.dto';
import { PropertyStatus, InquiryStatus } from '@prisma/client';

@Injectable()
export class GrowthService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generates or retrieves user's referral code and metrics
   */
  async getReferralProgram(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { tenantProfile: true, landlordProfile: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const type = user.landlordProfile ? 'LANDLORD' : user.tenantProfile?.tenantType || 'TENANT';
    const referralCode = `PESH-${type}-${user.id.slice(0, 6).toUpperCase()}`;
    const referralUrl = `https://rentalpeshawar.pk/register?ref=${referralCode}`;

    const successfulReferrals = await this.prisma.auditLog.count({
      where: {
        action: 'REFERRAL_CLAIMED',
        targetId: referralCode,
      },
    });

    return {
      userId: user.id,
      referralType: type,
      referralCode,
      referralUrl,
      successfulReferrals,
      rewardTiers: [
        { count: 1, reward: 'Featured Listing or Priority Support' },
        { count: 3, reward: 'Silver Badge & Fee Waiver' },
        { count: 5, reward: 'Gold Community Partner Status' },
      ],
    };
  }

  /**
   * Claim referral code during onboarding
   */
  async claimReferral(dto: ClaimReferralDto, newUserId: string) {
    const alreadyClaimed = await this.prisma.auditLog.findFirst({
      where: {
        actorId: newUserId,
        action: 'REFERRAL_CLAIMED',
      },
    });

    if (alreadyClaimed) {
      throw new BadRequestException('Referral bonus already claimed for this account');
    }

    await this.prisma.auditLog.create({
      data: {
        actorId: newUserId,
        action: 'REFERRAL_CLAIMED',
        targetType: 'Referral',
        targetId: dto.referralCode,
        after: {
          claimedAt: new Date().toISOString(),
          referralType: dto.referralType,
        },
      },
    });

    return {
      success: true,
      message: `Referral code ${dto.referralCode} claimed successfully. Welcome to Rental Peshawar!`,
    };
  }

  /**
   * Save a search configuration for alerts
   */
  async createSavedSearch(userId: string, dto: CreateSavedSearchDto) {
    const searchId = `search-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    await this.prisma.auditLog.create({
      data: {
        actorId: userId,
        action: 'SAVED_SEARCH_CREATED',
        targetType: 'SavedSearch',
        targetId: searchId,
        after: {
          title: dto.title,
          eligibility: dto.eligibility,
          localityId: dto.localityId,
          propertyType: dto.propertyType,
          minRentPkr: dto.minRentPkr,
          maxRentPkr: dto.maxRentPkr,
          bedrooms: dto.bedrooms,
          alertsEnabled: dto.alertsEnabled !== false,
          createdAt: new Date().toISOString(),
        },
      },
    });

    return {
      id: searchId,
      ...dto,
      message: 'Saved search and new-listing alerts configured.',
    };
  }

  /**
   * Retrieve active saved searches for a user
   */
  async getSavedSearches(userId: string) {
    const logs = await this.prisma.auditLog.findMany({
      where: {
        actorId: userId,
        targetType: 'SavedSearch',
        action: 'SAVED_SEARCH_CREATED',
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return logs.map((log: any) => ({
      id: log.targetId,
      createdAt: log.createdAt,
      ...(log.after as Record<string, any>),
    }));
  }

  /**
   * Delete saved search
   */
  async deleteSavedSearch(userId: string, searchId: string) {
    await this.prisma.auditLog.deleteMany({
      where: {
        actorId: userId,
        targetType: 'SavedSearch',
        targetId: searchId,
      },
    });

    return { success: true, message: 'Saved search removed.' };
  }

  /**
   * Record recently viewed property
   */
  async recordRecentlyViewed(userId: string, propertyId: string) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    await this.prisma.propertyViewEvent.create({
      data: {
        propertyId,
        viewerId: userId,
        localityId: property.localityId,
        source: 'WEB',
      },
    });

    return { success: true };
  }

  /**
   * Get recently viewed properties for the current user
   */
  async getRecentlyViewed(userId: string) {
    const recentEvents = await this.prisma.propertyViewEvent.findMany({
      where: { viewerId: userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      distinct: ['propertyId'],
      include: {
        property: {
          include: {
            locality: true,
            images: { where: { isPrimary: true }, take: 1 },
          },
        },
      },
    });

    return recentEvents
      .filter(
        (e: any) =>
          e.property && e.property.status === PropertyStatus.APPROVED && e.property.isAvailable,
      )
      .map((e: any) => e.property);
  }

  /**
   * Similar-property recommendations:
   * Strictly adheres to eligibility segregation (Student vs Family)!
   */
  async getSimilarProperties(propertyId: string) {
    const target = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!target) {
      throw new NotFoundException('Target property not found');
    }

    const minRent = Number(target.monthlyRentPkr) * 0.7;
    const maxRent = Number(target.monthlyRentPkr) * 1.3;

    const similar = await this.prisma.property.findMany({
      where: {
        id: { not: target.id },
        eligibility: target.eligibility, // STRICT SEGREGATION ENFORCED
        status: PropertyStatus.APPROVED,
        isAvailable: true,
        deletedAt: null,
        OR: [
          { localityId: target.localityId },
          {
            monthlyRentPkr: {
              gte: minRent,
              lte: maxRent,
            },
          },
        ],
      },
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: {
        locality: true,
        images: { where: { isPrimary: true }, take: 1 },
      },
    });

    return similar;
  }

  /**
   * Submit review and rating for a Landlord
   * Prerequisite: Tenant must have had an inquiry or rental interaction
   */
  async createLandlordReview(tenantUserId: string, dto: CreateLandlordReviewDto) {
    // 1. Verify landlord exists
    const landlord = await this.prisma.user.findUnique({
      where: { id: dto.landlordId },
    });
    if (!landlord) {
      throw new NotFoundException('Landlord not found');
    }

    // 2. Verify prior interaction
    const priorInquiry = await this.prisma.inquiry.findFirst({
      where: {
        tenantId: tenantUserId,
        landlordId: dto.landlordId,
        status: {
          in: [
            InquiryStatus.SEEN,
            InquiryStatus.REPLIED,
            InquiryStatus.ACCEPTED,
            InquiryStatus.CLOSED,
          ],
        },
      },
    });

    if (!priorInquiry) {
      throw new BadRequestException(
        'Reviews require a prior completed or acknowledged inquiry interaction with this landlord.',
      );
    }

    // 3. Store review in AuditLog
    const reviewId = `rev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    await this.prisma.auditLog.create({
      data: {
        actorId: tenantUserId,
        action: 'LANDLORD_REVIEW_CREATED',
        targetType: 'LandlordReview',
        targetId: reviewId,
        after: {
          landlordId: dto.landlordId,
          propertyId: dto.propertyId || null,
          rating: dto.rating,
          communicationRating: dto.communicationRating || dto.rating,
          accuracyRating: dto.accuracyRating || dto.rating,
          comment: dto.comment,
          createdAt: new Date().toISOString(),
        },
      },
    });

    return {
      reviewId,
      success: true,
      message:
        'Landlord review submitted successfully. Thank you for building community trust in Peshawar.',
    };
  }

  /**
   * Landlord trust badges, responsiveness score, and verified state
   */
  async getLandlordBadges(landlordUserId: string) {
    const landlord = await this.prisma.user.findUnique({
      where: { id: landlordUserId },
      include: { landlordProfile: true },
    });

    if (!landlord) {
      throw new NotFoundException('Landlord not found');
    }

    // Inquiries stats
    const [totalInquiries, repliedInquiries] = await Promise.all([
      this.prisma.inquiry.count({ where: { landlordId: landlordUserId } }),
      this.prisma.inquiry.count({
        where: {
          landlordId: landlordUserId,
          status: { in: [InquiryStatus.REPLIED, InquiryStatus.ACCEPTED, InquiryStatus.CLOSED] },
        },
      }),
    ]);

    const responseRate =
      totalInquiries > 0 ? Math.round((repliedInquiries / totalInquiries) * 100) : 100;

    // Reviews stats
    const reviewLogs = await this.prisma.auditLog.findMany({
      where: {
        action: 'LANDLORD_REVIEW_CREATED',
        targetType: 'LandlordReview',
      },
      take: 50,
    });

    const landlordReviews = reviewLogs
      .map((l: any) => l.after as Record<string, any>)
      .filter((r: any) => r?.landlordId === landlordUserId);

    const avgRating =
      landlordReviews.length > 0
        ? Number(
            (
              landlordReviews.reduce((sum: number, r: any) => sum + (r.rating || 5), 0) /
              landlordReviews.length
            ).toFixed(1),
          )
        : 5.0;

    const isCnicVerified = landlord.isVerified || !!landlord.landlordProfile?.isCnicVerified;

    return {
      landlordId: landlord.id,
      fullName: landlord.fullName,
      badges: {
        isVerifiedLandlord: isCnicVerified,
        isQuickResponder: responseRate >= 80 && totalInquiries >= 2,
        isTopRated: avgRating >= 4.5 && landlordReviews.length >= 3,
      },
      metrics: {
        responseRatePercent: responseRate,
        averageRating: avgRating,
        totalReviewsCount: landlordReviews.length,
        totalInquiriesHandled: totalInquiries,
      },
    };
  }

  /**
   * Structured Data for SEO (Schema.org / JSON-LD)
   */
  async getPropertyStructuredData(propertyId: string) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        locality: true,
        images: true,
      },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    return {
      '@context': 'https://schema.org',
      '@type': property.propertyType === 'APARTMENT' ? 'Apartment' : 'SingleFamilyResidence',
      name: property.title,
      description: property.description,
      url: `https://rentalpeshawar.pk/properties/${property.slug || property.id}`,
      image: property.images.map((img: any) => img.url),
      address: {
        '@type': 'PostalAddress',
        streetAddress: property.address,
        addressLocality: property.locality?.name || 'Peshawar',
        addressRegion: 'Khyber Pakhtunkhwa',
        postalCode: property.locality?.postalCode || '25000',
        addressCountry: 'PK',
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: Number(property.latitude),
        longitude: Number(property.longitude),
      },
      offers: {
        '@type': 'Offer',
        price: Number(property.monthlyRentPkr),
        priceCurrency: 'PKR',
        availability: property.isAvailable
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
        businessFunction: 'http://purl.org/goodrelations/v1#LeaseOut',
      },
      numberOfBedrooms: property.bedrooms,
      numberOfBathroomsTotal: property.bathrooms,
    };
  }

  /**
   * Dynamic XML Sitemap generation for SEO indexing
   */
  async generateSitemapXml(): Promise<string> {
    const activeProperties = await this.prisma.property.findMany({
      where: {
        status: PropertyStatus.APPROVED,
        isAvailable: true,
        deletedAt: null,
      },
      select: { slug: true, id: true, updatedAt: true },
      take: 1000,
    });

    const activeLocalities = await this.prisma.locality.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    });

    const nowIso = new Date().toISOString().split('T')[0];

    const propertyUrls = activeProperties
      .map(
        (p: any) => `  <url>
    <loc>https://rentalpeshawar.pk/properties/${p.slug || p.id}</loc>
    <lastmod>${p.updatedAt.toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`,
      )
      .join('\n');

    const localityUrls = activeLocalities
      .map(
        (l: any) => `  <url>
    <loc>https://rentalpeshawar.pk/localities/${l.slug}</loc>
    <lastmod>${l.updatedAt.toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`,
      )
      .join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://rentalpeshawar.pk/</loc>
    <lastmod>${nowIso}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://rentalpeshawar.pk/student-rentals</loc>
    <lastmod>${nowIso}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.95</priority>
  </url>
  <url>
    <loc>https://rentalpeshawar.pk/family-rentals</loc>
    <lastmod>${nowIso}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.95</priority>
  </url>
${localityUrls}
${propertyUrls}
</urlset>`;
  }

  /**
   * WhatsApp and Deep Link sharing data
   */
  async getShareLinks(propertyId: string) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      include: { locality: true },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    const rentFormatted = `PKR ${Number(property.monthlyRentPkr).toLocaleString()}/month`;
    const canonicalUrl = `https://rentalpeshawar.pk/properties/${property.slug || property.id}`;
    const deepLink = `rentalpeshawar://property/${property.id}`;

    const text = `🏠 ${property.title}\n📍 Locality: ${property.locality?.name || 'Peshawar'}\n💰 Rent: ${rentFormatted}\n🎓 Eligibility: ${property.eligibility.replace('_', ' ')}\n\nCheck details on Rental Peshawar:\n${canonicalUrl}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;

    return {
      propertyId: property.id,
      canonicalUrl,
      deepLink,
      whatsappUrl,
      shareText: text,
    };
  }

  /**
   * Localized landing page benchmarks for Peshawar localities
   */
  async getLocalityLandingPage(slug: string) {
    const locality = await this.prisma.locality.findUnique({
      where: { slug },
      include: {
        properties: {
          where: {
            status: PropertyStatus.APPROVED,
            isAvailable: true,
            deletedAt: null,
          },
          include: {
            images: { where: { isPrimary: true }, take: 1 },
          },
          take: 12,
        },
      },
    });

    if (!locality) {
      throw new NotFoundException(`Locality '${slug}' not found`);
    }

    const studentProps = locality.properties.filter((p: any) => p.eligibility === 'STUDENTS_ONLY');
    const familyProps = locality.properties.filter((p: any) => p.eligibility === 'FAMILIES_ONLY');

    const avgStudentRent =
      studentProps.length > 0
        ? Math.round(
            studentProps.reduce((sum: number, p: any) => sum + Number(p.monthlyRentPkr), 0) /
              studentProps.length,
          )
        : null;

    const avgFamilyRent =
      familyProps.length > 0
        ? Math.round(
            familyProps.reduce((sum: number, p: any) => sum + Number(p.monthlyRentPkr), 0) /
              familyProps.length,
          )
        : null;

    return {
      locality: {
        id: locality.id,
        name: locality.name,
        slug: locality.slug,
        description: locality.description,
        postalCode: locality.postalCode,
        latitude: locality.latitude,
        longitude: locality.longitude,
      },
      stats: {
        totalActiveListings: locality.properties.length,
        studentListingsCount: studentProps.length,
        familyListingsCount: familyProps.length,
        averageStudentRentPkr: avgStudentRent,
        averageFamilyRentPkr: avgFamilyRent,
      },
      featuredListings: locality.properties.slice(0, 6),
    };
  }

  /**
   * Admin SEO health metrics, metadata alerts, and indexability report
   */
  async getSeoHealthReport() {
    const totalIndexable = await this.prisma.property.count({
      where: {
        status: PropertyStatus.APPROVED,
        isAvailable: true,
        deletedAt: null,
      },
    });

    const missingImagesCount = await this.prisma.property.count({
      where: {
        status: PropertyStatus.APPROVED,
        isAvailable: true,
        deletedAt: null,
        images: { none: {} },
      },
    });

    const activeLocalities = await this.prisma.locality.findMany({
      where: { isActive: true },
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
    });

    const localitiesReport = activeLocalities.map((loc: any) => ({
      id: loc.id,
      name: loc.name,
      slug: loc.slug,
      activePropertiesCount: loc._count.properties,
      hasSufficientInventory: loc._count.properties > 0,
      updatedAt: loc.updatedAt,
    }));

    const alerts: string[] = [];
    if (missingImagesCount > 0) {
      alerts.push(
        `${missingImagesCount} active properties have no images and will be penalized in image search.`,
      );
    }

    const thinLocalities = localitiesReport.filter((l: any) => l.activePropertiesCount === 0);
    if (thinLocalities.length > 0) {
      alerts.push(
        `${thinLocalities.length} active localities have 0 live listings (risk of thin content).`,
      );
    }

    return {
      totalIndexableProperties: totalIndexable,
      totalActiveLocalities: activeLocalities.length,
      missingImagesCount,
      sitemapUrl: 'https://rentalpeshawar.pk/sitemap.xml',
      sitemapStatus: 'HEALTHY',
      lastSitemapGeneratedAt: new Date().toISOString(),
      alerts,
      localities: localitiesReport,
    };
  }
}
