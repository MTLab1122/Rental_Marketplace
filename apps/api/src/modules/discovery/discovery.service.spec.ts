import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { SavedSearchService } from './saved-search.service';
import { RecommendationService } from './recommendation.service';
import { DiscoveryEventsService } from './discovery-events.service';
import { PrismaService } from '../../database/prisma.service';
import { NotificationService } from '../notification/notification.service';
import {
  PropertyEligibility,
  PropertyStatus,
  PropertyType,
  TenantType,
  AlertFrequency,
} from '@rental-peshawar/shared-types';

describe('Phase 12: Discovery, Saved Searches & Recommendations', () => {
  let savedSearchService: SavedSearchService;
  let recommendationService: RecommendationService;
  let discoveryEventsService: DiscoveryEventsService;

  const mockPrisma = {
    savedSearch: {
      count: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    searchAlert: {
      findUnique: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
    },
    searchAlertDelivery: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    property: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    propertyImpression: {
      create: jest.fn(),
      count: jest.fn(),
    },
    propertyClick: {
      create: jest.fn(),
      count: jest.fn(),
    },
    recentlyViewedProperty: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    searchQueryLog: {
      create: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    recommendationEvent: {
      createMany: jest.fn(),
    },
    localityDemandSnapshot: {
      upsert: jest.fn().mockResolvedValue({}),
      findMany: jest.fn().mockResolvedValue([]),
    },
    notificationPreference: {
      findUnique: jest.fn(),
      create: jest.fn(),
      upsert: jest.fn(),
    },
    favorite: {
      findMany: jest.fn(),
    },
    inquiry: {
      findMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    locality: {
      findMany: jest.fn(),
    },
  };

  const mockNotificationService = {
    notify: jest.fn().mockResolvedValue({ id: 'notif-1' }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SavedSearchService,
        RecommendationService,
        DiscoveryEventsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    }).compile();

    savedSearchService = module.get<SavedSearchService>(SavedSearchService);
    recommendationService = module.get<RecommendationService>(RecommendationService);
    discoveryEventsService = module.get<DiscoveryEventsService>(DiscoveryEventsService);
  });

  describe('1. Saved Searches', () => {
    const tenantId = '00000000-0000-0000-0000-000000000001';

    it('saves a search with correct filters and signature', async () => {
      mockPrisma.savedSearch.count.mockResolvedValue(2);
      mockPrisma.savedSearch.findFirst.mockResolvedValue(null);

      const createdItem = {
        id: 'saved-1',
        userId: tenantId,
        name: 'University Town 2-Bed',
        filters: {
          localityId: 'loc-1',
          propertyType: PropertyType.APARTMENT,
          minPrice: 20000,
          maxPrice: 40000,
          bedrooms: 2,
        },
        filterSignature: 'abc123sig',
        alertsEnabled: true,
        frequency: AlertFrequency.INSTANT,
      };
      mockPrisma.savedSearch.create.mockResolvedValue(createdItem);

      const result = await savedSearchService.createSavedSearch(tenantId, {
        name: 'University Town 2-Bed',
        filters: {
          localityId: 'loc-1',
          propertyType: PropertyType.APARTMENT,
          minPrice: 20000,
          maxPrice: 40000,
          bedrooms: 2,
        },
        alertsEnabled: true,
        frequency: AlertFrequency.INSTANT,
      });

      expect(mockPrisma.savedSearch.create).toHaveBeenCalled();
      expect(result.id).toBe('saved-1');
      expect(result.name).toBe('University Town 2-Bed');
    });

    it('enforces maximum 25 saved searches per tenant', async () => {
      mockPrisma.savedSearch.count.mockResolvedValue(25);

      await expect(
        savedSearchService.createSavedSearch(tenantId, {
          name: 'Exceeding search',
          filters: { minPrice: 10000 },
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('generates consistent canonical filter signature regardless of key ordering', () => {
      const sig1 = savedSearchService.generateFilterSignature({
        minPrice: 20000,
        maxPrice: 40000,
        bedrooms: 2,
        propertyType: PropertyType.APARTMENT,
      });

      const sig2 = savedSearchService.generateFilterSignature({
        propertyType: PropertyType.APARTMENT,
        bedrooms: 2,
        maxPrice: 40000,
        minPrice: 20000,
      });

      expect(sig1).toBe(sig2);
    });
  });

  describe('2. New Matching Listing Alerts & Duplicate Prevention', () => {
    const propertyId = 'prop-100';

    it('triggers alerts for matching saved search and dispatches notifications', async () => {
      mockPrisma.property.findFirst.mockResolvedValue({
        id: propertyId,
        title: 'Furnished Apartment in University Town',
        status: PropertyStatus.APPROVED,
        isAvailable: true,
        deletedAt: null,
        monthlyRentPkr: 35000,
        bedrooms: 2,
        bathrooms: 2,
        furnishing: 'Furnished',
        localityId: 'loc-1',
        locality: { id: 'loc-1', name: 'University Town' },
        eligibility: PropertyEligibility.STUDENTS_ONLY,
        amenities: [{ amenityId: 'am-1' }],
      });

      mockPrisma.savedSearch.findMany.mockResolvedValue([
        {
          id: 'search-1',
          userId: 'tenant-1',
          name: 'Student Flat',
          alertsEnabled: true,
          filters: {
            localityId: 'loc-1',
            minPrice: 20000,
            maxPrice: 40000,
            bedrooms: 2,
          },
          user: {
            id: 'tenant-1',
            tenantProfile: { tenantType: TenantType.STUDENT },
            notificationPreference: { inAppAlerts: true, pushAlerts: true, emailAlerts: true },
          },
        },
      ]);

      mockPrisma.searchAlert.findUnique.mockResolvedValue(null);
      mockPrisma.searchAlert.create.mockResolvedValue({ id: 'alert-1' });
      mockPrisma.searchAlertDelivery.create.mockResolvedValue({ id: 'del-1' });
      mockPrisma.savedSearch.update.mockResolvedValue({});

      const outcome = await savedSearchService.evaluateNewProperty(propertyId);

      expect(outcome.matchedCount).toBe(1);
      expect(mockPrisma.searchAlert.create).toHaveBeenCalledWith({
        data: {
          savedSearchId: 'search-1',
          userId: 'tenant-1',
          propertyId,
          isRead: false,
        },
      });
      expect(mockNotificationService.notify).toHaveBeenCalled();
      expect(mockPrisma.searchAlertDelivery.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            searchAlertId: 'alert-1',
            channel: 'IN_APP',
            status: 'DELIVERED',
          }),
        }),
      );
    });

    it('prevents duplicate alert for the same property and saved search', async () => {
      mockPrisma.property.findFirst.mockResolvedValue({
        id: propertyId,
        title: 'Furnished Apartment',
        status: PropertyStatus.APPROVED,
        isAvailable: true,
        deletedAt: null,
        monthlyRentPkr: 30000,
        bedrooms: 2,
        bathrooms: 1,
        furnishing: null,
        localityId: 'loc-1',
        locality: { id: 'loc-1', name: 'University Town' },
        eligibility: PropertyEligibility.STUDENTS_ONLY,
        amenities: [],
      });

      mockPrisma.savedSearch.findMany.mockResolvedValue([
        {
          id: 'search-1',
          userId: 'tenant-1',
          name: 'Student Flat',
          alertsEnabled: true,
          filters: { localityId: 'loc-1' },
          user: {
            id: 'tenant-1',
            tenantProfile: { tenantType: TenantType.STUDENT },
          },
        },
      ]);

      // Alert already exists
      mockPrisma.searchAlert.findUnique.mockResolvedValue({ id: 'existing-alert' });

      const outcome = await savedSearchService.evaluateNewProperty(propertyId);

      expect(outcome.matchedCount).toBe(0);
      expect(mockPrisma.searchAlert.create).not.toHaveBeenCalled();
    });
  });

  describe('3. Strict Segregation in Recommendations', () => {
    it('ensures student receives ONLY student recommendations', async () => {
      mockPrisma.property.findMany.mockResolvedValue([
        {
          id: 'prop-student',
          title: 'Student Room',
          slug: 'student-room',
          eligibility: PropertyEligibility.STUDENTS_ONLY,
          propertyType: PropertyType.SINGLE_ROOM,
          monthlyRentPkr: 15000,
          securityDepositPkr: 15000,
          bedrooms: 1,
          bathrooms: 1,
          furnishing: 'Furnished',
          localityId: 'loc-1',
          locality: { id: 'loc-1', name: 'University Town' },
          latitude: 34.0,
          longitude: 71.5,
          isAvailable: true,
          viewCount: 10,
          inquiryCount: 2,
          favoriteCount: 5,
          createdAt: new Date(),
          images: [],
          amenities: [],
          qualitySnapshots: [],
        },
      ]);

      const recommendations = await recommendationService.getForYou(
        undefined,
        TenantType.STUDENT,
        10,
      );

      expect(mockPrisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            eligibility: PropertyEligibility.STUDENTS_ONLY,
            status: PropertyStatus.APPROVED,
            isAvailable: true,
          }),
        }),
      );

      expect(recommendations.length).toBe(1);
      expect(recommendations[0]!.property.eligibility).toBe(PropertyEligibility.STUDENTS_ONLY);
    });

    it('ensures family receives ONLY family recommendations', async () => {
      mockPrisma.property.findMany.mockResolvedValue([
        {
          id: 'prop-family',
          title: 'Family Portion',
          slug: 'family-portion',
          eligibility: PropertyEligibility.FAMILIES_ONLY,
          propertyType: PropertyType.PORTION,
          monthlyRentPkr: 50000,
          securityDepositPkr: 50000,
          bedrooms: 3,
          bathrooms: 2,
          furnishing: 'Unfurnished',
          localityId: 'loc-2',
          locality: { id: 'loc-2', name: 'Hayatabad' },
          latitude: 33.9,
          longitude: 71.4,
          isAvailable: true,
          viewCount: 20,
          inquiryCount: 5,
          favoriteCount: 8,
          createdAt: new Date(),
          images: [],
          amenities: [],
          qualitySnapshots: [],
        },
      ]);

      const recommendations = await recommendationService.getForYou(
        undefined,
        TenantType.FAMILY,
        10,
      );

      expect(mockPrisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            eligibility: PropertyEligibility.FAMILIES_ONLY,
            status: PropertyStatus.APPROVED,
            isAvailable: true,
          }),
        }),
      );

      expect(recommendations.length).toBe(1);
      expect(recommendations[0]!.property.eligibility).toBe(PropertyEligibility.FAMILIES_ONLY);
    });

    it('excludes unavailable or inactive properties from recommendations', async () => {
      await recommendationService.getForYou(undefined, TenantType.STUDENT, 10);

      expect(mockPrisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: PropertyStatus.APPROVED,
            isAvailable: true,
            deletedAt: null,
            locality: { isActive: true },
          }),
        }),
      );
    });

    it('returns structured explanation metadata for recommendations', async () => {
      const now = new Date();
      mockPrisma.property.findMany.mockResolvedValue([
        {
          id: 'prop-new',
          title: 'Brand New Listing',
          slug: 'brand-new-listing',
          eligibility: PropertyEligibility.STUDENTS_ONLY,
          propertyType: PropertyType.APARTMENT,
          monthlyRentPkr: 25000,
          securityDepositPkr: 25000,
          bedrooms: 2,
          bathrooms: 1,
          furnishing: 'Furnished',
          localityId: 'loc-1',
          locality: { id: 'loc-1', name: 'University Town' },
          latitude: 34.0,
          longitude: 71.5,
          isAvailable: true,
          viewCount: 15,
          inquiryCount: 3,
          favoriteCount: 7,
          createdAt: now,
          images: [],
          amenities: [],
          qualitySnapshots: [{ overallQualityScore: 90 }],
        },
      ]);

      const res = await recommendationService.getForYou(undefined, TenantType.STUDENT, 5);

      expect(res.length).toBe(1);
      expect(res[0]!.reason).toBeDefined();
      expect(res[0]!.reasonLabel).toBeDefined();
      expect(res[0]!.score).toBeGreaterThan(50);
      expect(res[0]!.metadata?.qualityScore).toBe(90);
    });
  });

  describe('4. Event Tracking & Analytics', () => {
    it('records property impression and increments locality demand metric', async () => {
      mockPrisma.propertyImpression.create.mockResolvedValue({ id: 'imp-1' });
      mockPrisma.property.findUnique.mockResolvedValue({ localityId: 'loc-1' });
      mockPrisma.localityDemandSnapshot.upsert.mockResolvedValue({});

      const res = await discoveryEventsService.recordImpression('user-1', undefined, {
        propertyId: 'prop-1',
        surface: 'SEARCH_RESULTS',
        position: 1,
      });

      expect(res.success).toBe(true);
      expect(mockPrisma.propertyImpression.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            propertyId: 'prop-1',
            surface: 'SEARCH_RESULTS',
          }),
        }),
      );
    });

    it('records property click and recently viewed property', async () => {
      mockPrisma.propertyClick.create.mockResolvedValue({ id: 'clk-1' });
      mockPrisma.recentlyViewedProperty.create.mockResolvedValue({ id: 'view-1' });
      mockPrisma.property.findUnique.mockResolvedValue({ localityId: 'loc-1' });
      mockPrisma.localityDemandSnapshot.upsert.mockResolvedValue({});

      const res = await discoveryEventsService.recordClick('user-1', undefined, {
        propertyId: 'prop-1',
        surface: 'FOR_YOU',
      });

      expect(res.success).toBe(true);
      expect(mockPrisma.propertyClick.create).toHaveBeenCalled();
      expect(mockPrisma.recentlyViewedProperty.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            propertyId: 'prop-1',
            userId: 'user-1',
          }),
        }),
      );
    });

    it('records search query log and updates locality demand count', async () => {
      mockPrisma.searchQueryLog.create.mockResolvedValue({ id: 'log-1' });
      mockPrisma.localityDemandSnapshot.upsert.mockResolvedValue({});

      const res = await discoveryEventsService.recordSearchQuery('user-1', undefined, {
        queryText: '2 bed university town',
        filters: { bedrooms: 2 },
        localityId: 'loc-1',
        resultsCount: 5,
        executionTimeMs: 45,
      });

      expect(res.success).toBe(true);
      expect(mockPrisma.searchQueryLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            queryText: '2 bed university town',
            localityId: 'loc-1',
            resultsCount: 5,
          }),
        }),
      );
    });
  });
});
