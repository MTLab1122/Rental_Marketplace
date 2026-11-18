import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { FeatureListingPlacementDto, LocalitySponsorshipDto } from './monetization.dto';
import { MonetizationFeature } from '@rental-peshawar/shared-types';

@Injectable()
export class MonetizationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Promotes property to Featured Listing Placement
   */
  async applyFeaturedPlacement(
    landlordId: string,
    dto: FeatureListingPlacementDto,
    isAdmin = false,
  ) {
    const property = await this.prisma.property.findUnique({
      where: { id: dto.propertyId },
    });

    if (!property) {
      throw new NotFoundException('Property not found');
    }

    if (!isAdmin && property.landlordId !== landlordId) {
      throw new ForbiddenException('You can only feature your own properties');
    }

    // Set featured flag
    const updated = await this.prisma.property.update({
      where: { id: property.id },
      data: { isFeatured: true },
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + dto.durationDays);

    await this.prisma.auditLog.create({
      data: {
        actorId: landlordId,
        action: 'PROPERTY_FEATURED_PROMOTION',
        targetType: 'Property',
        targetId: property.id,
        after: {
          durationDays: dto.durationDays,
          voucherCode: dto.voucherCode || 'PILOT_GRANT',
          expiresAt: expiresAt.toISOString(),
        },
      },
    });

    return {
      propertyId: updated.id,
      isFeatured: updated.isFeatured,
      durationDays: dto.durationDays,
      expiresAt: expiresAt.toISOString(),
      message: 'Property successfully upgraded to Featured Placement on Peshawar search.',
    };
  }

  /**
   * Register locality sponsorship for local business / agency
   */
  async registerLocalitySponsorship(userId: string, dto: LocalitySponsorshipDto) {
    const locality = await this.prisma.locality.findUnique({
      where: { id: dto.localityId },
    });

    if (!locality) {
      throw new NotFoundException('Locality not found');
    }

    const sponsorshipId = `spons-${Date.now()}`;
    await this.prisma.auditLog.create({
      data: {
        actorId: userId,
        action: 'LOCALITY_SPONSORSHIP_REGISTERED',
        targetType: 'Locality',
        targetId: locality.id,
        after: {
          sponsorshipId,
          sponsorName: dto.sponsorName,
          bannerText: dto.bannerText,
          voucherCode: dto.voucherCode || 'PILOT_SPONSOR',
        },
      },
    });

    return {
      sponsorshipId,
      localityName: locality.name,
      sponsorName: dto.sponsorName,
      status: 'ACTIVE_PILOT',
      message: `Locality '${locality.name}' sponsorship registered.`,
    };
  }

  /**
   * Monetization overview and gateway compliance status
   */
  async getMonetizationStatus(landlordId: string) {
    const featuredCount = await this.prisma.property.count({
      where: { landlordId, isFeatured: true },
    });

    return {
      landlordId,
      tier: 'PILOT_PRO_TIER',
      features: [
        {
          feature: MonetizationFeature.FEATURED_LISTING,
          active: featuredCount > 0,
          count: featuredCount,
        },
        {
          feature: MonetizationFeature.VERIFIED_BADGE,
          active: true,
          description: 'CNIC identity badge display on all listings',
        },
        {
          feature: MonetizationFeature.PROMOTED_SEARCH,
          active: true,
          description: 'Priority placement in locality search results',
        },
        {
          feature: MonetizationFeature.HOSTEL_SAAS,
          active: true,
          description: 'Multi-room hostel and portion management dashboard',
        },
      ],
      paymentGatewayCompliance: {
        status: 'PILOT_MODE',
        note: 'Live credit card / mobile wallet processing will be activated upon integration of a State Bank of Pakistan regulated gateway (1Link / JazzCash / EasyPaisa / PayFast). Currently operating on pilot credits and free verified tier.',
      },
    };
  }
}
