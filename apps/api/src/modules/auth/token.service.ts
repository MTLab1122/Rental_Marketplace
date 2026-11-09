import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../../database/prisma.service';
import { TokenHashService } from '../../common/security/token-hash.service';
import { AuditService } from '../../common/audit/audit.service';
import { AuthTokens } from '@rental-peshawar/shared-types';

export interface JwtPayload {
  sub: string;
  email: string;
  roles: string[];
  tenantType?: string | null;
  jti: string;
}

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly tokenHashService: TokenHashService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Generates a short-lived Access Token (15m) and a rotating Refresh Token (30d).
   */
  async generateTokens(
    userId: string,
    email: string,
    roles: string[],
    tenantType?: string | null,
    existingFamilyId?: string,
    deviceId?: string,
    userAgent?: string,
  ): Promise<AuthTokens> {
    const jti = uuidv4();
    const familyId = existingFamilyId || uuidv4();

    const payload: JwtPayload = {
      sub: userId,
      email,
      roles,
      tenantType,
      jti,
    };

    const accessExpiresIn = this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') || '15m';

    const accessToken = this.jwtService.sign(payload, {
      secret:
        this.configService.get<string>('JWT_ACCESS_SECRET') ||
        'dev_jwt_access_secret_min_32_characters_long_12345',
      expiresIn: accessExpiresIn as any,
    });

    // Generate random raw refresh token string
    const rawRefreshToken = `${uuidv4()}.${uuidv4()}`;
    const tokenHash = this.tokenHashService.hashToken(rawRefreshToken);

    const refreshExpiryDays = 30;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + refreshExpiryDays);

    // Save hashed refresh token to database
    try {
      await this.prisma.refreshToken.create({
        data: {
          userId,
          tokenHash,
          familyId,
          deviceId: deviceId || undefined,
          userAgent: userAgent || undefined,
          expiresAt,
          isRevoked: false,
        },
      });
    } catch (err) {
      this.logger.warn(`Could not persist refresh token: ${(err as Error).message}`);
    }

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      expiresIn: 15 * 60, // 15 minutes in seconds
    };
  }

  /**
   * Rotates a refresh token:
   * - Validates token existence and status.
   * - If already revoked: DETECTS REUSE, revokes entire family, throws Unauthorized.
   * - If expired: throws Unauthorized.
   * - Otherwise: marks current token revoked and issues a new pair under the same family.
   */
  async rotateRefreshToken(
    rawRefreshToken: string,
    deviceId?: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<{ tokens: AuthTokens; userId: string }> {
    const tokenHash = this.tokenHashService.hashToken(rawRefreshToken);

    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          include: {
            roles: { include: { role: true } },
            tenantProfile: true,
          },
        },
      },
    });

    if (!storedToken) {
      throw new UnauthorizedException('Invalid or unrecognized refresh token.');
    }

    const { user, familyId, isRevoked, expiresAt } = storedToken;

    // REUSE DETECTION: If an already-revoked token is presented, compromise is suspected!
    if (isRevoked) {
      this.logger.warn(
        `🚨 Refresh token reuse detected for user ${user.id}! Revoking entire token family ${familyId}.`,
      );

      // Invalidate the entire family chain immediately
      await this.prisma.refreshToken.updateMany({
        where: { familyId },
        data: { isRevoked: true },
      });

      await this.auditService.log({
        actorId: user.id,
        action: 'TOKEN_FAMILY_REVOKED_REUSE_DETECTED',
        targetType: 'REFRESH_TOKEN_FAMILY',
        targetId: familyId,
        ipAddress,
        userAgent,
      });

      throw new UnauthorizedException(
        'Refresh token reuse detected. All sessions in this chain have been invalidated for security.',
      );
    }

    // Expiration check
    if (new Date() > expiresAt) {
      await this.prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { isRevoked: true },
      });
      throw new UnauthorizedException('Refresh token has expired. Please log in again.');
    }

    // Check if user is suspended
    if (user.isSuspended || user.deletedAt) {
      throw new UnauthorizedException('Account is suspended or deactivated.');
    }

    // Invalidate the consumed refresh token
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { isRevoked: true },
    });

    const roles = user.roles.map((r) => r.role.name);
    const tenantType = user.tenantProfile?.tenantType || null;

    // Issue new tokens maintaining the same familyId
    const newTokens = await this.generateTokens(
      user.id,
      user.email,
      roles,
      tenantType,
      familyId,
      deviceId,
      userAgent,
    );

    return {
      tokens: newTokens,
      userId: user.id,
    };
  }

  /**
   * Revokes a specific refresh token (used during explicit logout).
   */
  async revokeRefreshToken(rawRefreshToken: string): Promise<void> {
    const tokenHash = this.tokenHashService.hashToken(rawRefreshToken);
    await this.prisma.refreshToken
      .update({
        where: { tokenHash },
        data: { isRevoked: true },
      })
      .catch(() => {});
  }

  /**
   * Revokes all tokens for a user (used during password reset / account compromise).
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId },
      data: { isRevoked: true },
    });
  }

  /**
   * Verifies an access token and returns the decoded payload.
   */
  verifyAccessToken(token: string): JwtPayload {
    try {
      return this.jwtService.verify<JwtPayload>(token, {
        secret:
          this.configService.get<string>('JWT_ACCESS_SECRET') ||
          'dev_jwt_access_secret_min_32_characters_long_12345',
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired access token.');
    }
  }
}
