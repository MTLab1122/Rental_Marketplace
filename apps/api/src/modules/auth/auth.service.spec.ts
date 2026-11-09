import { AuthService } from './auth.service';
import { PasswordService } from '../../common/security/password.service';
import { TokenService } from './token.service';
import { AuditService } from '../../common/audit/audit.service';
import { PrismaService } from '../../database/prisma.service';
import { BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { UserRole, TenantType } from '@rental-peshawar/shared-types';

describe('AuthService', () => {
  let authService: AuthService;
  let mockPrisma: any;
  let mockPasswordService: any;
  let mockTokenService: any;
  let mockAuditService: any;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      role: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      userRole: {
        create: jest.fn(),
      },
      tenantProfile: {
        create: jest.fn(),
      },
      landlordProfile: {
        create: jest.fn(),
      },
      $transaction: jest.fn(async (cb) => cb(mockPrisma)),
    };

    mockPasswordService = {
      validatePasswordStrength: jest.fn(),
      hashPassword: jest.fn().mockResolvedValue('hashed_password_123'),
      comparePassword: jest.fn(),
    };

    mockTokenService = {
      generateTokens: jest.fn().mockResolvedValue({
        accessToken: 'mock_access_token',
        refreshToken: 'mock_refresh_token',
        expiresIn: 900,
      }),
      rotateRefreshToken: jest.fn(),
      revokeRefreshToken: jest.fn().mockResolvedValue(undefined),
      revokeAllUserTokens: jest.fn().mockResolvedValue(undefined),
    };

    mockAuditService = {
      log: jest.fn().mockResolvedValue(undefined),
    };

    authService = new AuthService(
      mockPrisma as PrismaService,
      mockPasswordService as PasswordService,
      mockTokenService as TokenService,
      mockAuditService as AuditService,
    );
  });

  it('should require tenantType when registering a tenant', async () => {
    await expect(
      authService.register({
        email: 'tenant@example.com',
        phoneNumber: '03001234567',
        password: 'ValidPass2026!#',
        fullName: 'Test User',
        role: UserRole.TENANT,
        // Missing tenantType!
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should register student tenant successfully with profile and role', async () => {
    mockPrisma.user.findFirst.mockResolvedValue(null);
    mockPrisma.role.findUnique.mockResolvedValue({ id: 'role-tenant-id' });
    mockPrisma.user.create.mockResolvedValue({
      id: 'new-user-1',
      email: 'student@example.com',
      phoneNumber: '+923001234567',
      fullName: 'Ahmad Khan',
      isVerified: false,
      isSuspended: false,
      createdAt: new Date(),
    });

    const result = await authService.register({
      email: 'student@example.com',
      phoneNumber: '03001234567',
      password: 'StrongPass2026!#',
      fullName: 'Ahmad Khan',
      role: UserRole.TENANT,
      tenantType: TenantType.STUDENT,
      institutionName: 'University of Peshawar',
    });

    expect(result.user.email).toBe('student@example.com');
    expect(result.tokens.accessToken).toBe('mock_access_token');
    expect(mockPrisma.tenantProfile.create).toHaveBeenCalledTimes(1);
    expect(mockAuditService.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'USER_REGISTERED' }),
    );
  });

  it('should reject registration if email is duplicate', async () => {
    mockPrisma.user.findFirst.mockResolvedValue({
      id: 'existing-id',
      email: 'student@example.com',
      phoneNumber: '+923009999999',
    });

    await expect(
      authService.register({
        email: 'student@example.com',
        phoneNumber: '03001234567',
        password: 'StrongPass2026!#',
        fullName: 'Another User',
        role: UserRole.TENANT,
        tenantType: TenantType.FAMILY,
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('should log in successfully with valid credentials and reset failed attempts', async () => {
    mockPrisma.user.findFirst.mockResolvedValue({
      id: 'user-123',
      email: 'tenant@example.com',
      phoneNumber: '+923001234567',
      passwordHash: 'hashed_password_123',
      fullName: 'Ahmad Khan',
      isVerified: true,
      isSuspended: false,
      failedLoginAttempts: 2,
      createdAt: new Date(),
      roles: [{ role: { name: 'TENANT' } }],
      tenantProfile: { tenantType: 'STUDENT' },
    });
    mockPasswordService.comparePassword.mockResolvedValue(true);

    const result = await authService.login({
      emailOrPhone: 'tenant@example.com',
      password: 'StrongPass2026!#',
    });

    expect(result.user.id).toBe('user-123');
    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ failedLoginAttempts: 0 }),
      }),
    );
  });

  it('should lock account after 5 failed login attempts', async () => {
    mockPrisma.user.findFirst.mockResolvedValue({
      id: 'user-123',
      email: 'tenant@example.com',
      phoneNumber: '+923001234567',
      passwordHash: 'hashed_password_123',
      failedLoginAttempts: 4, // 5th attempt will lock!
      isSuspended: false,
      roles: [],
    });
    mockPasswordService.comparePassword.mockResolvedValue(false);

    await expect(
      authService.login({
        emailOrPhone: 'tenant@example.com',
        password: 'WrongPassword!',
      }),
    ).rejects.toThrow(UnauthorizedException);

    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          lockedUntil: expect.any(Date),
        }),
      }),
    );
  });
});
