import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  TrustBadge,
  TrustEventType,
  ReviewStatus,
  InquiryStatus,
  PropertyStatus,
} from '@rental-peshawar/shared-types';

@Injectable()
export class ReputationService {
  private readonly logger = new Logger(ReputationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Calculates comprehensive Landlord Reputation metrics and Trust Badges
   */
  async calculateLandlordReputation(landlordId: string) {
    const landlord = await this.prisma.user.findUnique({
      where: { id: landlordId },
      include: {
        landlordProfile: true,
        properties: { where: { deletedAt: null } },
      },
    });

    if (!landlord) {
      throw new NotFoundException(`Landlord ${landlordId} not found`);
    }

    // 1. Review Metrics
    const reviews = await this.prisma.review.findMany({
      where: {
        landlordId,
        status: ReviewStatus.APPROVED,
        deletedAt: null,
      },
    });

    const totalReviews = reviews.length;
    const averageRating =
      totalReviews > 0
        ? Number((reviews.reduce((acc, r) => acc + r.overallRating, 0) / totalReviews).toFixed(2))
        : 5.0;

    // 2. Inquiries & Response Performance
    const inquiries = await this.prisma.inquiry.findMany({
      where: { landlordId },
      select: {
        id: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const totalInquiries = inquiries.length;
    const repliedInquiries = inquiries.filter(
      (inq) =>
        inq.status === InquiryStatus.REPLIED ||
        inq.status === InquiryStatus.ACCEPTED ||
        inq.status === InquiryStatus.CLOSED,
    );
    const acceptedInquiries = inquiries.filter((inq) => inq.status === InquiryStatus.ACCEPTED);

    const responseRatePercent =
      totalInquiries > 0
        ? Number(((repliedInquiries.length / totalInquiries) * 100).toFixed(2))
        : 100.0;

    const inquiryAcceptanceRatePercent =
      totalInquiries > 0
        ? Number(((acceptedInquiries.length / totalInquiries) * 100).toFixed(2))
        : 0.0;

    // Calculate response time in minutes for replied inquiries
    let totalResponseMinutes = 0;
    let timedInquiriesCount = 0;
    for (const inq of repliedInquiries) {
      const diffMs = inq.updatedAt.getTime() - inq.createdAt.getTime();
      if (diffMs > 0 && diffMs < 7 * 24 * 3600 * 1000) {
        totalResponseMinutes += Math.round(diffMs / (60 * 1000));
        timedInquiriesCount++;
      }
    }

    const averageResponseTimeMinutes =
      timedInquiriesCount > 0 ? Math.round(totalResponseMinutes / timedInquiriesCount) : 60;

    // 3. Verified Listings Percentage
    const totalProperties = landlord.properties.length;
    const verifiedProperties = landlord.properties.filter(
      (p) => p.status === PropertyStatus.APPROVED,
    ).length;
    const verifiedListingPercent =
      totalProperties > 0
        ? Number(((verifiedProperties / totalProperties) * 100).toFixed(2))
        : 100.0;

    // 4. Review Report Rate
    const reviewReportsCount = await this.prisma.reviewReport.count({
      where: {
        review: { landlordId },
      },
    });
    const reviewReportRatePercent =
      totalReviews > 0 ? Number(((reviewReportsCount / totalReviews) * 100).toFixed(2)) : 0.0;

    // 5. Composite Trust Score (0.00 to 100.00)
    // Formula components are computed securely server-side without leaking weights
    const isCnicVerified = landlord.isVerified || !!landlord.landlordProfile?.isCnicVerified;
    const verificationScore = isCnicVerified ? 30.0 : 0.0;
    const ratingScore = (averageRating / 5.0) * 35.0; // max 35
    const responsivenessScore = (responseRatePercent / 100.0) * 20.0; // max 20
    const listingIntegrityScore = (verifiedListingPercent / 100.0) * 15.0; // max 15
    const reportDeduction = Math.min(20.0, reviewReportRatePercent * 0.5);

    const rawTrustScore = Math.max(
      0.0,
      Math.min(
        100.0,
        verificationScore +
          ratingScore +
          responsivenessScore +
          listingIntegrityScore -
          reportDeduction,
      ),
    );
    const trustScore = Number(rawTrustScore.toFixed(2));

    // 6. Earned Badges
    const earnedBadges: TrustBadge[] = [];

    if (isCnicVerified) {
      earnedBadges.push(TrustBadge.VERIFIED_LANDLORD);
    }

    if (responseRatePercent >= 85.0 && averageResponseTimeMinutes <= 120 && totalInquiries >= 2) {
      earnedBadges.push(TrustBadge.FAST_RESPONDER);
    }

    if (averageRating >= 4.5 && totalReviews >= 3) {
      earnedBadges.push(TrustBadge.HIGHLY_RATED);
    }

    return {
      landlordId,
      fullName: landlord.fullName,
      averageRating,
      totalReviews,
      responseRatePercent,
      averageResponseTimeMinutes,
      verifiedListingPercent,
      inquiryAcceptanceRatePercent,
      reviewReportRatePercent,
      trustScore,
      badges: earnedBadges,
      isCnicVerified,
    };
  }

  /**
   * Calculates Property Quality Score from image completeness, description, review ratings, and freshness
   */
  async calculatePropertyQuality(propertyId: string) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        images: true,
        amenities: true,
        locality: true,
        landlord: {
          include: { landlordProfile: true },
        },
      },
    });

    if (!property) {
      throw new NotFoundException(`Property ${propertyId} not found`);
    }

    // 1. Image Completeness Score (max 25)
    const imagesCount = property.images.length;
    let imageCompletenessScore = 0;
    if (imagesCount >= 5) imageCompletenessScore = 25.0;
    else if (imagesCount >= 3) imageCompletenessScore = 20.0;
    else if (imagesCount >= 1) imageCompletenessScore = 10.0;

    // 2. Description Completeness Score (max 20)
    const descLength = property.description?.trim().length || 0;
    let descriptionCompletenessScore = 0;
    if (descLength >= 150) descriptionCompletenessScore = 20.0;
    else if (descLength >= 60) descriptionCompletenessScore = 15.0;
    else if (descLength >= 20) descriptionCompletenessScore = 8.0;

    // 3. Verified Landlord Bonus (max 15)
    const isLandlordVerified =
      property.landlord.isVerified || !!property.landlord.landlordProfile?.isCnicVerified;
    const verifiedLandlordBonus = isLandlordVerified ? 15.0 : 0.0;

    // 4. Review Rating Score (max 20)
    const propertyReviews = await this.prisma.review.findMany({
      where: {
        propertyId,
        status: ReviewStatus.APPROVED,
        deletedAt: null,
      },
    });

    const reviewsCount = propertyReviews.length;
    const avgReviewRating =
      reviewsCount > 0
        ? propertyReviews.reduce((sum, r) => sum + r.overallRating, 0) / reviewsCount
        : 5.0;
    const reviewRatingScore = Number(((avgReviewRating / 5.0) * 20.0).toFixed(2));

    // 5. Response Rate Score (max 10)
    const landlordRep = await this.calculateLandlordReputation(property.landlordId);
    const responseRateScore = Number(((landlordRep.responseRatePercent / 100.0) * 10.0).toFixed(2));

    // 6. Complaint Penalty (0 to -15)
    const reportsOnProperty = await this.prisma.report.count({
      where: {
        targetType: 'PROPERTY',
        targetId: propertyId,
      },
    });
    const complaintPenalty = Math.min(15.0, reportsOnProperty * 5.0);

    // 7. Freshness Score (max 10)
    const ageDays = (Date.now() - property.createdAt.getTime()) / (1000 * 3600 * 24);
    let freshnessScore = 5.0;
    if (ageDays <= 14) freshnessScore = 10.0;
    else if (ageDays <= 60) freshnessScore = 8.0;

    // Overall Quality Score (0 to 100)
    const rawQuality = Math.max(
      0.0,
      Math.min(
        100.0,
        imageCompletenessScore +
          descriptionCompletenessScore +
          verifiedLandlordBonus +
          reviewRatingScore +
          responseRateScore +
          freshnessScore -
          complaintPenalty,
      ),
    );
    const overallQualityScore = Number(rawQuality.toFixed(2));

    // Property Badges
    const propertyBadges: TrustBadge[] = [];
    if (ageDays <= 14) {
      propertyBadges.push(TrustBadge.NEW_LISTING);
    }
    if (overallQualityScore >= 85.0 && avgReviewRating >= 4.5) {
      propertyBadges.push(TrustBadge.TOP_LISTING);
    }
    if (property.isFeatured) {
      propertyBadges.push(TrustBadge.PREMIUM_LISTING);
    }

    return {
      propertyId,
      overallQualityScore,
      imageCompletenessScore,
      descriptionCompletenessScore,
      verifiedLandlordBonus,
      reviewRatingScore,
      responseRateScore,
      complaintPenalty,
      freshnessScore,
      isPublishReady: overallQualityScore >= 65.0 && imagesCount >= 3,
      badges: propertyBadges,
      averageReviewRating: Number(avgReviewRating.toFixed(2)),
      reviewsCount,
    };
  }

