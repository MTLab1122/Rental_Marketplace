import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Res,
  UnauthorizedException,
  ForbiddenException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { PrismaService } from '../../../database/prisma.service';
import { PasswordService } from '../../../common/security/password.service';
import { TokenService } from '../../auth/token.service';
import { AuditService } from '../../../common/audit/audit.service';
import { MfaService } from '../services/mfa.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { AdminLoginDto, AdminMfaVerifyDto } from '../dto/admin.dto';
import { UserRole } from '@rental-peshawar/shared-types';

const ADMIN_ROLES = [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MODERATOR, UserRole.SUPPORT];

@Controller('admin/auth')
export class AdminAuthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
    private readonly auditService: AuditService,
    private readonly mfaService: MfaService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async adminLogin(
    @Body() dto: AdminLoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = (req.headers['user-agent'] as string) || 'unknown';
    const identifier = dto.emailOrPhone.trim().toLowerCase();

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { phoneNumber: identifier }],
        deletedAt: null,
      },
      include: {
        roles: { include: { role: true } },
      },
    });

    if (!user) {
      await this.auditService.log({
        action: 'ADMIN_LOGIN_FAILED',
        targetType: 'ADMIN_AUTH',
        targetId: identifier,
        after: { reason: 'USER_NOT_FOUND' },
        ipAddress: ip,
        userAgent,
      });
      throw new UnauthorizedException('Invalid administrative credentials.');
    }

    if (user.isSuspended) {
      throw new ForbiddenException('Account is suspended. Contact system administrator.');
    }

    const userRoles = user.roles.map((r) => r.role.name as unknown as UserRole);
    const hasAdminRole = userRoles.some((r) => ADMIN_ROLES.includes(r));
    if (!hasAdminRole) {
      await this.auditService.log({
        actorId: user.id,
        action: 'ADMIN_LOGIN_DENIED_NO_ROLE',
        targetType: 'ADMIN_AUTH',
        targetId: user.id,
        ipAddress: ip,
        userAgent,
      });
      throw new ForbiddenException('User is not authorized for administrative access.');
    }

    const isPasswordValid = await this.passwordService.comparePassword(
      dto.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      await this.auditService.log({
        actorId: user.id,
        action: 'ADMIN_LOGIN_FAILED',
        targetType: 'ADMIN_AUTH',
        targetId: user.id,
        after: { reason: 'INVALID_PASSWORD' },
        ipAddress: ip,
        userAgent,
      });
      throw new UnauthorizedException('Invalid administrative credentials.');
    }

    // MFA Verification for ADMIN / SUPER_ADMIN if enabled
    if (user.isMfaEnabled && user.mfaSecret) {
      if (!dto.totpToken) {
        return {
          requiresMfa: true,
          message: 'MFA TOTP code required to complete login.',
        };
      }

      const isValidToken = this.mfaService.verifyToken(user.mfaSecret, dto.totpToken);
      if (!isValidToken) {
        await this.auditService.log({
          actorId: user.id,
          action: 'ADMIN_MFA_FAILED',
          targetType: 'ADMIN_AUTH',
          targetId: user.id,
          ipAddress: ip,
          userAgent,
        });
        throw new UnauthorizedException('Invalid or expired 6-digit MFA code.');
      }
    }

    // Issue tokens
    const tokens = await this.tokenService.generateTokens(
      user.id,
      user.email,
      userRoles,
      null,
      undefined,
      'admin-console',
      userAgent,
    );

    // Set secure cookie
    res.cookie('adminAccessToken', tokens.accessToken, {
      httpOnly: true,
      secure: process.env['NODE_ENV'] === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
      path: '/',
    });

    await this.auditService.log({
      actorId: user.id,
      action: 'ADMIN_LOGIN_SUCCESS',
      targetType: 'ADMIN_AUTH',
      targetId: user.id,
      ipAddress: ip,
      userAgent,
    });

    return {
      tokens,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        roles: userRoles,
        isMfaEnabled: user.isMfaEnabled,
      },
    };
  }

  @Post('mfa/setup')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async setupMfa(@CurrentUser() authUser: { sub: string; email: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: authUser.sub },
    });
    if (!user) throw new UnauthorizedException();

    const secret = this.mfaService.generateSecret();
    const otpauthUrl = this.mfaService.generateOtpAuthUri(user.email, secret);

    // Save candidate secret
    await this.prisma.user.update({
      where: { id: user.id },
      data: { mfaSecret: secret },
    });

    return {
      secret,
      otpauthUrl,
      instructions:
        'Scan the QR code or enter the secret in Google Authenticator or Microsoft Authenticator, then verify with a 6-digit token.',
    };
  }

  @Post('mfa/verify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async verifyAndEnableMfa(
    @CurrentUser() authUser: { sub: string },
    @Body() dto: AdminMfaVerifyDto,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: authUser.sub },
    });
    if (!user || !user.mfaSecret) {
      throw new UnauthorizedException('No pending MFA setup found.');
    }

    const isValid = this.mfaService.verifyToken(user.mfaSecret, dto.token);
    if (!isValid) {
      throw new UnauthorizedException('Invalid 6-digit verification code.');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { isMfaEnabled: true },
    });

    await this.auditService.log({
      actorId: user.id,
      action: 'ADMIN_MFA_ENABLED',
      targetType: 'USER',
      targetId: user.id,
    });

    return {
      message: 'MFA successfully verified and enabled on your admin account.',
      isMfaEnabled: true,
    };
  }

  @Post('mfa/disable')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async disableMfa(@CurrentUser() authUser: { sub: string }, @Body() dto: AdminMfaVerifyDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: authUser.sub },
    });
    if (!user || !user.isMfaEnabled || !user.mfaSecret) {
      throw new UnauthorizedException('MFA is not enabled.');
    }

    const isValid = this.mfaService.verifyToken(user.mfaSecret, dto.token);
    if (!isValid) {
      throw new UnauthorizedException('Invalid 6-digit verification code.');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { isMfaEnabled: false, mfaSecret: null },
    });

    await this.auditService.log({
      actorId: user.id,
      action: 'ADMIN_MFA_DISABLED',
      targetType: 'USER',
      targetId: user.id,
    });

    return {
      message: 'MFA disabled.',
      isMfaEnabled: false,
    };
  }
}
