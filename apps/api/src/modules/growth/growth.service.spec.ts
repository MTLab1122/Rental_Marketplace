import { Test, TestingModule } from '@nestjs/testing';
import { GrowthService } from './growth.service';
import { PrismaService } from '../../database/prisma.service';
import { PropertyEligibility, ReferralType } from '@rental-peshawar/shared-types';
import { BadRequestException } from '@nestjs/common';

describe('GrowthService (Phase 10 Growth Loops & SEO)', () => {
  let service: GrowthService;
  let mockPrisma: any;

  beforeEach(async () => {
    mockPrisma = {
      user: {
        findUnique: jest.fn(),
      },
      auditLog: {
        count: jest.fn().mockResolvedValue(2),
        findFirst: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue({ id: 'log-1' }),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      property: {
        findUnique: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
      },
      propertyViewEvent: {
        create: jest.fn().mockResolvedValue({ id: 'view-1' }),
        findMany: jest.fn().mockResolvedValue([]),
      },
      inquiry: {
        findFirst: jest.fn(),
        count: jest.fn().mockResolvedValue(10),
      },
      locality: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [GrowthService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<GrowthService>(GrowthService);
  });

  describe('Referral Program', () => {
    it('generates personalized referral link and reward tiers', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: '22222222-3333-4444-5555-666666666666',
        tenantProfile: { tenantType: 'STUDENT' },
      });

      const res = await service.getReferralProgram('22222222-3333-4444-5555-666666666666');
      expect(res.referralCode).toBe('PESH-STUDENT-222222');
      expect(res.referralUrl).toContain('PESH-STUDENT-222222');
      expect(res.successfulReferrals).toBe(2);
    });

    it('prevents claiming referral bonus multiple times on the same account', async () => {
      mockPrisma.auditLog.findFirst.mockResolvedValue({ id: 'existing-claim' });

      await expect(
        service.claimReferral(
          { referralCode: 'PESH-FAMILY-999999', referralType: ReferralType.FAMILY },
          'user-already-claimed',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Similar Properties (Strict Segregation)', () => {
    it('queries similar properties strictly constrained to same eligibility', async () => {
      mockPrisma.property.findUnique.mockResolvedValue({
        id: 'target-prop-1',
        eligibility: PropertyEligibility.STUDENTS_ONLY,
        localityId: 'loc-univ-town',
        monthlyRentPkr: 20000,
      });

      await service.getSimilarProperties('target-prop-1');

      expect(mockPrisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            eligibility: PropertyEligibility.STUDENTS_ONLY,
          }),
        }),
      );
    });
  });

  describe('Landlord Review & Rating System', () => {
    it('rejects review if tenant had no prior acknowledged inquiry interaction', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'landlord-1' });
      mockPrisma.inquiry.findFirst.mockResolvedValue(null); // No prior inquiry

      await expect(
        service.createLandlordReview('tenant-1', {
          landlordId: 'landlord-1',
          rating: 5,
          comment: 'Very polite landlord',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('submits review successfully when prior inquiry exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'landlord-1' });
      mockPrisma.inquiry.findFirst.mockResolvedValue({ id: 'inquiry-100', status: 'REPLIED' });

      const res = await service.createLandlordReview('tenant-1', {
        landlordId: 'landlord-1',
        rating: 5,
        comment: 'Very accommodating for UOP students.',
      });

      expect(res.success).toBe(true);
      expect(mockPrisma.auditLog.create).toHaveBeenCalled();
    });
  });

  describe('Landlord Badges & Telemetry', () => {
    it('computes response rate and verified badge', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'll-1',
        fullName: 'Sher Khan',
        isVerified: true,
        landlordProfile: { isCnicVerified: true },
      });

      // total: 10, replied: 9 => 90%
      mockPrisma.inquiry.count.mockResolvedValueOnce(10).mockResolvedValueOnce(9);

      mockPrisma.auditLog.findMany.mockResolvedValue([
        { after: { landlordId: 'll-1', rating: 5 } },
        { after: { landlordId: 'll-1', rating: 4 } },
        { after: { landlordId: 'll-1', rating: 5 } },
      ]);

      const res = await service.getLandlordBadges('ll-1');
      expect(res.badges.isVerifiedLandlord).toBe(true);
      expect(res.badges.isQuickResponder).toBe(true);
      expect(res.badges.isTopRated).toBe(true);
      expect(res.metrics.responseRatePercent).toBe(90);
      expect(res.metrics.averageRating).toBe(4.7);
    });
  });

  describe('SEO Sitemap & Structured Data', () => {
    it('generates valid XML sitemap including canonical student and family endpoints', async () => {
      mockPrisma.property.findMany.mockResolvedValue([
        { id: 'prop-1', slug: 'room-in-hayatabad', updatedAt: new Date('2026-11-01') },
      ]);
      mockPrisma.locality.findMany.mockResolvedValue([
        { slug: 'hayatabad', updatedAt: new Date('2026-11-01') },
      ]);

      const xml = await service.generateSitemapXml();
      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(xml).toContain('<loc>https://rentalpeshawar.pk/student-rentals</loc>');
      expect(xml).toContain('<loc>https://rentalpeshawar.pk/family-rentals</loc>');
      expect(xml).toContain('<loc>https://rentalpeshawar.pk/properties/room-in-hayatabad</loc>');
      expect(xml).toContain('<loc>https://rentalpeshawar.pk/localities/hayatabad</loc>');
    });
  });
});
