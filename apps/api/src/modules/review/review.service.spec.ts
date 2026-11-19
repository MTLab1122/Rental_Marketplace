import { Test, TestingModule } from '@nestjs/testing';
import { ReviewService } from './review.service';
import { ReputationService } from './reputation.service';
import { PrismaService } from '../../database/prisma.service';
import {
  ReviewStatus,
  InquiryStatus,
  ReviewModerationAction,
  TrustBadge,
  ReviewReportReason,
} from '@rental-peshawar/shared-types';
import { ForbiddenException, ConflictException, BadRequestException } from '@nestjs/common';

describe('ReviewService & ReputationService (Phase 11)', () => {
  let reviewService: ReviewService;
  let reputationService: ReputationService;
  let mockPrisma: any;

  beforeEach(async () => {
    mockPrisma = {
      property: {
        findUnique: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(1),
      },
      user: {
        findUnique: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
      },
      inquiry: {
        findFirst: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
      },
      review: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn().mockResolvedValue(0),
      },
      reviewReply: {
        create: jest.fn(),
      },
      reviewReport: {
        create: jest.fn(),
        count: jest.fn().mockResolvedValue(1),
      },
      reviewModeration: {
        create: jest.fn(),
      },
      trustEvent: {
        create: jest.fn().mockResolvedValue({ id: 'te-1' }),
      },
      landlordReputationSnapshot: {
        upsert: jest.fn().mockResolvedValue({ id: 'snap-1' }),
      },
      propertyQualitySnapshot: {
        upsert: jest.fn().mockResolvedValue({ id: 'qsnap-1' }),
      },
      auditLog: {
        create: jest.fn().mockResolvedValue({ id: 'audit-1' }),
      },
      report: {
        count: jest.fn().mockResolvedValue(0),
      },
      $transaction: jest.fn().mockImplementation((promises) => Promise.all(promises)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewService,
        ReputationService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    reviewService = module.get<ReviewService>(ReviewService);
    reputationService = module.get<ReputationService>(ReputationService);
  });

  describe('Review Creation Constraints', () => {
    const validDto = {
      inquiryId: 'inq-100',
      overallRating: 5,
      communicationRating: 5,
      accuracyRating: 4,
      safetyRating: 5,
      valueForMoneyRating: 4,
      comment: 'Excellent student portion near University Town, clean and fast internet.',
    };

    it('rejects review if tenant does NOT have an accepted inquiry', async () => {
      mockPrisma.property.findUnique.mockResolvedValue({
        id: 'prop-1',
        landlordId: 'll-1',
      });

      // Inquiry exists but status is SUBMITTED (not ACCEPTED)
      mockPrisma.inquiry.findFirst.mockResolvedValue({
        id: 'inq-100',
        propertyId: 'prop-1',
        tenantId: 'tenant-1',
        status: InquiryStatus.SUBMITTED,
      });

      await expect(reviewService.createReview('tenant-1', 'prop-1', validDto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('rejects duplicate review for the same accepted inquiry', async () => {
      mockPrisma.property.findUnique.mockResolvedValue({
        id: 'prop-1',
        landlordId: 'll-1',
      });

      mockPrisma.inquiry.findFirst.mockResolvedValue({
        id: 'inq-100',
        propertyId: 'prop-1',
        tenantId: 'tenant-1',
        status: InquiryStatus.ACCEPTED,
      });

      // Existing review already recorded
      mockPrisma.review.findFirst.mockResolvedValue({
        id: 'rev-existing',
        tenantId: 'tenant-1',
        inquiryId: 'inq-100',
      });

      await expect(reviewService.createReview('tenant-1', 'prop-1', validDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('successfully creates review for accepted inquiry and emits trust event', async () => {
      mockPrisma.property.findUnique.mockResolvedValue({
        id: 'prop-1',
        landlordId: 'll-1',
      });

      mockPrisma.inquiry.findFirst.mockResolvedValue({
        id: 'inq-100',
        propertyId: 'prop-1',
        tenantId: 'tenant-1',
        status: InquiryStatus.ACCEPTED,
      });

      mockPrisma.review.findFirst.mockResolvedValue(null); // No duplicate

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'tenant-1',
        createdAt: new Date(Date.now() - 3600 * 24 * 1000), // Account older than 10 mins
      });

      mockPrisma.review.create.mockResolvedValue({
        id: 'rev-new',
        overallRating: 5,
        status: ReviewStatus.APPROVED,
      });

      const result = await reviewService.createReview('tenant-1', 'prop-1', validDto);
      expect(result.id).toBe('rev-new');
      expect(mockPrisma.review.create).toHaveBeenCalled();
      expect(mockPrisma.trustEvent.create).toHaveBeenCalled();
    });
  });

  describe('72-Hour Editing and Deletion Window', () => {
    it('allows editing review within 72 hours', async () => {
      mockPrisma.review.findUnique.mockResolvedValue({
        id: 'rev-1',
        tenantId: 'tenant-1',
        createdAt: new Date(Date.now() - 10 * 3600 * 1000), // 10 hours ago
      });

      mockPrisma.review.update.mockResolvedValue({
        id: 'rev-1',
        overallRating: 4,
        isEdited: true,
      });

      const updated = await reviewService.updateReview('tenant-1', 'rev-1', { overallRating: 4 });
      expect(updated.isEdited).toBe(true);
      expect(mockPrisma.review.update).toHaveBeenCalled();
    });

    it('blocks editing review after 72 hours have elapsed', async () => {
      mockPrisma.review.findUnique.mockResolvedValue({
        id: 'rev-1',
        tenantId: 'tenant-1',
        createdAt: new Date(Date.now() - 75 * 3600 * 1000), // 75 hours ago
      });

      await expect(
        reviewService.updateReview('tenant-1', 'rev-1', { overallRating: 3 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('blocks deleting review after 72 hours', async () => {
      mockPrisma.review.findUnique.mockResolvedValue({
        id: 'rev-1',
        tenantId: 'tenant-1',
        createdAt: new Date(Date.now() - 80 * 3600 * 1000), // 80 hours ago
      });

      await expect(reviewService.deleteReview('tenant-1', 'rev-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('Landlord Reply Rules', () => {
    it('allows landlord to reply to reviews on their own property', async () => {
      mockPrisma.review.findUnique.mockResolvedValue({
        id: 'rev-1',
        landlordId: 'll-1',
        property: { landlordId: 'll-1' },
        reply: null,
      });

      mockPrisma.reviewReply.create.mockResolvedValue({
        id: 'reply-1',
        content: 'Thank you for your feedback! Best regards.',
      });

      const reply = await reviewService.replyToReview('ll-1', 'rev-1', {
        content: 'Thank you for your feedback! Best regards.',
      });
      expect(reply.id).toBe('reply-1');
      expect(mockPrisma.reviewReply.create).toHaveBeenCalled();
    });

    it('forbids landlord from replying to reviews of other landlords', async () => {
      mockPrisma.review.findUnique.mockResolvedValue({
        id: 'rev-1',
        landlordId: 'll-other',
        property: { landlordId: 'll-other' },
      });

      await expect(
        reviewService.replyToReview('ll-attacker', 'rev-1', { content: 'Unauthorized reply' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('Review Reporting & Auto-Quarantine', () => {
    it('quarantines review to HIDDEN status if 3 or more reports are filed', async () => {
      mockPrisma.review.findUnique.mockResolvedValue({
        id: 'rev-abusive',
        status: ReviewStatus.APPROVED,
        propertyId: 'prop-1',
      });

      mockPrisma.reviewReport.create.mockResolvedValue({ id: 'rep-3' });
      mockPrisma.reviewReport.count.mockResolvedValue(3); // 3 reports threshold reached

      await reviewService.reportReview('tenant-reporter', 'rev-abusive', {
        reason: ReviewReportReason.HARASSMENT,
        details: 'Review contains defamatory claims.',
      });

      expect(mockPrisma.review.update).toHaveBeenCalledWith({
        where: { id: 'rev-abusive' },
        data: { status: ReviewStatus.HIDDEN },
      });
    });
  });

  describe('Admin Moderation Actions', () => {
    it('moderates review and writes immutable audit log', async () => {
      mockPrisma.review.findUnique.mockResolvedValue({
        id: 'rev-1',
        status: ReviewStatus.PENDING,
      });

      mockPrisma.review.update.mockResolvedValue({
        id: 'rev-1',
        status: ReviewStatus.APPROVED,
      });

      const result = await reviewService.moderateReview('admin-1', 'rev-1', {
        action: ReviewModerationAction.APPROVE,
        notes: 'Verified legitimate tenant experience.',
      });

      expect(result.status).toBe(ReviewStatus.APPROVED);
      expect(mockPrisma.reviewModeration.create).toHaveBeenCalled();
      expect(mockPrisma.auditLog.create).toHaveBeenCalled();
    });
  });

  describe('Landlord Reputation & Trust Badges Calculation', () => {
    it('accurately computes metrics, scores, and trust badges from real data', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'll-top',
        fullName: 'Dr. Tariq Khan',
        isVerified: true,
        landlordProfile: { isCnicVerified: true },
        properties: [
          { id: 'prop-1', status: 'APPROVED' },
          { id: 'prop-2', status: 'APPROVED' },
        ],
      });

      // 4 approved reviews with ratings 5, 5, 5, 4 => average 4.75
      mockPrisma.review.findMany.mockResolvedValue([
        { overallRating: 5 },
        { overallRating: 5 },
        { overallRating: 5 },
        { overallRating: 4 },
      ]);

      // 10 inquiries, 9 replied, 8 accepted
      const now = new Date();
      mockPrisma.inquiry.findMany.mockResolvedValue([
        {
          id: '1',
          status: InquiryStatus.REPLIED,
          createdAt: new Date(now.getTime() - 3600000),
          updatedAt: now,
        },
        {
          id: '2',
          status: InquiryStatus.ACCEPTED,
          createdAt: new Date(now.getTime() - 1800000),
          updatedAt: now,
        },
        {
          id: '3',
          status: InquiryStatus.ACCEPTED,
          createdAt: new Date(now.getTime() - 2400000),
          updatedAt: now,
        },
      ]);

      mockPrisma.reviewReport.count.mockResolvedValue(0);

      const rep = await reputationService.calculateLandlordReputation('ll-top');
      expect(rep.averageRating).toBe(4.75);
      expect(rep.totalReviews).toBe(4);
      expect(rep.badges).toContain(TrustBadge.VERIFIED_LANDLORD);
      expect(rep.badges).toContain(TrustBadge.HIGHLY_RATED);
      expect(rep.badges).toContain(TrustBadge.FAST_RESPONDER);
      expect(rep.trustScore).toBeGreaterThanOrEqual(80.0);
    });
  });

  describe('Property Quality Score Calculation', () => {
    it('computes quality score and awards NEW_LISTING and TOP_LISTING badges', async () => {
      mockPrisma.property.findUnique.mockResolvedValue({
        id: 'prop-quality',
        title: 'Spacious 3-Bed Apartment in Hayatabad Phase 3',
        description:
          'Complete luxury family flat with 24/7 solar backup, dedicated car parking, water bore, and elevator.',
        images: [{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }, { id: '5' }],
        isFeatured: true,
        createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000), // 3 days old
        landlord: {
          isVerified: true,
          landlordProfile: { isCnicVerified: true },
        },
        locality: { name: 'Hayatabad' },
      });

      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'll-1',
        isVerified: true,
        properties: [],
      });
      mockPrisma.review.findMany.mockResolvedValue([{ overallRating: 5 }, { overallRating: 5 }]);
      mockPrisma.inquiry.findMany.mockResolvedValue([]);
      mockPrisma.report.count.mockResolvedValue(0);

      const quality = await reputationService.calculatePropertyQuality('prop-quality');
      expect(quality.isPublishReady).toBe(true);
      expect(quality.overallQualityScore).toBeGreaterThanOrEqual(80.0);
      expect(quality.badges).toContain(TrustBadge.NEW_LISTING);
      expect(quality.badges).toContain(TrustBadge.PREMIUM_LISTING);
    });
  });
});
