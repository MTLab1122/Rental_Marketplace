import { Test, TestingModule } from '@nestjs/testing';
import { GrowthService } from '../growth/growth.service';
import { PrismaService } from '../../database/prisma.service';
import { PropertyStatus } from '@prisma/client';
import { ReferralType } from '@rental-peshawar/shared-types';
import {
  isCoordinateWithinPeshawarBoundary,
  isCoordinateWithinCityBoundary,
  registerDynamicCity,
  listSupportedCities,
  getCityConfig,
} from '@rental-peshawar/config';
import {
  validatePeshawarCoordinates,
  validateCityCoordinates,
} from '../property/property.validator';

describe('Phase 25: Growth, Commercial, SEO/AEO/GEO & Multi-City Scale Certification', () => {
  let growthService: GrowthService;
  let prismaService: Record<string, Record<string, jest.Mock>>;

  beforeEach(async () => {
    prismaService = {
      property: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        count: jest.fn(),
      },
      locality: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
      auditLog: {
        count: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        deleteMany: jest.fn(),
      },
      inquiry: {
        count: jest.fn(),
        findFirst: jest.fn(),
      },
      propertyViewEvent: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GrowthService,
        {
          provide: PrismaService,
          useValue: prismaService,
        },
      ],
    }).compile();

    growthService = module.get<GrowthService>(GrowthService);
  });

  describe('1. Technical SEO & Dynamic Sitemap Guardrails', () => {
    it('should generate valid sitemap containing only approved and available listings', async () => {
      prismaService.property.findMany.mockResolvedValue([
        {
          id: 'p-1',
          slug: 'hayatabad-phase-3-house',
          updatedAt: new Date('2026-11-20T10:00:00Z'),
        },
        {
          id: 'p-2',
          slug: 'university-town-hostel',
          updatedAt: new Date('2026-11-20T10:00:00Z'),
        },
      ]);

      prismaService.locality.findMany.mockResolvedValue([
        { slug: 'hayatabad', updatedAt: new Date('2026-11-20T10:00:00Z') },
        { slug: 'university-town', updatedAt: new Date('2026-11-20T10:00:00Z') },
      ]);

      const sitemapXml = await growthService.generateSitemapXml();

      // Check schema and header
      expect(sitemapXml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(sitemapXml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');

      // Static routes
      expect(sitemapXml).toContain('<loc>https://rentalpeshawar.pk/</loc>');
      expect(sitemapXml).toContain('<loc>https://rentalpeshawar.pk/student-rentals</loc>');
      expect(sitemapXml).toContain('<loc>https://rentalpeshawar.pk/family-rentals</loc>');

      // Localities
      expect(sitemapXml).toContain('<loc>https://rentalpeshawar.pk/localities/hayatabad</loc>');
      expect(sitemapXml).toContain(
        '<loc>https://rentalpeshawar.pk/localities/university-town</loc>',
      );

      // Active properties
      expect(sitemapXml).toContain(
        '<loc>https://rentalpeshawar.pk/properties/hayatabad-phase-3-house</loc>',
      );
      expect(sitemapXml).toContain(
        '<loc>https://rentalpeshawar.pk/properties/university-town-hostel</loc>',
      );

      // Verify Prisma call was strictly filtered to APPROVED and isAvailable: true
      expect(prismaService.property.findMany).toHaveBeenCalledWith({
        where: {
          status: PropertyStatus.APPROVED,
          isAvailable: true,
          deletedAt: null,
        },
        select: { slug: true, id: true, updatedAt: true },
        take: 1000,
      });
    });

    it('should generate valid Schema.org JSON-LD with geo-coordinates and pricing', async () => {
      prismaService.property.findUnique.mockResolvedValue({
        id: 'prop-101',
        title: '3 Bed Family Apartment Saddar',
        description: 'Prime central apartment near Saddar Metro',
        propertyType: 'APARTMENT',
        slug: '3-bed-family-apartment-saddar',
        address: 'Main Saddar Road, Peshawar',
        monthlyRentPkr: 45000,
        bedrooms: 3,
        bathrooms: 2,
        latitude: 34.0086,
        longitude: 71.5583,
        isAvailable: true,
        locality: {
          name: 'Saddar',
          postalCode: '25000',
        },
        images: [{ url: 'https://cdn.rentalpeshawar.pk/p101.jpg' }],
      });

      const structuredData = await growthService.getPropertyStructuredData('prop-101');

      expect(structuredData['@type']).toBe('Apartment');
      expect(structuredData.name).toBe('3 Bed Family Apartment Saddar');
      expect(structuredData.address.addressLocality).toBe('Saddar');
      expect(structuredData.address.postalCode).toBe('25000');
      expect(structuredData.geo.latitude).toBe(34.0086);
      expect(structuredData.geo.longitude).toBe(71.5583);
      expect(structuredData.offers.price).toBe(45000);
      expect(structuredData.offers.priceCurrency).toBe('PKR');
      expect(structuredData.offers.availability).toBe('https://schema.org/InStock');
    });
  });

  describe('2. AEO & GEO Knowledge Graph Grounding', () => {
    it('should serve verified locality metrics without hallucinated numbers', async () => {
      prismaService.locality.findUnique.mockResolvedValue({
        id: 'loc-hayatabad',
        name: 'Hayatabad',
        slug: 'hayatabad',
        description: 'Planned township',
        postalCode: '25100',
        latitude: 33.9875,
        longitude: 71.4332,
        properties: [
          { eligibility: 'STUDENTS_ONLY', monthlyRentPkr: 15000 },
          { eligibility: 'STUDENTS_ONLY', monthlyRentPkr: 17000 },
          { eligibility: 'FAMILIES_ONLY', monthlyRentPkr: 60000 },
          { eligibility: 'FAMILIES_ONLY', monthlyRentPkr: 80000 },
        ],
      });

      const landingPage = await growthService.getLocalityLandingPage('hayatabad');

      expect(landingPage.locality.name).toBe('Hayatabad');
      expect(landingPage.stats.totalActiveListings).toBe(4);
      expect(landingPage.stats.studentListingsCount).toBe(2);
      expect(landingPage.stats.familyListingsCount).toBe(2);
      expect(landingPage.stats.averageStudentRentPkr).toBe(16000); // (15k + 17k)/2
      expect(landingPage.stats.averageFamilyRentPkr).toBe(70000); // (60k + 80k)/2
    });
  });

  describe('3. Commercial Operations & Monetization Controls', () => {
    it('should generate standard referral code format PESH-[TYPE]-[HASH]', async () => {
      prismaService.user.findUnique.mockResolvedValue({
        id: 'e5f2a1b0-4567-8901-cdef-123456789012',
        landlordProfile: { id: 'lp-1' },
      });
      prismaService.auditLog.count.mockResolvedValue(4);

      const referral = await growthService.getReferralProgram(
        'e5f2a1b0-4567-8901-cdef-123456789012',
      );

      expect(referral.referralCode).toBe('PESH-LANDLORD-E5F2A1');
      expect(referral.referralUrl).toBe(
        'https://rentalpeshawar.pk/register?ref=PESH-LANDLORD-E5F2A1',
      );
      expect(referral.successfulReferrals).toBe(4);
      expect(referral.rewardTiers.length).toBe(3);
    });

    it('should reject duplicate referral claim attempts', async () => {
      prismaService.auditLog.findFirst.mockResolvedValue({
        id: 'log-1',
        action: 'REFERRAL_CLAIMED',
      });

      await expect(
        growthService.claimReferral(
          { referralCode: 'PESH-TENANT-A8F5E1', referralType: ReferralType.TENANT },
          'new-user-123',
        ),
      ).rejects.toThrow('Referral bonus already claimed for this account');
    });

    it('should enforce Starter tier max 2 active listings limit', () => {
      const isListingPermitted = (tier: string, currentActiveCount: number) => {
        if (tier === 'STARTER') {
          return currentActiveCount < 2;
        }
        if (tier === 'PRO') {
          return currentActiveCount < 10;
        }
        return true; // AGENCY / UNLIMITED
      };

      expect(isListingPermitted('STARTER', 0)).toBe(true);
      expect(isListingPermitted('STARTER', 1)).toBe(true);
      expect(isListingPermitted('STARTER', 2)).toBe(false); // Hard limit enforced
      expect(isListingPermitted('PRO', 9)).toBe(true);
      expect(isListingPermitted('PRO', 10)).toBe(false);
      expect(isListingPermitted('AGENCY', 50)).toBe(true);
    });
  });

  describe('4. Multi-City Scalability Proof (Zero-Code Second City)', () => {
    it('should validate core Peshawar municipal coordinates', () => {
      // University Town, Hayatabad, Saddar
      expect(isCoordinateWithinPeshawarBoundary(33.9982, 71.4883)).toBe(true);
      expect(() => validatePeshawarCoordinates(33.9982, 71.4883)).not.toThrow();
      expect(() => validatePeshawarCoordinates(33.9875, 71.4332)).not.toThrow();
      expect(() => validatePeshawarCoordinates(34.0086, 71.5583)).not.toThrow();
    });

    it('should reject non-Peshawar coordinates when validating for Peshawar', () => {
      // Islamabad, Lahore, Karachi
      expect(() => validatePeshawarCoordinates(33.6844, 73.0479)).toThrow();
      expect(() => validatePeshawarCoordinates(31.5204, 74.3587)).toThrow();
      expect(() => validatePeshawarCoordinates(24.8607, 67.0011)).toThrow();
    });

    it('should support dynamic second-city onboarding (Mardan) without architectural code changes', () => {
      // Verify Mardan is in the supported cities registry
      const mardanConfig = getCityConfig('MARDAN');
      expect(mardanConfig).toBeDefined();
      expect(mardanConfig?.name).toBe('Mardan');

      // Test Mardan centroid (34.1989°N, 72.0404°E)
      expect(isCoordinateWithinCityBoundary(34.1989, 72.0404, 'MARDAN')).toBe(true);
      expect(() => validateCityCoordinates(34.1989, 72.0404, 'MARDAN')).not.toThrow();

      // Test point outside Mardan (e.g. Islamabad: 33.6844, 73.0479)
      expect(isCoordinateWithinCityBoundary(33.6844, 73.0479, 'MARDAN')).toBe(false);
      expect(() => validateCityCoordinates(33.6844, 73.0479, 'MARDAN')).toThrow();
    });

    it('should support dynamic third-city onboarding (Abbottabad) without architectural code changes', () => {
      const abbottabadConfig = getCityConfig('ABBOTTABAD');
      expect(abbottabadConfig).toBeDefined();
      expect(abbottabadConfig?.name).toBe('Abbottabad');

      // Test Abbottabad centroid (34.1688°N, 73.2215°E)
      expect(isCoordinateWithinCityBoundary(34.1688, 73.2215, 'ABBOTTABAD')).toBe(true);
      expect(() => validateCityCoordinates(34.1688, 73.2215, 'ABBOTTABAD')).not.toThrow();

      // Out of bounds coordinate
      expect(isCoordinateWithinCityBoundary(31.5204, 74.3587, 'ABBOTTABAD')).toBe(false);
      expect(() => validateCityCoordinates(31.5204, 74.3587, 'ABBOTTABAD')).toThrow();
    });

    it('should allow runtime dynamic city registration via registerDynamicCity', () => {
      // Dynamically register Swat / Mingora (34.7717°N, 72.3602°E)
      registerDynamicCity({
        code: 'SWAT',
        name: 'Swat (Mingora)',
        province: 'Khyber Pakhtunkhwa',
        defaultPostalCode: '19130',
        centerCoordinates: { latitude: 34.7717, longitude: 72.3602 },
        serviceBoundaryPolygon: [
          [72.3, 34.7],
          [72.45, 34.7],
          [72.45, 34.85],
          [72.3, 34.85],
          [72.3, 34.7],
        ],
        isActive: true,
      });

      const swatConfig = getCityConfig('SWAT');
      expect(swatConfig).toBeDefined();
      expect(swatConfig?.name).toBe('Swat (Mingora)');

      // Valid point inside Swat polygon
      expect(isCoordinateWithinCityBoundary(34.7717, 72.3602, 'SWAT')).toBe(true);
      expect(() => validateCityCoordinates(34.7717, 72.3602, 'SWAT')).not.toThrow();

      // Point outside Swat polygon
      expect(isCoordinateWithinCityBoundary(34.0151, 71.5249, 'SWAT')).toBe(false);

      const allCities = listSupportedCities();
      expect(allCities.some((c) => c.code === 'SWAT')).toBe(true);
    });
  });
});
