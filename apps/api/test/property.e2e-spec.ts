import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { GlobalExceptionFilter } from '../src/common/filters/http-exception.filter';
import { ResponseTransformInterceptor } from '../src/common/interceptors/response-transform.interceptor';
import { TokenService } from '../src/modules/auth/token.service';
import { LocalityService } from '../src/modules/locality/locality.service';
import { PropertyService } from '../src/modules/property/property.service';
import { PrismaService } from '../src/database/prisma.service';
import { RedisService } from '../src/database/redis.service';
import {
  UserRole,
  TenantType,
  PropertyEligibility,
  PropertyType,
  PropertyStatus,
} from '@rental-peshawar/shared-types';

describe('Locality, Property & Search E2E Tests', () => {
  let app: INestApplication;
  let tokenService: TokenService;
  jest.setTimeout(30000);

  const adminId = '00000000-0000-0000-0000-000000000001';
  const landlordId = '00000000-0000-0000-0000-000000000002';
  const studentTenantId = '00000000-0000-0000-0000-000000000003';
  const familyTenantId = '00000000-0000-0000-0000-000000000004';
  const localityId = '11111111-1111-1111-1111-111111111111';
  const propertyId = '22222222-2222-2222-2222-222222222222';

  let adminToken: string;
  let landlordToken: string;
  let studentToken: string;
  let familyToken: string;

  const mockPrismaService = {
    $connect: jest.fn().mockResolvedValue(undefined),
    $disconnect: jest.fn().mockResolvedValue(undefined),
    isHealthy: jest.fn().mockResolvedValue(true),
  };

  const mockRedisService = {
    isHealthy: jest.fn().mockResolvedValue(true),
    getClient: jest.fn().mockReturnValue(null),
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
  };

  const sampleLocality = {
    id: localityId,
    name: 'University Town',
    slug: 'university-town',
    description: 'Premier student locality near University of Peshawar',
    postalCode: '25120',
    latitude: 33.9982,
    longitude: 71.4883,
    isActive: true,
    sortOrder: 1,
    _count: { properties: 12 },
  };

  const sampleStudentProperty = {
    id: propertyId,
    title: 'University Town Student Studio',
    slug: 'university-town-student-studio-xyz123',
    description: 'Fully furnished studio for students',
    eligibility: PropertyEligibility.STUDENTS_ONLY,
    propertyType: PropertyType.SINGLE_ROOM,
    monthlyRentPkr: 15000,
    securityDepositPkr: 30000,
    bedrooms: 1,
    bathrooms: 1,
    areaSqFt: 350,
    furnishing: 'FURNISHED',
    addressNote: 'Near UOP Gate 1',
    locality: {
      id: localityId,
      name: 'University Town',
      slug: 'university-town',
      postalCode: '25120',
    },
    coordinates: {
      latitude: 33.9982,
      longitude: 71.4883,
    },
    isAvailable: true,
    isFeatured: true,
    viewCount: 25,
    inquiryCount: 4,
    favoriteCount: 8,
    images: [{ id: 'img-1', url: 'https://cdn.example.com/p1.jpg', isPrimary: true, sortOrder: 0 }],
    amenities: [{ id: 'am-1', name: 'High-Speed Internet', code: 'HIGH_SPEED_WIFI' }],
    createdAt: new Date().toISOString(),
  };

  const sampleFamilyProperty = {
    id: '33333333-3333-3333-3333-333333333333',
    title: 'Hayatabad Phase 4 Family House',
    slug: 'hayatabad-phase-4-family-house-abc456',
    description: 'Spacious 4 bedroom house for families',
    eligibility: PropertyEligibility.FAMILIES_ONLY,
    propertyType: PropertyType.HOUSE,
    monthlyRentPkr: 75000,
    securityDepositPkr: 150000,
    bedrooms: 4,
    bathrooms: 4,
    areaSqFt: 2500,
    furnishing: 'UNFURNISHED',
    addressNote: 'Near Phase 4 Commercial Market',
    locality: {
      id: 'locality-2',
      name: 'Hayatabad',
      slug: 'hayatabad',
      postalCode: '25100',
    },
    coordinates: {
      latitude: 33.9875,
      longitude: 71.4332,
    },
    isAvailable: true,
    isFeatured: false,
    viewCount: 40,
    inquiryCount: 6,
    favoriteCount: 15,
    images: [{ id: 'img-2', url: 'https://cdn.example.com/p2.jpg', isPrimary: true, sortOrder: 0 }],
    amenities: [{ id: 'am-2', name: 'Car Parking', code: 'CAR_PARKING' }],
    createdAt: new Date().toISOString(),
  };

  const mockLocalityService = {
    findAllActive: jest.fn().mockResolvedValue([sampleLocality]),
    findByIdOrSlug: jest.fn().mockImplementation((idOrSlug) => {
      if (idOrSlug === localityId || idOrSlug === 'university-town') {
        return Promise.resolve(sampleLocality);
      }
      return Promise.reject(new Error('Locality not found'));
    }),
    create: jest.fn().mockImplementation((dto) => {
      return Promise.resolve({
        id: localityId,
        ...dto,
        slug: 'new-locality',
        isActive: true,
        sortOrder: 1,
      });
    }),
    updateStatus: jest.fn().mockResolvedValue({
      id: localityId,
      name: 'University Town',
      isActive: false,
    }),
  };

  const mockPropertyService = {
    create: jest.fn().mockResolvedValue(sampleStudentProperty),
    findAllByLandlord: jest.fn().mockResolvedValue([sampleStudentProperty]),
    findByIdForLandlord: jest.fn().mockResolvedValue(sampleStudentProperty),
    updateStatusByLandlord: jest.fn().mockResolvedValue({
      ...sampleStudentProperty,
      status: PropertyStatus.PENDING_REVIEW,
    }),
    updateStatusByAdmin: jest.fn().mockImplementation((_id, _adminId, dto) => {
      return Promise.resolve({
        ...sampleStudentProperty,
        status: dto.status,
        rejectionReason: dto.reason || null,
      });
    }),
    searchPublic: jest.fn().mockImplementation((query, currentUser) => {
      const effectiveType = currentUser?.tenantType || query.tenantType;
      if (effectiveType === TenantType.STUDENT) {
        return Promise.resolve({
          items: [sampleStudentProperty],
          nextCursor: null,
          hasMore: false,
        });
      }
      if (effectiveType === TenantType.FAMILY) {
        return Promise.resolve({
          items: [sampleFamilyProperty],
          nextCursor: null,
          hasMore: false,
        });
      }
      return Promise.resolve({
        items: [sampleStudentProperty, sampleFamilyProperty],
        nextCursor: null,
        hasMore: false,
      });
    }),
    findPublicById: jest.fn().mockImplementation((idOrSlug, currentUser) => {
      if (idOrSlug === propertyId || idOrSlug === sampleStudentProperty.slug) {
        if (currentUser?.tenantType === TenantType.FAMILY) {
          return Promise.reject(new Error('Not found'));
        }
        return Promise.resolve(sampleStudentProperty);
      }
      return Promise.reject(new Error('Not found'));
    }),
    getFeatured: jest.fn().mockResolvedValue({
      items: [sampleStudentProperty],
      nextCursor: null,
      hasMore: false,
    }),
    getRecent: jest.fn().mockResolvedValue({
      items: [sampleStudentProperty],
      nextCursor: null,
      hasMore: false,
    }),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .overrideProvider(RedisService)
      .useValue(mockRedisService)
      .overrideProvider(LocalityService)
      .useValue(mockLocalityService)
      .overrideProvider(PropertyService)
      .useValue(mockPropertyService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1', {
      exclude: ['health', 'ready', 'docs', 'docs-json'],
    });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new GlobalExceptionFilter());
    app.useGlobalInterceptors(new ResponseTransformInterceptor());

    tokenService = app.get(TokenService);

    // Generate JWT access tokens for various test personas
    adminToken = (await tokenService.generateTokens(adminId, 'admin@peshawar.pk', [UserRole.ADMIN]))
      .accessToken;

    landlordToken = (
      await tokenService.generateTokens(landlordId, 'landlord@peshawar.pk', [UserRole.LANDLORD])
    ).accessToken;

    studentToken = (
      await tokenService.generateTokens(
        studentTenantId,
        'student@peshawar.pk',
        [UserRole.TENANT],
        TenantType.STUDENT,
      )
    ).accessToken;

    familyToken = (
      await tokenService.generateTokens(
        familyTenantId,
        'family@peshawar.pk',
        [UserRole.TENANT],
        TenantType.FAMILY,
      )
    ).accessToken;

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('1. Locality APIs', () => {
    it('GET /api/v1/localities - public returns active Peshawar localities', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/localities').expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0].name).toBe('University Town');
      expect(res.body.data[0].slug).toBe('university-town');
    });

    it('GET /api/v1/localities/:id - public returns locality detail', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/localities/${localityId}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(localityId);
      expect(res.body.data.name).toBe('University Town');
    });

    it('POST /api/v1/admin/localities - rejects unauthorized non-admin access with 403', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/admin/localities')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          name: 'Hayatabad Phase 8',
          postalCode: '25100',
          latitude: 33.9875,
          longitude: 71.4332,
        })
        .expect(403);
    });

    it('POST /api/v1/admin/localities - creates new locality with ADMIN token', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/admin/localities')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Regi Model Town Phase 1',
          postalCode: '25130',
          latitude: 34.0624,
          longitude: 71.4112,
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Regi Model Town Phase 1');
    });

    it('PATCH /api/v1/admin/localities/:id/status - updates status with ADMIN token', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/admin/localities/${localityId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isActive: false })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.isActive).toBe(false);
    });
  });

  describe('2. Landlord Property Management APIs', () => {
    it('POST /api/v1/landlord/properties - rejects unauthenticated request with 401', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/landlord/properties')
        .send({ title: 'Test Room' })
        .expect(401);
    });

    it('POST /api/v1/landlord/properties - rejects tenant role with 403', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/landlord/properties')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          title: 'Student Room',
          description: 'A quiet room.',
          eligibility: PropertyEligibility.STUDENTS_ONLY,
          propertyType: PropertyType.SINGLE_ROOM,
          monthlyRentPkr: 15000,
          securityDepositPkr: 30000,
          bedrooms: 1,
          bathrooms: 1,
          address: 'University Town',
          latitude: 33.9982,
          longitude: 71.4883,
          localityId,
        })
        .expect(403);
    });

    it('POST /api/v1/landlord/properties - creates listing with LANDLORD token', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/landlord/properties')
        .set('Authorization', `Bearer ${landlordToken}`)
        .send({
          title: 'University Town Student Studio',
          description: 'Fully furnished studio for students',
          eligibility: PropertyEligibility.STUDENTS_ONLY,
          propertyType: PropertyType.SINGLE_ROOM,
          monthlyRentPkr: 15000,
          securityDepositPkr: 30000,
          bedrooms: 1,
          bathrooms: 1,
          address: 'Street 4, Sector B',
          latitude: 33.9982,
          longitude: 71.4883,
          localityId,
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('University Town Student Studio');
    });

    it('GET /api/v1/landlord/properties - lists landlord own listings', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/landlord/properties')
        .set('Authorization', `Bearer ${landlordToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0].id).toBe(propertyId);
    });

    it('PATCH /api/v1/landlord/properties/:id/status - submits listing for review', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/landlord/properties/${propertyId}/status`)
        .set('Authorization', `Bearer ${landlordToken}`)
        .send({ status: PropertyStatus.PENDING_REVIEW })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(PropertyStatus.PENDING_REVIEW);
    });
  });

  describe('3. Public Search, Discovery & Strict Tenant Segregation', () => {
    it('GET /api/v1/properties - student tenant query receives ONLY STUDENTS_ONLY properties', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/properties')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.items)).toBe(true);
      for (const item of res.body.data.items) {
        expect(item.eligibility).toBe(PropertyEligibility.STUDENTS_ONLY);
      }
    });

    it('GET /api/v1/properties - family tenant query receives ONLY FAMILIES_ONLY properties', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/properties')
        .set('Authorization', `Bearer ${familyToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.items)).toBe(true);
      for (const item of res.body.data.items) {
        expect(item.eligibility).toBe(PropertyEligibility.FAMILIES_ONLY);
      }
    });

    it('GET /api/v1/properties/featured - returns featured properties envelope', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/properties/featured?limit=5')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.items).toBeDefined();
    });

    it('GET /api/v1/properties/recent - returns recent properties envelope', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/properties/recent?limit=5')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.items).toBeDefined();
    });

    it('GET /api/v1/properties/:id - returns public property details', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/properties/${propertyId}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(propertyId);
      expect(res.body.data.title).toBe(sampleStudentProperty.title);
    });
  });

  describe('4. Admin Listing Moderation', () => {
    it('PATCH /api/v1/admin/properties/:id/status - admin approves listing', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/admin/properties/${propertyId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: PropertyStatus.APPROVED })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(PropertyStatus.APPROVED);
    });

    it('PATCH /api/v1/admin/properties/:id/status - admin rejects listing with reason', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/admin/properties/${propertyId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: PropertyStatus.REJECTED,
          reason: 'Incomplete property documentation',
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(PropertyStatus.REJECTED);
    });
  });
});
