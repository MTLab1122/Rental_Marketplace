import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { GlobalExceptionFilter } from '../src/common/filters/http-exception.filter';
import { ResponseTransformInterceptor } from '../src/common/interceptors/response-transform.interceptor';
import { TokenService } from '../src/modules/auth/token.service';
import { AuthService } from '../src/modules/auth/auth.service';
import { PrismaService } from '../src/database/prisma.service';
import { RedisService } from '../src/database/redis.service';
import { UserRole, TenantType } from '@rental-peshawar/shared-types';

describe('Auth & Health System E2E Tests', () => {
  let app: INestApplication;
  let tokenService: TokenService;
  jest.setTimeout(30000);

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

  const mockAuthService = {
    register: jest.fn().mockImplementation((dto) => {
      return Promise.resolve({
        user: {
          id: 'user-e2e-1',
          email: dto.email,
          fullName: dto.fullName,
          phoneNumber: dto.phoneNumber,
          roles: [dto.role],
          tenantType: dto.tenantType || null,
          isVerified: false,
          isSuspended: false,
          createdAt: new Date().toISOString(),
        },
        tokens: {
          accessToken: 'mock.e2e.access.token',
          refreshToken: 'mock.e2e.refresh.token',
          expiresIn: 900,
        },
      });
    }),
    login: jest.fn().mockResolvedValue({
      user: {
        id: 'user-e2e-1',
        email: 'tenant@peshawar.pk',
        fullName: 'Ahmad Khan',
        phoneNumber: '+923001234567',
        roles: [UserRole.TENANT],
        tenantType: TenantType.STUDENT,
        isVerified: true,
        isSuspended: false,
        createdAt: new Date().toISOString(),
      },
      tokens: {
        accessToken: 'mock.e2e.access.token',
        refreshToken: 'mock.e2e.refresh.token',
        expiresIn: 900,
      },
    }),
    getMe: jest.fn().mockResolvedValue({
      id: '00000000-0000-0000-0000-000000000001',
      email: 'tenant@peshawar.pk',
      fullName: 'Ahmad Khan',
      phoneNumber: '+923001234567',
      roles: [UserRole.TENANT],
      tenantType: TenantType.STUDENT,
      isVerified: true,
      isSuspended: false,
      permissions: ['inquiry:create', 'inquiry:read_own'],
      createdAt: new Date().toISOString(),
      tenantProfile: {
        id: 'tp-1',
        tenantType: TenantType.STUDENT,
        institutionName: 'University of Peshawar',
      },
    }),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(AuthService)
      .useValue(mockAuthService)
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .overrideProvider(RedisService)
      .useValue(mockRedisService)
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
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health - returns 200 OK with standard envelope', async () => {
    const res = await request(app.getHttpServer()).get('/health').expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ok');
    expect(res.body.meta.requestId).toBeDefined();
    expect(res.body.error).toBeNull();
  });

  it('GET /ready - returns 200 OK with system check status', async () => {
    const res = await request(app.getHttpServer()).get('/ready').expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.checks).toBeDefined();
    expect(res.body.meta.requestId).toBeDefined();
  });

  it('POST /api/v1/auth/register - rejects missing tenantType for student/family with standard 400 error envelope', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: 'invalid-tenant@example.com',
        phoneNumber: '03001234567',
        fullName: 'Test User',
        password: 'Weak',
        role: 'TENANT',
        // Missing tenantType and weak password!
      })
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.data).toBeNull();
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.requestId).toBeDefined();
  });

  it('POST /api/v1/auth/register - registers valid user and returns tokens with standard envelope', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: 'newstudent@peshawar.pk',
        phoneNumber: '03001234567',
        fullName: 'Ahmad Khan',
        password: 'ValidPassword2026!#',
        role: UserRole.TENANT,
        tenantType: TenantType.STUDENT,
        institutionName: 'University of Peshawar',
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('newstudent@peshawar.pk');
    expect(res.body.data.tokens.accessToken).toBeDefined();
  });

  it('GET /api/v1/auth/me - rejects unauthenticated access with 401 UNAUTHORIZED envelope', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/auth/me').expect(401);

    expect(res.body.success).toBe(false);
    expect(res.body.data).toBeNull();
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('GET /api/v1/auth/me - accepts valid access token and returns user profile with permissions', async () => {
    const tokens = await tokenService.generateTokens(
      '00000000-0000-0000-0000-000000000001',
      'tenant@peshawar.pk',
      ['TENANT'],
      'STUDENT',
    );

    const res = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${tokens.accessToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe('tenant@peshawar.pk');
    expect(res.body.data.permissions).toContain('inquiry:create');
    expect(res.body.meta.requestId).toBeDefined();
  });
});
