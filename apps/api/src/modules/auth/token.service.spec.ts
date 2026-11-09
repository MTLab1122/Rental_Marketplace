import { TokenService } from './token.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { TokenHashService } from '../../common/security/token-hash.service';
import { AuditService } from '../../common/audit/audit.service';
import { UnauthorizedException } from '@nestjs/common';

describe('TokenService', () => {
  let service: TokenService;
  let mockJwtService: Partial<JwtService>;
  let mockConfigService: Partial<ConfigService>;
  let mockPrismaService: any;
  let mockAuditService: Partial<AuditService>;
  let tokenHashService: TokenHashService;

  beforeEach(() => {
    mockJwtService = {
      sign: jest.fn().mockReturnValue('mock.jwt.access.token'),
      verify: jest
        .fn()
        .mockReturnValue({ sub: 'user-1', email: 'test@example.com', roles: ['TENANT'] }),
    };

    mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'JWT_ACCESS_SECRET') return 'test_secret_key_32_characters_minimum_123';
        if (key === 'JWT_ACCESS_EXPIRES_IN') return '15m';
        return null;
      }),
    };

    mockPrismaService = {
      refreshToken: {
        create: jest.fn().mockResolvedValue({ id: 'rt-1' }),
        findUnique: jest.fn(),
        update: jest.fn().mockResolvedValue({ id: 'rt-1' }),
        updateMany: jest.fn().mockResolvedValue({ count: 2 }),
      },
    };

    mockAuditService = {
      log: jest.fn().mockResolvedValue(undefined),
    };

    tokenHashService = new TokenHashService();

    service = new TokenService(
      mockJwtService as JwtService,
      mockConfigService as ConfigService,
      mockPrismaService as PrismaService,
      tokenHashService,
      mockAuditService as AuditService,
    );
  });

  it('should generate access and refresh tokens and persist hash', async () => {
    const tokens = await service.generateTokens('user-1', 'test@example.com', ['TENANT']);
    expect(tokens.accessToken).toBe('mock.jwt.access.token');
    expect(tokens.refreshToken).toBeDefined();
    expect(tokens.expiresIn).toBe(900);
    expect(mockPrismaService.refreshToken.create).toHaveBeenCalledTimes(1);
  });

  it('should rotate valid refresh token', async () => {
    const rawToken = 'valid.token.123';
    const futureDate = new Date(Date.now() + 86400000);

    mockPrismaService.refreshToken.findUnique.mockResolvedValue({
      id: 'rt-id-1',
      tokenHash: tokenHashService.hashToken(rawToken),
      familyId: 'family-1',
      isRevoked: false,
      expiresAt: futureDate,
      user: {
        id: 'user-1',
        email: 'tenant@example.com',
        isSuspended: false,
        deletedAt: null,
        roles: [{ role: { name: 'TENANT' } }],
        tenantProfile: { tenantType: 'STUDENT' },
      },
    });

    const result = await service.rotateRefreshToken(rawToken);
    expect(result.userId).toBe('user-1');
    expect(result.tokens.accessToken).toBe('mock.jwt.access.token');
    expect(mockPrismaService.refreshToken.update).toHaveBeenCalledWith({
      where: { id: 'rt-id-1' },
      data: { isRevoked: true },
    });
  });

  it('should detect refresh token reuse and revoke the entire token family', async () => {
    const compromisedToken = 'stolen.token.already.used';

    mockPrismaService.refreshToken.findUnique.mockResolvedValue({
      id: 'rt-stolen-id',
      familyId: 'family-breached-123',
      isRevoked: true, // Already revoked/used!
      expiresAt: new Date(Date.now() + 86400000),
      user: {
        id: 'user-victim',
        email: 'victim@example.com',
        isSuspended: false,
        roles: [],
      },
    });

    await expect(service.rotateRefreshToken(compromisedToken)).rejects.toThrow(
      UnauthorizedException,
    );

    // Verifies entire family revocation
    expect(mockPrismaService.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { familyId: 'family-breached-123' },
      data: { isRevoked: true },
    });

    // Verifies security audit log was written
    expect(mockAuditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'TOKEN_FAMILY_REVOKED_REUSE_DETECTED',
        targetId: 'family-breached-123',
      }),
    );
  });
});