  /**
   * Record Trust Event for auditable reputation history
   */
  async recordTrustEvent(
    entityType: 'LANDLORD' | 'PROPERTY' | 'TENANT',
    entityId: string,
    eventType: TrustEventType,
    impactDelta: number,
    metadata?: Record<string, any>,
  ) {
    return this.prisma.trustEvent.create({
      data: {
        entityType,
        entityId,
        eventType,
        impactDelta,
        metadata: metadata ? (metadata as any) : undefined,
      },
    });
  }

  /**
   * Snapshot execution (daily scheduled task)
   */
  async generateDailySnapshots() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Snapshot all active Landlords
    const landlords = await this.prisma.user.findMany({
      where: {
        roles: { some: { role: { name: 'LANDLORD' } } },
        isSuspended: false,
      },
      select: { id: true },
    });

    let landlordSnapshotsCount = 0;
    for (const ll of landlords) {
      try {
        const rep = await this.calculateLandlordReputation(ll.id);
        await this.prisma.landlordReputationSnapshot.upsert({
          where: {
            landlordId_snapshotDate: {
              landlordId: ll.id,
              snapshotDate: today,
            },
          },
          update: {
            averageRating: rep.averageRating,
            totalReviews: rep.totalReviews,
            responseRatePercent: rep.responseRatePercent,
            averageResponseTimeMinutes: rep.averageResponseTimeMinutes,
            verifiedListingPercent: rep.verifiedListingPercent,
            inquiryAcceptanceRatePercent: rep.inquiryAcceptanceRatePercent,
            reviewReportRatePercent: rep.reviewReportRatePercent,
            trustScore: rep.trustScore,
            badges: rep.badges,
          },
          create: {
            landlordId: ll.id,
            snapshotDate: today,
            averageRating: rep.averageRating,
            totalReviews: rep.totalReviews,
            responseRatePercent: rep.responseRatePercent,
            averageResponseTimeMinutes: rep.averageResponseTimeMinutes,
            verifiedListingPercent: rep.verifiedListingPercent,
            inquiryAcceptanceRatePercent: rep.inquiryAcceptanceRatePercent,
            reviewReportRatePercent: rep.reviewReportRatePercent,
            trustScore: rep.trustScore,
            badges: rep.badges,
          },
        });
        landlordSnapshotsCount++;
      } catch (err: any) {
        this.logger.warn(`Failed snapshot for landlord ${ll.id}: ${err?.message}`);
      }
    }

