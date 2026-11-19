import { Test, TestingModule } from '@nestjs/testing';
import { MonetizationService } from './monetization.service';
import { PrismaService } from '../../database/prisma.service';
import { ForbiddenException, BadRequestException } from '@nestjs/common';
import {
  LeadStatus,
  LeadType,
  PropertyStatus,
  PromotionStatus,
  SubscriptionStatus,
  BillingCycle,
} from '@prisma/client';

describe('MonetizationService (Phase 20 Commercialization, CRM & Growth)', () => {
  let service: MonetizationService;
  let mockPrisma: any;

  beforeEach(async () => {
    mockPrisma = {
      lead: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      leadStatusHistory: {
        create: jest.fn(),
      },
      contactAttempt: {
        create: jest.fn(),
      },
      leadNote: {
        create: jest.fn(),
      },
      campaign: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      campaignVariant: {
        create: jest.fn(),
      },
      campaignAssignment: {
        create: jest.fn(),
        count: jest.fn(),
      },
      promoCode: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      promotion: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
      },
      promotionAssignment: {
        create: jest.fn(),
        count: jest.fn(),
      },
      subscriptionPlan: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        createMany: jest.fn(),
      },
      subscription: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        updateMany: jest.fn(),
      },
      invoice: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      creditNote: {
        create: jest.fn(),
      },
      referral: {
        findFirst: jest.fn(),
        create: jest.fn(),
        count: jest.fn(),
      },
      referralReward: {
        create: jest.fn(),
      },
      user: {
        findFirst: jest.fn(),
        findMany: jest.fn().mockResolvedValue([{ id: 'user-same' }, { id: 'user-referrer' }]),
      },
      property: {
        findUnique: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      locality: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
      ledgerEntry: {
        create: jest.fn(),
      },
      revenueEvent: {
        create: jest.fn(),
        aggregate: jest.fn().mockResolvedValue({ _sum: { amountPkr: 150000 } }),
        count: jest.fn().mockResolvedValue(45),
      },
      auditLog: {
        create: jest.fn().mockResolvedValue({ id: 'audit-1' }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [MonetizationService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<MonetizationService>(MonetizationService);
  });

  describe('Lead Management & Deduplication', () => {
    it('normalizes Pakistani phone numbers to 923XXXXXXXXX format', () => {
      expect(service.normalizePhoneNumber('03001234567')).toBe('923001234567');
      expect(service.normalizePhoneNumber('+92-333-9876543')).toBe('923339876543');
      expect(service.normalizePhoneNumber('3451122334')).toBe('923451122334');
    });

    it('creates new lead with status NEW if no duplicate exists', async () => {
      mockPrisma.lead.findFirst.mockResolvedValue(null);
      mockPrisma.lead.create.mockResolvedValue({
        id: 'lead-1',
        fullName: 'Haji Khan',
        phoneNumber: '03001234567',
        normalizedPhone: '923001234567',
        status: LeadStatus.NEW,
      });

      const lead = await service.createLead({
        fullName: 'Haji Khan',
        phoneNumber: '03001234567',
        leadType: LeadType.LANDLORD,
      });

      expect(lead.status).toBe(LeadStatus.NEW);
      expect(mockPrisma.leadStatusHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            leadId: 'lead-1',
            oldStatus: LeadStatus.NEW,
            newStatus: LeadStatus.NEW,
          }),
        }),
      );
    });

    it('marks lead as DUPLICATE if created within past 45 days with same normalized phone', async () => {
      mockPrisma.lead.findFirst.mockResolvedValue({ id: 'lead-existing', createdAt: new Date() });
      mockPrisma.lead.create.mockResolvedValue({
        id: 'lead-dup-2',
        fullName: 'Haji Khan (Repeat)',
        status: LeadStatus.DUPLICATE,
        duplicateOfId: 'lead-existing',
      });

      const lead = await service.createLead({
        fullName: 'Haji Khan (Repeat)',
        phoneNumber: '03001234567',
      });

      expect(lead.status).toBe(LeadStatus.DUPLICATE);
      expect(mockPrisma.lead.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: LeadStatus.DUPLICATE,
            duplicateOfId: 'lead-existing',
          }),
        }),
      );
    });

    it('auto-advances lead from NEW to CONTACTED when agent logs connected attempt', async () => {
      mockPrisma.lead.findUnique.mockResolvedValue({ id: 'lead-1', status: LeadStatus.NEW });
      mockPrisma.contactAttempt.create.mockResolvedValue({ id: 'attempt-1' });
      mockPrisma.lead.update.mockResolvedValue({ id: 'lead-1', status: LeadStatus.CONTACTED });

      await service.logContactAttempt(
        'lead-1',
        { channel: 'PHONE', outcome: 'CONNECTED' },
        'agent-1',
      );

      expect(mockPrisma.lead.update).toHaveBeenCalledWith({
        where: { id: 'lead-1' },
        data: { status: LeadStatus.CONTACTED },
      });
      expect(mockPrisma.leadStatusHistory.create).toHaveBeenCalled();
    });
  });

  describe('Campaigns & Multi-Touch Attribution', () => {
    it('creates campaign and tracks touches', async () => {
      mockPrisma.campaign.create.mockResolvedValue({
        id: 'camp-1',
        slug: 'pesh-students-fall2026',
      });
      mockPrisma.campaignAssignment.create.mockResolvedValue({ id: 'touch-1' });

      const campaign = await service.createCampaign({
        name: 'Fall 2026 Students',
        slug: 'pesh-students-fall2026',
        channel: 'META_ADS',
        utmSource: 'facebook',
        utmMedium: 'cpc',
        utmCampaign: 'pesh-students-fall2026',
      });

      expect(campaign.id).toBe('camp-1');

      const touch = await service.trackCampaignTouch(
        {
          campaignId: 'camp-1',
          sessionId: 'sess-xyz',
          utmSource: 'facebook',
        },
        'user-1',
      );

      expect(touch.id).toBe('touch-1');
    });
  });

  describe('Promo Codes & Limit Enforcement', () => {
    it('rejects promo code if usage limit has been reached', async () => {
      mockPrisma.promoCode.findUnique.mockResolvedValue({
        id: 'promo-1',
        code: 'LAUNCH100',
        isActive: true,
        maxRedemptions: 10,
        timesRedeemed: 10,
      });

      await expect(service.validatePromoCode('LAUNCH100')).rejects.toThrow(BadRequestException);
    });

    it('validates active promo code within limits', async () => {
      mockPrisma.promoCode.findUnique.mockResolvedValue({
        id: 'promo-2',
        code: 'PESHAWAR50',
        isActive: true,
        maxRedemptions: 100,
        timesRedeemed: 15,
        discountPct: 50,
      });

      const valid = await service.validatePromoCode('PESHAWAR50');
      expect(valid.code).toBe('PESHAWAR50');
    });
  });

  describe('Promotions & Moderation Integrity', () => {
    it('prevents promoting a property that is not APPROVED or not AVAILABLE', async () => {
      mockPrisma.promotion.findUnique.mockResolvedValue({
        id: 'prom-1',
        status: PromotionStatus.ACTIVE,
        pricePkr: 2499,
        durationDays: 30,
        type: 'FEATURED_LISTING',
      });
      mockPrisma.property.findUnique.mockResolvedValue({
        id: 'prop-draft',
        landlordId: 'll-1',
        status: PropertyStatus.DRAFT,
        isAvailable: true,
      });

      await expect(
        service.applyPromotion('ll-1', { promotionId: 'prom-1', propertyId: 'prop-draft' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('prevents landlord from promoting another landlords property', async () => {
      mockPrisma.promotion.findUnique.mockResolvedValue({
        id: 'prom-1',
        status: PromotionStatus.ACTIVE,
        type: 'FEATURED_LISTING',
      });
      mockPrisma.property.findUnique.mockResolvedValue({
        id: 'prop-approved',
        landlordId: 'other-landlord',
        status: PropertyStatus.APPROVED,
        isAvailable: true,
      });

      await expect(
        service.applyPromotion('attacker-landlord', {
          promotionId: 'prom-1',
          propertyId: 'prop-approved',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('successfully applies featured promotion and posts to ledger', async () => {
      mockPrisma.promotion.findUnique.mockResolvedValue({
        id: 'prom-1',
        status: PromotionStatus.ACTIVE,
        pricePkr: 2499,
        durationDays: 30,
        type: 'FEATURED_LISTING',
        name: 'Featured Placement',
      });
      mockPrisma.property.findUnique.mockResolvedValue({
        id: 'prop-1',
        landlordId: 'll-1',
        status: PropertyStatus.APPROVED,
        isAvailable: true,
        localityId: 'loc-1',
        propertyType: 'PORTION',
        eligibility: 'FAMILIES_ONLY',
      });
      mockPrisma.promotionAssignment.create.mockResolvedValue({ id: 'assign-1' });
      mockPrisma.property.update.mockResolvedValue({ id: 'prop-1', isFeatured: true });

      const res = await service.applyPromotion('ll-1', {
        promotionId: 'prom-1',
        propertyId: 'prop-1',
      });

      expect(res.isFeatured).toBe(true);
      expect(mockPrisma.ledgerEntry.create).toHaveBeenCalled();
      expect(mockPrisma.revenueEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'PROMOTION_CHARGE',
            amountPkr: 2499,
          }),
        }),
      );
    });
  });

  describe('Subscription Plans & Active Listing Limits', () => {
    it('enforces free plan max active listing limit (2 listings)', async () => {
      mockPrisma.subscription.findFirst.mockResolvedValue(null);
      mockPrisma.subscriptionPlan.findUnique.mockResolvedValue({
        slug: 'free',
        name: 'Free Starter',
        maxActiveListings: 2,
      });
      mockPrisma.property.count.mockResolvedValue(2); // Already at limit

      await expect(service.enforceSubscriptionListingLimit('ll-free')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('allows publishing when landlord active listings are below plan limit', async () => {
      mockPrisma.subscription.findFirst.mockResolvedValue({
        plan: { slug: 'pro', name: 'Professional', maxActiveListings: 8 },
        status: SubscriptionStatus.ACTIVE,
        currentPeriodEndsAt: new Date(Date.now() + 86400000),
      });
      mockPrisma.property.count.mockResolvedValue(3); // Below 8 limit

      const check = await service.enforceSubscriptionListingLimit('ll-pro');
      expect(check.allowed).toBe(true);
      expect(check.maxAllowed).toBe(8);
    });

    it('subscribes landlord to paid plan and creates invoice & ledger entry', async () => {
      mockPrisma.subscriptionPlan.findUnique.mockResolvedValue({
        id: 'plan-pro',
        name: 'Professional Landlord',
        slug: 'pro',
        priceMonthlyPkr: 2499,
      });
      mockPrisma.subscription.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.subscription.create.mockResolvedValue({
        id: 'sub-1',
        status: SubscriptionStatus.ACTIVE,
        currentPeriodEndsAt: new Date(),
      });
      mockPrisma.invoice.create.mockResolvedValue({
        id: 'inv-1',
        invoiceNumber: 'INV-2026-123456',
        totalPkr: 2624,
      });

      const res = await service.subscribeToPlan('ll-1', {
        planId: 'plan-pro',
        billingCycle: BillingCycle.MONTHLY,
      });

      expect(res.subscriptionId).toBe('sub-1');
      expect(mockPrisma.ledgerEntry.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'SUBSCRIPTION_CHARGE',
            amountPkr: 2499,
          }),
        }),
      );
    });
  });

  describe('Refunds & Credit Notes', () => {
    it('processes refund, issues credit note, and posts refund to ledger', async () => {
      mockPrisma.invoice.findUnique.mockResolvedValue({
        id: 'inv-1',
        invoiceNumber: 'INV-2026-101',
        totalPkr: 2499,
        status: 'PAID',
      });
      mockPrisma.creditNote.create.mockResolvedValue({ creditNoteNumber: 'CRN-2026-001' });

      const refund = await service.processRefund(
        'inv-1',
        { reason: 'Customer requested cancellation during 7-day trial' },
        'admin-1',
      );

      expect(refund.status).toBe('REFUNDED');
      expect(refund.creditNoteNumber).toBe('CRN-2026-001');
      expect(mockPrisma.invoice.update).toHaveBeenCalledWith({
        where: { id: 'inv-1' },
        data: { status: 'REFUNDED' },
      });
      expect(mockPrisma.ledgerEntry.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'REFUND',
            amountPkr: 2499,
          }),
        }),
      );
    });
  });

  describe('Referral Fraud Prevention', () => {
    it('blocks self-referral attempts', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'user-same' });

      await expect(
        service.claimReferralCode('user-same', { referralCode: 'PESH-TENANT-USER-SAME' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('flags referral for fraud review if IP registration velocity exceeds limit', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'user-referrer' });
      mockPrisma.referral.count.mockResolvedValue(6); // Exceeds threshold of 5
      mockPrisma.referral.create.mockResolvedValue({
        id: 'ref-flagged',
        isQualified: false,
        isFraudFlagged: true,
      });

      const res = await service.claimReferralCode(
        'user-new',
        { referralCode: 'PESH-TENANT-REFERRER' },
        '192.168.1.100',
      );

      expect(res.isFraudFlagged).toBe(true);
      expect(res.isQualified).toBe(false);
      // Referral reward should NOT be automatically approved
      expect(mockPrisma.referralReward.create).not.toHaveBeenCalled();
    });
  });
});
