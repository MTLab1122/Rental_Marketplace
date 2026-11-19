import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ReputationService } from './reputation.service';
import {
  CreateReviewDto,
  UpdateReviewDto,
  CreateReviewReplyDto,
  ReportReviewDto,
  ModerateReviewDto,
  QueryReviewsDto,
} from './dto/review.dto';
import {
  ReviewStatus,
  InquiryStatus,
  TrustEventType,
  ReviewModerationAction,
} from '@rental-peshawar/shared-types';

@Injectable()
export class ReviewService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reputationService: ReputationService,
  ) {}

  /**
   * Submit Review for a Property
   * Non-negotiable rules:
   * 1. Only a tenant with an ACCEPTED inquiry can review.
   * 2. Exactly one review per tenant per property per accepted inquiry.
   * 3. Multi-criteria ratings (1-5) and written comment.
   */
  async createReview(
    tenantId: string,
    propertyId: string,
    dto: CreateReviewDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // 1. Verify property
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });
    if (!property) {
      throw new NotFoundException(`Property ${propertyId} not found`);
    }

    // 2. Verify accepted inquiry
    const inquiry = await this.prisma.inquiry.findFirst({
      where: {
        id: dto.inquiryId,
        propertyId,
        tenantId,
      },
    });

    if (!inquiry) {
      throw new NotFoundException('Inquiry record matching this property and tenant was not found');
    }

    if (inquiry.status !== InquiryStatus.ACCEPTED) {
      throw new ForbiddenException(
        'Review rejected: Only tenants with an ACCEPTED inquiry can submit a review.',
      );
    }

    // 3. Verify duplicate check
    const existingReview = await this.prisma.review.findFirst({
      where: {
        tenantId,
        propertyId,
        inquiryId: dto.inquiryId,
      },
    });

    if (existingReview) {
      throw new ConflictException(
        'Duplicate review: You have already submitted a review for this accepted inquiry.',
      );
    }

    // 4. Anti-fraud & Moderation Heuristics
    let initialStatus = ReviewStatus.APPROVED;

    // A. Profanity / Spam check
    const spamRegex = /(https?:\/\/|www\.|\+?92\d{10}|03\d{9})/gi;
    if (spamRegex.test(dto.comment)) {
      initialStatus = ReviewStatus.PENDING;
    }

    // B. Account age check (< 10 minutes)
    const tenantUser = await this.prisma.user.findUnique({ where: { id: tenantId } });
    if (tenantUser) {
      const ageMinutes = (Date.now() - tenantUser.createdAt.getTime()) / (1000 * 60);
      if (ageMinutes < 10) {
        initialStatus = ReviewStatus.PENDING;
      }
    }

    // C. Same IP velocity check (> 3 reviews in last hour)
    if (ipAddress) {
      const recentIpReviews = await this.prisma.review.count({
        where: {
          ipAddress,
          createdAt: { gte: new Date(Date.now() - 3600 * 1000) },
        },
      });
      if (recentIpReviews >= 3) {
        initialStatus = ReviewStatus.PENDING;
      }
    }

    // 5. Create Review
    const review = await this.prisma.review.create({
      data: {
        propertyId,
        tenantId,
        landlordId: property.landlordId,
        inquiryId: dto.inquiryId,
        overallRating: dto.overallRating,
        communicationRating: dto.communicationRating,
        accuracyRating: dto.accuracyRating,
        safetyRating: dto.safetyRating,
        valueForMoneyRating: dto.valueForMoneyRating,
        comment: dto.comment,
        images: dto.images ? dto.images : undefined,
        status: initialStatus,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      },
      include: {
        tenant: {
          select: {
            id: true,
            fullName: true,
            tenantProfile: true,
          },
        },
      },
    });

    // 6. Record Trust Event
    await this.reputationService.recordTrustEvent(
      'PROPERTY',
      propertyId,
      TrustEventType.REVIEW_RECEIVED,
      dto.overallRating >= 4 ? 2.0 : -2.0,
      { reviewId: review.id, rating: dto.overallRating },
    );

    return review;
  }

  /**
   * Public approved reviews for a property with ratings summary
   */
  async getPropertyReviews(propertyId: string, query?: QueryReviewsDto) {
    const page = Math.max(1, Number(query?.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(query?.limit) || 10));
    const skip = (page - 1) * limit;

    const where = {
      propertyId,
      status: ReviewStatus.APPROVED,
      deletedAt: null,
    };

    const orderBy: any =
      query?.sortBy === 'highest_rated'
        ? { overallRating: 'desc' }
        : query?.sortBy === 'lowest_rated'
          ? { overallRating: 'asc' }
          : { createdAt: 'desc' };

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          tenant: {
            select: {
              fullName: true,
              tenantProfile: { select: { tenantType: true } },
            },
          },
          reply: {
            where: { status: ReviewStatus.APPROVED },
            include: {
              landlord: { select: { fullName: true } },
            },
          },
        },
      }),
      this.prisma.review.count({ where }),
    ]);

    // Compute detailed breakdown summary
    const allApproved = await this.prisma.review.findMany({
      where,
      select: {
        overallRating: true,
        communicationRating: true,
        accuracyRating: true,
        safetyRating: true,
        valueForMoneyRating: true,
      },
    });

    const count = allApproved.length;
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let sumOverall = 0;
    let sumComm = 0;
    let sumAcc = 0;
    let sumSafety = 0;
    let sumVal = 0;

    for (const r of allApproved) {
      distribution[r.overallRating] = (distribution[r.overallRating] || 0) + 1;
      sumOverall += r.overallRating;
      sumComm += r.communicationRating;
      sumAcc += r.accuracyRating;
      sumSafety += r.safetyRating;
      sumVal += r.valueForMoneyRating;
    }

    const summary = {
      totalReviews: count,
      averageRating: count > 0 ? Number((sumOverall / count).toFixed(2)) : 0,
      distribution,
      criteriaAverages: {
        communication: count > 0 ? Number((sumComm / count).toFixed(2)) : 0,
        accuracy: count > 0 ? Number((sumAcc / count).toFixed(2)) : 0,
        safety: count > 0 ? Number((sumSafety / count).toFixed(2)) : 0,
        valueForMoney: count > 0 ? Number((sumVal / count).toFixed(2)) : 0,
      },
    };

    return {
      items: reviews,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      summary,
    };
  }

  /**
   * Reviews created by the currently authenticated tenant
   */
  async getTenantReviews(tenantId: string) {
    return this.prisma.review.findMany({
      where: {
        tenantId,
        deletedAt: null,
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            slug: true,
            locality: { select: { name: true } },
          },
        },
        reply: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Edit Review (strictly permitted only within 72 hours of creation)
   */
  async updateReview(tenantId: string, reviewId: string, dto: UpdateReviewDto) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review || review.deletedAt) {
      throw new NotFoundException(`Review ${reviewId} not found`);
    }

    if (review.tenantId !== tenantId) {
      throw new ForbiddenException('You can only edit your own reviews');
    }

    // 72-hour editing window constraint
    const elapsedMs = Date.now() - review.createdAt.getTime();
    const maxWindowMs = 72 * 3600 * 1000;
    if (elapsedMs > maxWindowMs) {
      throw new BadRequestException(
        'Review edit window expired: Reviews can only be edited within 72 hours of creation.',
      );
    }

    return this.prisma.review.update({
      where: { id: reviewId },
      data: {
        ...(dto.overallRating !== undefined && { overallRating: dto.overallRating }),
        ...(dto.communicationRating !== undefined && {
          communicationRating: dto.communicationRating,
        }),
        ...(dto.accuracyRating !== undefined && { accuracyRating: dto.accuracyRating }),
        ...(dto.safetyRating !== undefined && { safetyRating: dto.safetyRating }),
        ...(dto.valueForMoneyRating !== undefined && {
          valueForMoneyRating: dto.valueForMoneyRating,
        }),
        ...(dto.comment !== undefined && { comment: dto.comment }),
        ...(dto.images !== undefined && { images: dto.images }),
        isEdited: true,
        editedAt: new Date(),
      },
    });
  }

  /**
   * Delete Review (strictly permitted only within 72 hours of creation)
   */
  async deleteReview(tenantId: string, reviewId: string) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review || review.deletedAt) {
      throw new NotFoundException(`Review ${reviewId} not found`);
    }

    if (review.tenantId !== tenantId) {
      throw new ForbiddenException('You can only delete your own reviews');
    }

    // 72-hour deletion window constraint
    const elapsedMs = Date.now() - review.createdAt.getTime();
    const maxWindowMs = 72 * 3600 * 1000;
    if (elapsedMs > maxWindowMs) {
      throw new BadRequestException(
        'Review deletion window expired: Reviews cannot be deleted after 72 hours. You may report this review if it requires moderation.',
      );
    }

    await this.prisma.review.update({
      where: { id: reviewId },
      data: {
        deletedAt: new Date(),
        status: ReviewStatus.REMOVED,
      },
    });

    return {
      success: true,
      message: 'Review successfully deleted.',
    };
  }

  /**
   * Landlord reply to a review (once per review, only on own property)
   */
  async replyToReview(landlordId: string, reviewId: string, dto: CreateReviewReplyDto) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      include: { property: true, reply: true },
    });

    if (!review || review.deletedAt) {
      throw new NotFoundException(`Review ${reviewId} not found`);
    }

    if (review.landlordId !== landlordId && review.property.landlordId !== landlordId) {
      throw new ForbiddenException(
        'Unauthorized: Landlords can only reply to reviews on their own properties.',
      );
    }

    if (review.reply) {
      throw new ConflictException(
        'Duplicate reply: A landlord reply has already been submitted for this review.',
      );
    }

    return this.prisma.reviewReply.create({
      data: {
        reviewId,
        landlordId,
        content: dto.content,
        status: ReviewStatus.APPROVED,
      },
    });
  }

  /**
   * Community Report against an abusive review
   */
  async reportReview(reporterId: string, reviewId: string, dto: ReportReviewDto) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review || review.deletedAt) {
      throw new NotFoundException(`Review ${reviewId} not found`);
    }

    const report = await this.prisma.reviewReport.create({
      data: {
        reviewId,
        reporterId,
        reason: dto.reason,
        details: dto.details,
      },
    });

    // Auto-quarantine: If 3 or more reports are filed, automatically hide pending moderation
    const reportCount = await this.prisma.reviewReport.count({
      where: { reviewId },
    });

    if (reportCount >= 3 && review.status === ReviewStatus.APPROVED) {
      await this.prisma.review.update({
        where: { id: reviewId },
        data: { status: ReviewStatus.HIDDEN },
      });
      await this.reputationService.recordTrustEvent(
        'PROPERTY',
        review.propertyId,
        TrustEventType.REVIEW_REPORTED,
        -5.0,
        { reviewId, reportCount },
      );
    }

    return report;
  }

  /**
   * Admin Review Moderation Queue
   */
  async getAdminReviews(query?: QueryReviewsDto) {
    const page = Math.max(1, Number(query?.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(query?.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query?.status) {
      where.status = query.status;
    }

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          tenant: { select: { fullName: true, email: true } },
          landlord: { select: { fullName: true, email: true } },
          property: { select: { id: true, title: true } },
          reports: true,
          reply: true,
        },
      }),
      this.prisma.review.count({ where }),
    ]);

    return {
      items: reviews,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Admin Moderate Review Action
   */
  async moderateReview(moderatorId: string, reviewId: string, dto: ModerateReviewDto) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException(`Review ${reviewId} not found`);
    }

    let newStatus = review.status;
    if (
      dto.action === ReviewModerationAction.APPROVE ||
      dto.action === ReviewModerationAction.RESTORE
    ) {
      newStatus = ReviewStatus.APPROVED;
    } else if (dto.action === ReviewModerationAction.REJECT) {
      newStatus = ReviewStatus.REJECTED;
    } else if (dto.action === ReviewModerationAction.HIDE) {
      newStatus = ReviewStatus.HIDDEN;
    } else if (dto.action === ReviewModerationAction.REMOVE) {
      newStatus = ReviewStatus.REMOVED;
    }

    const [updatedReview] = await this.prisma.$transaction([
      this.prisma.review.update({
        where: { id: reviewId },
        data: {
          status: newStatus,
          ...(newStatus === ReviewStatus.REMOVED && { deletedAt: new Date() }),
        },
      }),
      this.prisma.reviewModeration.create({
        data: {
          reviewId,
          moderatorId,
          action: dto.action,
          reason: dto.reason || null,
          notes: dto.notes || null,
        },
      }),
      this.prisma.auditLog.create({
        data: {
          actorId: moderatorId,
          action: `REVIEW_MODERATE_${dto.action}`,
          targetType: 'Review',
          targetId: reviewId,
          before: { status: review.status },
          after: { status: newStatus, reason: dto.reason },
        },
      }),
    ]);

    return updatedReview;
  }
}
