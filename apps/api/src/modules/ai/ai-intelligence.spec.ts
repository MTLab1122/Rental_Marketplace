import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { AiServiceImpl } from './ai.service';
import { ListingQualityService } from './listing-quality.service';
import { SemanticSearchService } from './semantic-search.service';
import { FraudDetectionService } from './fraud-detection.service';
import { ContentModerationService } from './content-moderation.service';
import { PricingIntelligenceService } from './pricing-intelligence.service';
import { PiiMaskerUtil } from './pii-masker.util';
import {
  PropertyEligibility,
  PropertyType,
  PropertyStatus,
  PriceContextIndicator,
} from '@rental-peshawar/shared-types';

describe('Phase 15: AI Listing Quality, Fraud Prevention & Marketplace Intelligence', () => {
  let aiService: AiServiceImpl;
  let qualityService: ListingQualityService;
  let searchService: SemanticSearchService;
  let fraudService: FraudDetectionService;
  let moderationService: ContentModerationService;
  let pricingService: PricingIntelligenceService;
  let prisma: PrismaService;

  const mockLandlord = {
    id: 'landlord-456',
    email: 'landlord@peshawar.pk',
    isVerified: false,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day old
    verificationRecords: [{ status: 'UNVERIFIED' }],
  };

  const mockProperty = {
    id: 'prop-hayatabad-101',
    landlordId: 'landlord-456',
    localityId: 'loc-hayatabad',
    title: 'Modern 2 Bed Portion in Phase 3 Hayatabad Peshawar',
    slug: 'modern-2-bed-portion-phase-3-hayatabad',
    description: 'Call 0300-1234567 or visit House # 42-B. Nice portion.',
    eligibility: PropertyEligibility.STUDENTS_ONLY,
    propertyType: PropertyType.PORTION,
    status: PropertyStatus.DRAFT,
    monthlyRentPkr: 35000,
    securityDepositPkr: 70000,
    bedrooms: 2,
    bathrooms: 2,
    areaSqFt: 1200,
    furnishing: 'UNFURNISHED',
    address: 'Phase 3, Sector D, Hayatabad, Peshawar',
    addressNote: 'Near Tatara Park',
    latitude: 33.985,
    longitude: 71.435,
    isAvailable: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    locality: { id: 'loc-hayatabad', name: 'Hayatabad', isActive: true },
    images: [{ id: 'img-1', url: 'https://cdn.rentalpeshawar.pk/img1.jpg', isPrimary: true }],
    amenities: [{ amenity: { id: 'am-1', name: 'Sui Gas' } }],
    landlord: mockLandlord,
  };

  beforeEach(async () => {
    const mockPrisma = {
      property: {
        findUnique: jest.fn().mockImplementation(({ where }) => {
          if (where.id === mockProperty.id) return Promise.resolve(mockProperty);
          return Promise.resolve(null);
        }),
        findMany: jest.fn().mockResolvedValue([
          {
            ...mockProperty,
            id: 'prop-approved-1',
            status: PropertyStatus.APPROVED,
            monthlyRentPkr: 30000,
            embedding: {
              embedding: new Array(384).fill(0.05),
            },
          },
          {
            ...mockProperty,
            id: 'prop-approved-2',
            status: PropertyStatus.APPROVED,
            monthlyRentPkr: 40000,
            embedding: {
              embedding: new Array(384).fill(0.06),
            },
          },
        ]),
        findFirst: jest.fn().mockResolvedValue(null),
        count: jest.fn().mockResolvedValue(0),
        update: jest
          .fn()
          .mockImplementation(({ data }) => Promise.resolve({ ...mockProperty, ...data })),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue(mockLandlord),
      },
      listingQualitySuggestion: {
        findFirst: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest
          .fn()
          .mockImplementation(({ data }) => Promise.resolve({ id: 'sugg-1', ...data })),
        update: jest
          .fn()
          .mockImplementation(({ data }) => Promise.resolve({ id: 'sugg-1', ...data })),
      },
      propertyEmbedding: {
        upsert: jest
          .fn()
          .mockImplementation(({ create }) => Promise.resolve({ id: 'emb-1', ...create })),
      },
      riskAssessment: {
        create: jest
          .fn()
          .mockImplementation(({ data }) => Promise.resolve({ id: 'risk-1', ...data })),
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
      contentModerationRecord: {
        create: jest
          .fn()
          .mockImplementation(({ data }) => Promise.resolve({ id: 'mod-1', ...data })),
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
      localityPricingInsight: {
        findUnique: jest.fn().mockResolvedValue(null),
        upsert: jest
          .fn()
          .mockImplementation(({ create }) => Promise.resolve({ id: 'pi-1', ...create })),
      },
      inquiry: {
        count: jest.fn().mockResolvedValue(25),
      },
      booking: {
        count: jest.fn().mockResolvedValue(6),
      },
      report: {
        count: jest.fn().mockResolvedValue(0),
      },
      landlordReputationSnapshot: {
        findMany: jest.fn().mockResolvedValue([{ responseRatePercent: 92.5 }]),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, def?: any) => {
              if (key === 'AI_ENABLED') return 'false'; // Test graceful disabled/heuristic mode
              if (key === 'AI_MODEL_VERSION') return 'peshawar-ai-v1.0';
              return def;
            }),
          },
        },
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        AiServiceImpl,
        ListingQualityService,
        SemanticSearchService,
        FraudDetectionService,
        ContentModerationService,
        PricingIntelligenceService,
      ],
    }).compile();

    aiService = module.get<AiServiceImpl>(AiServiceImpl);
    qualityService = module.get<ListingQualityService>(ListingQualityService);
    searchService = module.get<SemanticSearchService>(SemanticSearchService);
    fraudService = module.get<FraudDetectionService>(FraudDetectionService);
    moderationService = module.get<ContentModerationService>(ContentModerationService);
    pricingService = module.get<PricingIntelligenceService>(PricingIntelligenceService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('1. PII Redaction & Privacy Safeguards', () => {
    it('masks Pakistani CNIC, mobile numbers, and unit addresses before AI transmission', () => {
      const rawText =
        'Contact landlord at 0300-1234567 or 0321 7654321. CNIC 17301-1234567-1. Meet at House # 42-B, Sector D.';
      const masked = PiiMaskerUtil.maskText(rawText);

      expect(masked).not.toContain('0300-1234567');
      expect(masked).not.toContain('17301-1234567-1');
      expect(masked).not.toContain('House # 42-B');
      expect(masked).toContain('[REDACTED_PHONE]');
      expect(masked).toContain('[REDACTED_CNIC]');
      expect(masked).toContain('[REDACTED_ADDRESS_UNIT]');
    });
  });

  describe('2. AI Listing Quality Assistant', () => {
    it('generates suggestions without auto-publishing or modifying property status', async () => {
      const result = await qualityService.generateQualitySuggestions(
        mockProperty.id,
        mockProperty.landlordId,
      );

      expect(result.propertyId).toBe(mockProperty.id);
      expect(result.propertyStatus).toBe(PropertyStatus.DRAFT); // NEVER altered to APPROVED
      expect(result.suggestionsCount).toBeGreaterThan(0);
      expect(prisma.property.update).not.toHaveBeenCalled(); // No status mutation
    });
  });

  describe('3. Semantic & Hybrid Property Search', () => {
    it('enforces Peshawar municipal boundary, eligibility constraints, and approved status', async () => {
      const searchRes = await searchService.searchSemantic({
        query: 'furnished portion for university students near campus',
        eligibility: PropertyEligibility.STUDENTS_ONLY,
      });

      expect(prisma.property.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: PropertyStatus.APPROVED,
            isAvailable: true,
            eligibility: PropertyEligibility.STUDENTS_ONLY,
            latitude: expect.any(Object), // Boundary bounds checked
            longitude: expect.any(Object),
          }),
        }),
      );

      expect(searchRes.results.length).toBeGreaterThan(0);
      const firstResult = searchRes.results[0]!;
      expect(firstResult.matchExplanation).toBeDefined();
      expect(firstResult.matchExplanation.explanationText).toBeDefined();
    });
  });

  describe('4. Fraud Detection & Risk Scoring', () => {
    it('triggers manual review escalation when listing score reaches high/critical threshold', async () => {
      const assessment = await fraudService.evaluatePropertyRisk(mockProperty.id);

      expect(assessment).toBeDefined();
      expect(assessment.riskScore).toBeDefined();
      // Landlord is unverified and account is 1 day old -> triggers signals
      const signalsList = assessment.signals as any[];
      expect(signalsList.length).toBeGreaterThan(0);
      expect(['MEDIUM', 'HIGH', 'CRITICAL']).toContain(assessment.riskLevel);
      expect(prisma.riskAssessment.create).toHaveBeenCalled();
    });
  });

  describe('5. Content Moderation & Safety Auditing', () => {
    it('detects scam language and records auditable moderation decisions', async () => {
      const scamText = 'Please send advance via JazzCash to lock this booking before viewing.';
      const res = await moderationService.moderateText(scamText, 'MESSAGE', 'msg-999');

      expect(res.flagged).toBe(true);
      expect(res.suggestedAction).toBe('BLOCKED');
      expect(prisma.contentModerationRecord.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            contentType: 'TEXT',
            entityId: 'msg-999',
            flag: 'SCAM_LANGUAGE',
            actionTaken: 'BLOCKED',
          }),
        }),
      );
    });
  });

  describe('6. Pricing Intelligence', () => {
    it('uses only approved active listings to benchmark rent and provides non-guaranteed disclaimer', async () => {
      const insights = await pricingService.getPropertyPriceInsights(mockProperty.id);

      expect(insights.propertyId).toBe(mockProperty.id);
      expect(insights.medianRentPkr).toBeGreaterThan(0);
      expect(insights.priceContext).toBeDefined();
      expect([
        PriceContextIndicator.BELOW_MARKET,
        PriceContextIndicator.AROUND_MARKET,
        PriceContextIndicator.ABOVE_MARKET,
      ]).toContain(insights.priceContext);
      expect(insights.disclaimer).toContain('DISCLAIMER');
      expect(insights.disclaimer).toContain('do not constitute a guaranteed rental agreement');
    });
  });

  describe('7. Graceful Degradation in Disabled AI Mode', () => {
    it('produces reliable deterministic embeddings and heuristic suggestions when AI is disabled', async () => {
      expect(aiService.isAiEnabled()).toBe(false);

      const embedding = await aiService.generateEmbedding('student hostel in Hayatabad');
      expect(embedding).toHaveLength(384);
      // Normalized unit vector check (sum of squares ~ 1)
      const magnitude = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0));
      expect(magnitude).toBeCloseTo(1, 2);

      const suggestions = await aiService.analyzeListingQuality({
        description: 'Short text',
        imagesCount: 1,
        amenities: [],
      });
      expect(suggestions.length).toBeGreaterThan(0);
    });
  });
});
