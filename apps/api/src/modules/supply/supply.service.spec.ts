import { Test, TestingModule } from '@nestjs/testing';
import { SupplyService } from './supply.service';
import { PrismaService } from '../../database/prisma.service';
import { PropertyEligibility, PropertyType } from '@rental-peshawar/shared-types';

describe('SupplyService (Phase 10 Supply Acquisition)', () => {
  let service: SupplyService;
  let mockPrisma: any;

  beforeEach(async () => {
    mockPrisma = {
      auditLog: {
        create: jest.fn().mockResolvedValue({ id: 'audit-1' }),
        count: jest.fn().mockResolvedValue(3),
      },
      user: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
      },
      property: {
        count: jest.fn(),
        create: jest.fn(),
        findUnique: jest.fn(),
      },
      locality: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [SupplyService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<SupplyService>(SupplyService);
  });

  describe('inviteLandlord', () => {
    it('creates landlord invitation with tracking code and URL', async () => {
      const res = await service.inviteLandlord({
        emailOrPhone: 'landlord@test.pk',
        fullName: 'Ahmad Khan',
        targetLocality: 'University Town',
      });

      expect(res.inviteCode).toMatch(/^LL-/);
      expect(res.inviteUrl).toContain(res.inviteCode);
      expect(mockPrisma.auditLog.create).toHaveBeenCalled();
    });
  });

  describe('getLandlordReferralLink', () => {
    it('returns referral link and calculates silver bonus tier for 3 referrals', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: '11111111-2222-3333-4444-555555555555',
        fullName: 'Gul Khan',
      });

      const res = await service.getLandlordReferralLink('11111111-2222-3333-4444-555555555555');
      expect(res.referralCode).toBe('PEW-11111111');
      expect(res.referredLandlordsCount).toBe(3);
      expect(res.bonusTier).toBe('SILVER_PARTNER');
    });
  });

  describe('getSupplyTargets', () => {
    it('accurately computes target deficits and overall readiness against Peshawar targets', async () => {
      // totalActive: 105, studentCount: 40, familyCount: 65
      mockPrisma.property.count
        .mockResolvedValueOnce(105)
        .mockResolvedValueOnce(40)
        .mockResolvedValueOnce(65);

      mockPrisma.locality.findMany.mockResolvedValue([
        { name: 'University Town', _count: { properties: 12 } },
        { name: 'Hayatabad', _count: { properties: 15 } },
        { name: 'University Road', _count: { properties: 10 } },
        { name: 'Saddar', _count: { properties: 11 } },
        { name: 'Regi Model Town', _count: { properties: 10 } },
      ]);

      const res = await service.getSupplyTargets();
      expect(res.launchReadiness.overallStatus).toBe('READY_FOR_PUBLIC_MARKETING');
      expect(res.launchReadiness.totalActiveListings.current).toBe(105);
      expect(res.launchReadiness.studentOnlyListings.met).toBe(true);
      expect(res.launchReadiness.familyOnlyListings.met).toBe(true);
      expect(res.launchReadiness.priorityLocalityTargets).toHaveLength(5);
      expect(res.launchReadiness.priorityLocalityTargets[0]!.status).toBe('TARGET_MET');
    });

    it('reports acquisition in progress if total listings are below 100', async () => {
      mockPrisma.property.count
        .mockResolvedValueOnce(85)
        .mockResolvedValueOnce(45)
        .mockResolvedValueOnce(40);

      mockPrisma.locality.findMany.mockResolvedValue([
        { name: 'University Town', _count: { properties: 5 } },
      ]);

      const res = await service.getSupplyTargets();
      expect(res.launchReadiness.overallStatus).toBe('ACQUISITION_IN_PROGRESS');
      expect(res.launchReadiness.totalActiveListings.met).toBe(false);
    });
  });

  describe('calculateListingQuality', () => {
    it('scores high quality for complete listing inside Peshawar', async () => {
      mockPrisma.property.findUnique.mockResolvedValue({
        id: 'prop-123',
        title: 'Modern 2-Bed Portion near UOP Jamrud Road',
        description:
          'Excellent residential portion with backup generator, water bore, and continuous fiber internet.',
        monthlyRentPkr: 25000,
        latitude: 34.0151,
        longitude: 71.5249,
        eligibility: PropertyEligibility.STUDENTS_ONLY,
        propertyType: PropertyType.PORTION,
        furnishing: 'FURNISHED',
        images: [{ id: 'img-1' }, { id: 'img-2' }, { id: 'img-3' }, { id: 'img-4' }],
        amenities: [{ id: 'am-1' }, { id: 'am-2' }, { id: 'am-3' }],
        locality: { name: 'University Town' },
      });

      const res = await service.calculateListingQuality('prop-123');
      expect(res.qualityScore).toBe(100);
      expect(res.isPublishReady).toBe(true);
      expect(res.checks.locationInsidePeshawar).toBe(true);
      expect(res.checks.imagesCountSufficient).toBe(true);
    });

    it('flags insufficient images and incomplete description', async () => {
      mockPrisma.property.findUnique.mockResolvedValue({
        id: 'prop-456',
        title: 'Room',
        description: 'Short',
        monthlyRentPkr: 10000,
        latitude: 34.0151,
        longitude: 71.5249,
        eligibility: PropertyEligibility.STUDENTS_ONLY,
        propertyType: PropertyType.SINGLE_ROOM,
        furnishing: null,
        images: [{ id: 'img-1' }],
        amenities: [],
        locality: { name: 'Board Bazaar' },
      });

      const res = await service.calculateListingQuality('prop-456');
      expect(res.isPublishReady).toBe(false);
      expect(res.checks.imagesCountSufficient).toBe(false);
      expect(res.checks.descriptionDetailed).toBe(false);
      expect(res.recommendations.length).toBeGreaterThan(0);
    });
  });
});
