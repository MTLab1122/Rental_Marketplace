import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { GlobalExceptionFilter } from '../src/common/filters/http-exception.filter';
import { ResponseTransformInterceptor } from '../src/common/interceptors/response-transform.interceptor';
import { TokenService } from '../src/modules/auth/token.service';
import { PrismaService } from '../src/database/prisma.service';
import { RedisService } from '../src/database/redis.service';
import { MediaService } from '../src/modules/media/media.service';
import { VerificationService } from '../src/modules/verification/verification.service';
import { ReportService } from '../src/modules/report/report.service';
import { PropertyService } from '../src/modules/property/property.service';
import {
  UserRole,
  VerificationStatus,
  ImageModerationStatus,
  ReportStatus,
  ReportReason,
  PropertyStatus,
} from '@rental-peshawar/shared-types';

describe('Media, Moderation, Verification & Reporting E2E Tests', () => {
  let app: INestApplication;
  let tokenService: TokenService;
  jest.setTimeout(30000);

  const adminId = '00000000-0000-0000-0000-000000000001';
  const landlordId = '00000000-0000-0000-0000-000000000002';
  const tenantId = '00000000-0000-0000-0000-000000000003';
  const propertyId = '11111111-1111-1111-1111-111111111111';
  const imageId = '22222222-2222-2222-2222-222222222222';
  const verificationId = '33333333-3333-3333-3333-333333333333';
  const reportId = '44444444-4444-4444-4444-444444444444';

  let adminToken: string;
  let landlordToken: string;
  let tenantToken: string;

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

  const mockMediaService = {
    getUploadUrl: jest.fn().mockImplementation((userId, dto) => {
      return Promise.resolve({
        uploadUrl: `https://storage.rental-peshawar.pk/upload?key=${dto.purpose}-test`,
        method: 'PUT',
        storageKey: `properties/${dto.propertyId || userId}/img-1.jpg`,
        expiresInSeconds: 900,
        publicUrl: `https://cdn.rental-peshawar.pk/properties/${dto.propertyId || userId}/img-1.jpg`,
      });
    }),
    completeUpload: jest.fn().mockImplementation((_userId, dto) => {
      return Promise.resolve({
        id: imageId,
        propertyId: dto.propertyId || propertyId,
        url: `https://cdn.rental-peshawar.pk/${dto.storageKey}`,
        thumbnailUrl: `https://cdn.rental-peshawar.pk/${dto.storageKey}?w=300`,
        storageKey: dto.storageKey,
        moderationStatus: ImageModerationStatus.PENDING,
        isPrimary: dto.isPrimary ?? true,
        sortOrder: dto.sortOrder ?? 0,
        fileSizeBytes: dto.fileSizeBytes,
        mimeType: dto.mimeType,
        width: dto.width ?? 1200,
        height: dto.height ?? 800,
      });
    }),
    deleteMedia: jest.fn().mockResolvedValue({
      success: true,
      message: 'Image deleted successfully.',
    }),
    moderateImage: jest.fn().mockImplementation((id, adminId, dto) => {
      return Promise.resolve({
        id,
        moderationStatus: dto.status,
        rejectionReason: dto.rejectionReason || null,
        moderatedById: adminId,
        moderatedAt: new Date().toISOString(),
      });
    }),
  };

  const mockVerificationService = {
    submitVerification: jest.fn().mockImplementation((userId, dto) => {
      return Promise.resolve({
        id: verificationId,
        userId,
        fullName: dto.fullName,
        phoneNumber: dto.phoneNumber,
        cnicNumberMasked: '17301-*******-1',
        status: VerificationStatus.PENDING,
        address: dto.address,
        createdAt: new Date().toISOString(),
      });
    }),
    getLandlordVerification: jest.fn().mockImplementation((userId) => {
      return Promise.resolve({
        id: verificationId,
        userId,
        fullName: 'Muhammad Ahmad',
        phoneNumber: '+923001234567',
        cnicNumberMasked: '17301-*******-1',
        status: VerificationStatus.PENDING,
        address: 'Phase 5, Hayatabad, Peshawar',
        createdAt: new Date().toISOString(),
      });
    }),
    reviewVerification: jest.fn().mockImplementation((recId, _adminId, dto) => {
      return Promise.resolve({
        id: recId,
        userId: landlordId,
        status: dto.status,
        reviewNotes: dto.reviewNotes || null,
        verifiedAt: dto.status === VerificationStatus.VERIFIED ? new Date().toISOString() : null,
      });
    }),
    getVerificationsForAdmin: jest.fn().mockResolvedValue([
      {
        id: verificationId,
        userId: landlordId,
        fullName: 'Muhammad Ahmad',
        cnicNumberMasked: '17301-*******-1',
        status: VerificationStatus.PENDING,
      },
    ]),
  };

  const mockReportService = {
    createReport: jest.fn().mockImplementation((reporterId, dto) => {
      return Promise.resolve({
        id: reportId,
        reporterId,
        targetType: dto.targetType,
        targetId: dto.targetId,
        reason: dto.reason,
        details: dto.details || null,
        status: ReportStatus.OPEN,
        createdAt: new Date().toISOString(),
      });
    }),
    getMyReports: jest.fn().mockImplementation((reporterId) => {
      return Promise.resolve([
        {
          id: reportId,
          reporterId,
          targetType: 'PROPERTY',
          targetId: propertyId,
          reason: ReportReason.FAKE_LISTING,
          status: ReportStatus.OPEN,
          createdAt: new Date().toISOString(),
        },
      ]);
    }),
    getAllReportsAdmin: jest.fn().mockResolvedValue([
      {
        id: reportId,
        reporterId: tenantId,
        targetType: 'PROPERTY',
        targetId: propertyId,
        reason: ReportReason.FAKE_LISTING,
        status: ReportStatus.OPEN,
        createdAt: new Date().toISOString(),
      },
    ]),
    reviewReport: jest.fn().mockImplementation((repId, adminId, dto) => {
      return Promise.resolve({
        id: repId,
        status: dto.status,
        resolutionNotes: dto.resolutionNotes || null,
        resolvedById: adminId,
      });
    }),
  };

  const mockPropertyService = {
    findAllAdmin: jest.fn().mockResolvedValue({
      items: [
        {
          id: propertyId,
          title: 'Hayatabad Luxury Flat',
          status: PropertyStatus.PENDING_REVIEW,
          landlordId,
        },
      ],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    }),
    findByIdForAdmin: jest.fn().mockResolvedValue({
      id: propertyId,
      title: 'Hayatabad Luxury Flat',
      status: PropertyStatus.PENDING_REVIEW,
      landlordId,
      images: [],
    }),
    approveByAdmin: jest.fn().mockResolvedValue({
      id: propertyId,
      title: 'Hayatabad Luxury Flat',
      status: PropertyStatus.APPROVED,
      isAvailable: true,
    }),
    rejectByAdmin: jest.fn().mockResolvedValue({
      id: propertyId,
      title: 'Hayatabad Luxury Flat',
      status: PropertyStatus.REJECTED,
      rejectionReason: 'Invalid address',
    }),
    suspendByAdmin: jest.fn().mockResolvedValue({
      id: propertyId,
      title: 'Hayatabad Luxury Flat',
      status: PropertyStatus.SUSPENDED,
      suspensionReason: 'Under fraud investigation',
    }),
    restoreByAdmin: jest.fn().mockResolvedValue({
      id: propertyId,
      title: 'Hayatabad Luxury Flat',
      status: PropertyStatus.APPROVED,
      isAvailable: true,
    }),
    deleteByAdmin: jest.fn().mockResolvedValue({
      success: true,
      message: 'Property deleted by administrator.',
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
      .overrideProvider(MediaService)
      .useValue(mockMediaService)
      .overrideProvider(VerificationService)
      .useValue(mockVerificationService)
      .overrideProvider(ReportService)
      .useValue(mockReportService)
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

    adminToken = (await tokenService.generateTokens(adminId, 'admin@peshawar.pk', [UserRole.ADMIN]))
      .accessToken;

    landlordToken = (
      await tokenService.generateTokens(landlordId, 'landlord@peshawar.pk', [UserRole.LANDLORD])
    ).accessToken;

    tenantToken = (
      await tokenService.generateTokens(tenantId, 'tenant@peshawar.pk', [UserRole.TENANT])
    ).accessToken;

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // =========================================================================
  // 1. MEDIA UPLOAD & IMAGE MODERATION
  // =========================================================================
  describe('Media Upload & Management APIs', () => {
    it('POST /api/v1/media/upload-url - 401 Unauthorized when missing token', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/media/upload-url')
        .send({
          purpose: 'property_image',
          propertyId,
          mimeType: 'image/jpeg',
          fileSizeBytes: 1024 * 500,
        });

      expect(res.status).toBe(401);
    });

    it('POST /api/v1/media/upload-url - Landlord gets signed upload URL', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/media/upload-url')
        .set('Authorization', `Bearer ${landlordToken}`)
        .send({
          purpose: 'property_image',
          propertyId,
          mimeType: 'image/jpeg',
          fileSizeBytes: 1024 * 500,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.uploadUrl).toBeDefined();
      expect(res.body.data.storageKey).toBeDefined();
    });

    it('POST /api/v1/media/complete-upload - Finalizes uploaded image', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/media/complete-upload')
        .set('Authorization', `Bearer ${landlordToken}`)
        .send({
          storageKey: `properties/${propertyId}/img-1.jpg`,
          propertyId,
          mimeType: 'image/jpeg',
          fileSizeBytes: 1024 * 500,
          width: 1200,
          height: 800,
          isPrimary: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.moderationStatus).toBe(ImageModerationStatus.PENDING);
    });

    it('DELETE /api/v1/media/:id - Landlord deletes own media image', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/media/${imageId}`)
        .set('Authorization', `Bearer ${landlordToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('PATCH /api/v1/admin/media/:id/moderate - 403 Forbidden for tenant', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/admin/media/${imageId}/moderate`)
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({ status: ImageModerationStatus.APPROVED });

      expect(res.status).toBe(403);
    });

    it('PATCH /api/v1/admin/media/:id/moderate - Admin approves image', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/admin/media/${imageId}/moderate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: ImageModerationStatus.APPROVED });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.moderationStatus).toBe(ImageModerationStatus.APPROVED);
    });
  });

  // =========================================================================
  // 2. LANDLORD IDENTITY VERIFICATION
  // =========================================================================
  describe('Landlord Verification Workflow', () => {
    it('POST /api/v1/landlord/verification - Landlord submits CNIC verification documents', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/landlord/verification')
        .set('Authorization', `Bearer ${landlordToken}`)
        .send({
          fullName: 'Muhammad Ahmad',
          phoneNumber: '+923001234567',
          cnicNumber: '17301-1234567-1',
          cnicFrontStorageKey: 'verifications/cnic-front.jpg',
          cnicBackStorageKey: 'verifications/cnic-back.jpg',
          selfieStorageKey: 'verifications/selfie.jpg',
          address: 'Phase 5, Hayatabad, Peshawar',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(VerificationStatus.PENDING);
      expect(res.body.data.cnicNumberMasked).toBe('17301-*******-1');
    });

    it('GET /api/v1/landlord/verification - Landlord checks status', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/landlord/verification')
        .set('Authorization', `Bearer ${landlordToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(VerificationStatus.PENDING);
      expect(res.body.data.cnicNumberMasked).toBe('17301-*******-1');
    });

    it('GET /api/v1/admin/verifications - Admin lists verifications', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/admin/verifications')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
    });

    it('POST /api/v1/admin/verifications/:id/review - Admin approves verification', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/admin/verifications/${verificationId}/review`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: VerificationStatus.VERIFIED,
          reviewNotes: 'Verified against NADRA standards',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(VerificationStatus.VERIFIED);
    });
  });

  // =========================================================================
  // 3. ADMIN PROPERTY MODERATION WORKFLOW
  // =========================================================================
  describe('Admin Property Moderation Workflow', () => {
    it('GET /api/v1/admin/properties - Admin lists pending listings', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/admin/properties?status=PENDING_REVIEW')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items).toHaveLength(1);
    });

    it('GET /api/v1/admin/properties/:id - Admin inspects listing detail', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/admin/properties/${propertyId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(propertyId);
    });

    it('PATCH /api/v1/admin/properties/:id/approve - Admin approves listing', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/admin/properties/${propertyId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(PropertyStatus.APPROVED);
    });

    it('PATCH /api/v1/admin/properties/:id/reject - Admin rejects listing', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/admin/properties/${propertyId}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Invalid address' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(PropertyStatus.REJECTED);
    });

    it('PATCH /api/v1/admin/properties/:id/suspend - Admin suspends listing', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/admin/properties/${propertyId}/suspend`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Under fraud investigation' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(PropertyStatus.SUSPENDED);
    });

    it('PATCH /api/v1/admin/properties/:id/restore - Admin restores suspended listing', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/admin/properties/${propertyId}/restore`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(PropertyStatus.APPROVED);
    });

    it('DELETE /api/v1/admin/properties/:id - Admin soft deletes listing', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/admin/properties/${propertyId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // =========================================================================
  // 4. PLATFORM REPORTING WORKFLOW
  // =========================================================================
  describe('Platform Reporting Workflow', () => {
    it('POST /api/v1/reports - Tenant files a report against a fake listing', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/reports')
        .set('Authorization', `Bearer ${tenantToken}`)
        .send({
          targetType: 'PROPERTY',
          targetId: propertyId,
          reason: ReportReason.FAKE_LISTING,
          details: 'Listing photos are taken from a hotel in Islamabad',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(ReportStatus.OPEN);
      expect(res.body.data.reason).toBe(ReportReason.FAKE_LISTING);
    });

    it('GET /api/v1/reports/my - User views their filed reports', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/reports/my')
        .set('Authorization', `Bearer ${tenantToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
    });

    it('GET /api/v1/admin/reports - Admin views all platform reports', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/admin/reports')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
    });

    it('PATCH /api/v1/admin/reports/:id - Admin resolves report', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/admin/reports/${reportId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: ReportStatus.RESOLVED,
          resolutionNotes: 'Property has been permanently taken down.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe(ReportStatus.RESOLVED);
    });
  });
});