    // 2. Snapshot all active Properties
    const properties = await this.prisma.property.findMany({
      where: {
        status: PropertyStatus.APPROVED,
        deletedAt: null,
      },
      select: { id: true },
    });

    let propertySnapshotsCount = 0;
    for (const prop of properties) {
      try {
        const q = await this.calculatePropertyQuality(prop.id);
        await this.prisma.propertyQualitySnapshot.upsert({
          where: {
            propertyId_snapshotDate: {
              propertyId: prop.id,
              snapshotDate: today,
            },
          },
          update: {
            overallQualityScore: q.overallQualityScore,
            imageCompletenessScore: q.imageCompletenessScore,
            descriptionCompletenessScore: q.descriptionCompletenessScore,
            verifiedLandlordBonus: q.verifiedLandlordBonus,
            reviewRatingScore: q.reviewRatingScore,
            responseRateScore: q.responseRateScore,
            complaintPenalty: q.complaintPenalty,
            freshnessScore: q.freshnessScore,
            isPublishReady: q.isPublishReady,
          },
          create: {
            propertyId: prop.id,
            snapshotDate: today,
            overallQualityScore: q.overallQualityScore,
            imageCompletenessScore: q.imageCompletenessScore,
            descriptionCompletenessScore: q.descriptionCompletenessScore,
            verifiedLandlordBonus: q.verifiedLandlordBonus,
            reviewRatingScore: q.reviewRatingScore,
            responseRateScore: q.responseRateScore,
            complaintPenalty: q.complaintPenalty,
            freshnessScore: q.freshnessScore,
            isPublishReady: q.isPublishReady,
          },
        });
        propertySnapshotsCount++;
      } catch (err: any) {
        this.logger.warn(`Failed snapshot for property ${prop.id}: ${err?.message}`);
      }
    }

    return {
      snapshotDate: today.toISOString().split('T')[0],
      landlordSnapshotsCount,
      propertySnapshotsCount,
    };
  }
}
