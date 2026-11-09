import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RateLimiterService } from '../../common/guards/rate-limiter.service';
import { TokenService } from './token.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { OwnershipGuard } from '../../common/guards/ownership.guard';
import { UnauthorizedException, HttpException, HttpStatus } from '@nestjs/common';
import { UserRole, TenantType } from '@rental-peshawar/shared-types';

describe('Auth & Security Integration Tests', () => {
  let controller: AuthController;
  let mockAuthService: any;
  let mockRateLimiter: any;
  let mockTokenService: any;

  beforeEach(async () => {
    mockAuthService = {
      register: jest.fn(),
      login: jest.fn(),
      refresh: jest.fn(),
      logout: jest.fn().mockResolvedValue(undefined),
      forgotPassword: jest.fn(),
      resetPassword: jest.fn(),
      getMe: jest.fn(),
      updateMe: jest.fn(),
    };

    mockRateLimiter = {
      enforceRateLimit: jest.fn().mockResolvedValue({ allowed: true }),
    };

    mockTokenService = {
      verifyAccessToken: jest.fn(),
      rotateRefreshToken: jest.fn(),
      revokeRefreshToken: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: RateLimiterService, useValue: mockRateLimiter },
        { provide: TokenService, useValue: mockTokenService },
        JwtAuthGuard,
        RolesGuard,
        OwnershipGuard,
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  describe('Registration & Login API Integration', () => {
    it('should invoke rate limiter and auth service on registration', async () => {
      const mockReq = { ip: '127.0.0.1', headers: {} } as any;
      const mockRes = { cookie: jest.fn() } as any;

      mockAuthService.register.mockResolvedValue({
        user: { id: 'u-1', email: 'test@example.com' },
        tokens: { accessToken: 'at-1', refreshToken: 'rt-1', expiresIn: 900 },
      });

      const result = await controller.register(
        {
          email: 'test@example.com',
          password: 'Pass2026!#',
          fullName: 'Test User',
          phoneNumber: '03001234567',
          role: UserRole.TENANT,
          tenantType: TenantType.STUDENT,
        },
        mockReq,
        mockRes,
      );

      expect(mockRateLimiter.enforceRateLimit).toHaveBeenCalledWith(
        'register:ip',
        '127.0.0.1',
        3,
        3600,
        expect.any(String),
      );
      expect(mockRes.cookie).toHaveBeenCalledWith('accessToken', 'at-1', expect.any(Object));
      expect(mockRes.cookie).toHaveBeenCalledWith('refreshToken', 'rt-1', expect.any(Object));
      expect(result.tokens.accessToken).toBe('at-1');
    });

    it('should invoke rate limiter and set cookies on login', async () => {
      const mockReq = { ip: '127.0.0.1', headers: {} } as any;
      const mockRes = { cookie: jest.fn() } as any;

      mockAuthService.login.mockResolvedValue({
        user: { id: 'u-1', email: 'test@example.com' },
        tokens: { accessToken: 'at-2', refreshToken: 'rt-2', expiresIn: 900 },
      });

      const result = await controller.login(
        {
          emailOrPhone: 'test@example.com',
          password: 'Pass2026!#',
        },
        mockReq,
        mockRes,
      );

      expect(mockRateLimiter.enforceRateLimit).toHaveBeenCalled();
      expect(mockRes.cookie).toHaveBeenCalledWith('accessToken', 'at-2', expect.any(Object));
      expect(result.tokens.accessToken).toBe('at-2');
    });
  });

  describe('Security: Token Reuse Detection & Revocation', () => {
    it('should throw UnauthorizedException when refresh token reuse is detected', async () => {
      const mockReq = { ip: '127.0.0.1', headers: {}, cookies: {} } as any;
      const mockRes = { cookie: jest.fn() } as any;

      mockAuthService.refresh.mockRejectedValue(
        new UnauthorizedException(
          'Refresh token reuse detected. All sessions in this chain have been invalidated for security.',
        ),
      );

      await expect(
        controller.refresh({ refreshToken: 'stolen-used-token' }, mockReq, mockRes),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('Security: Rate-Limiting Protection', () => {
    it('should reject requests when rate limiter throws 429 TOO_MANY_REQUESTS', async () => {
      const mockReq = { ip: '192.168.1.1', headers: {} } as any;
      const mockRes = { cookie: jest.fn() } as any;

      mockRateLimiter.enforceRateLimit.mockRejectedValue(
        new HttpException('Registration rate limit exceeded.', HttpStatus.TOO_MANY_REQUESTS),
      );

      await expect(
        controller.register(
          {
            email: 'spammer@example.com',
            password: 'Pass2026!#',
            fullName: 'Spammer',
            phoneNumber: '03009999999',
            role: UserRole.TENANT,
            tenantType: TenantType.STUDENT,
          },
          mockReq,
          mockRes,
        ),
      ).rejects.toThrow(HttpException);
    });
  });

  describe('Security: Logout & Cookie Clearing', () => {
    it('should revoke token and clear cookies on logout', async () => {
      const mockReq = {
        ip: '127.0.0.1',
        headers: {},
        cookies: { refreshToken: 'active-refresh-token' },
        user: { sub: 'u-1' },
      } as any;
      const mockRes = { clearCookie: jest.fn() } as any;

      const result = await controller.logout({}, mockReq, mockRes);

      expect(mockAuthService.logout).toHaveBeenCalledWith(
        'active-refresh-token',
        'u-1',
        '127.0.0.1',
        undefined,
      );
      expect(mockRes.clearCookie).toHaveBeenCalledWith('accessToken', { path: '/' });
      expect(mockRes.clearCookie).toHaveBeenCalledWith('refreshToken', { path: '/api/v1/auth' });
      expect(result.message).toBe('Logged out successfully.');
    });
  });
});
