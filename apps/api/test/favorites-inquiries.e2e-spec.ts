import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { GlobalExceptionFilter } from '../src/common/filters/http-exception.filter';
import { ResponseTransformInterceptor } from '../src/common/interceptors/response-transform.interceptor';
import { TokenService } from '../src/modules/auth/token.service';
import { PrismaService } from '../src/database/prisma.service';
import { RedisService } from '../src/database/redis.service';
import { FavoriteService } from '../src/modules/favorite/favorite.service';
import { InquiryService } from '../src/modules/inquiry/inquiry.service';
import { UserRole, TenantType, InquiryStatus } from '@rental-peshawar/shared-types';

describe('Favorites and Inquiries E2E Tests', () => {
  let app: INestApplication;
  let tokenService: TokenService;
  jest.setTimeout(30000);

  const tenantId = '00000000-0000-0000-0000-000000000001';
  const landlordId = '00000000-0000-0000-0000-000000000002';
  const propertyId = '11111111-1111-1111-1111-111111111111';
  const favoriteId = '22222222-2222-2222-2222-222222222222';
  const inquiryId = '33333333-3333-3333-3333-333333333333';

  let tenantToken: string;
  let landlordToken: string;

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

  const mockFavoriteService = {
    addFavorite: jest.fn().mockImplementation((userId, propId) => {
      return Promise.resolve({
        id: favoriteId,
        userId,
        propertyId: propId,
        isFavorite: true,
      });
    }),
    removeFavorite: jest.fn().mockResolvedValue({
      success: true,
      message: 'Property removed from favorites.',
    }),
    getUserFavorites: jest.fn().mockResolvedValue([
      {
        id: favoriteId,
        propertyId,
        createdAt: new Date().toISOString(),
        property: {
          id: propertyId,
          title: 'Hayatabad Modern Apartment',
          monthlyRentPkr: 25000,
        },
      },
    ]),
    getUserFavoriteIds: jest.fn().mockResolvedValue([propertyId]),
  };

  const mockInquiryService = {
    createInquiry: jest.fn().mockImplementation((tId, dto) => {
      return Promise.resolve({
        id: inquiryId,
        propertyId: dto.propertyId,
        tenantId: tId,
        landlordId,
        status: InquiryStatus.SUBMITTED,
        message: dto.message,
        createdAt: new Date().toISOString(),
      });
    }),
    getMyInquiries: jest.fn().mockResolvedValue([
      {
        id: inquiryId,
        propertyId,
        tenantId,
        landlordId,
        status: InquiryStatus.SUBMITTED,
        message: 'Interested in this property',
        createdAt: new Date().toISOString(),
      },
    ]),
    getInquiryById: jest.fn().mockResolvedValue({
      id: inquiryId,
      propertyId,
      tenantId,
      landlordId,
      status: InquiryStatus.SUBMITTED,
      message: 'Interested in this property',
      createdAt: new Date().toISOString(),
    }),
    updateStatus: jest.fn().mockImplementation((inqId, _uId, dto) => {
      return Promise.resolve({
        id: inqId,
        status: dto.status,
      });
    }),
    updateStatusByLandlord: jest.fn().mockImplementation((inqId, _uId, dto) => {
      return Promise.resolve({
        id: inqId,
        status: dto.status,
      });
    }),
    deleteInquiry: jest.fn().mockResolvedValue({
      success: true,
      message: 'Inquiry closed successfully.',
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
      .overrideProvider(FavoriteService)
      .useValue(mockFavoriteService)
      .overrideProvider(InquiryService)
      .useValue(mockInquiryService)
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

    tenantToken = (
      await tokenService.generateTokens(
        tenantId,
        'student@peshawar.pk',
        [UserRole.TENANT],
        TenantType.STUDENT,
      )
    ).accessToken;

    landlordToken = (
      await tokenService.generateTokens(landlordId, 'landlord@peshawar.pk', [UserRole.LANDLORD])
    ).accessToken;

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Favorites Endpoints', () => {
    it('POST /api/v1/properties/:id/favorite - 401 when unauthorized', async () => {
      const res = await request(app.getHttpServer()).post(
        `/api/v1/properties/${propertyId}/favorite`,
      );
      expect(res.status).toBe(401);
    });

    it('POST /api/v1/properties/:id/favorite - Tenant saves property to favorites', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/properties/${propertyId}/favorite`)
        .set('Authorization', `Bearer ${tenantToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isFavorite).toBe(true);
    });

    it('GET /api/v1/favorites - Tenant gets list of favorite properties', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/favorites')
        .set('Authorization', `Bearer ${tenantToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
    });

    it('GET /api/v1/favorites/ids - Tenant gets array of favorited property IDs', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/favorites/ids')
        .set('Authorization', `Bearer ${tenantToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toContain(propertyId);
    });

    it('DELETE /api/v1/properties/:id/favorite - Tenant unfavorites property', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/properties/${propertyId}/favorite`)
        .set('Authorization', `Bearer ${tenantToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Inquiries Endpoints', () => {
    it('POST /api/v1/inquiries - 401 when unauthorized', async () => {
      const res = await request(app.getHttpServer()).post('/api/v1/inquiries').send({
        propertyId,
        message: 'Interested in this property for next semester',
      });
      expect(res.status).toBe(401);
    });

    it('POST /api/v1/inquiries - Tenant creates property inquiry', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/inquiries')
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({
          propertyId,
          message: 'Interested in this property for next semester',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(inquiryId);
      expect(res.body.data.status).toBe(InquiryStatus.SUBMITTED);
    });

    it('GET /api/v1/inquiries - User retrieves their inquiries', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/inquiries')
        .set('Authorization', `Bearer ${tenantToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
    });

    it('GET /api/v1/inquiries/:id - Retrieves inquiry by ID', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/inquiries/${inquiryId}`)
        .set('Authorization', `Bearer ${tenantToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(inquiryId);
    });

    it('PATCH /api/v1/inquiries/:id/status - Landlord accepts inquiry', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/inquiries/${inquiryId}/status`)
        .set('Authorization', `Bearer ${landlordToken}`)
        .send({ status: InquiryStatus.ACCEPTED });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(InquiryStatus.ACCEPTED);
    });
  });
});
