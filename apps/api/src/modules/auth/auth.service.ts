import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { PasswordService } from '../../common/security/password.service';
import { TokenService } from './token.service';
import { AuditService } from '../../common/audit/audit.service';
import {
  normalizeEmail,
  normalizePakistaniPhoneNumber,
  sanitizeInput,
  isDisposableEmail,
} from '../../common/security/sanitization';
import {
  RegisterDto,
  LoginDto,
  ResetPasswordDto,
  UpdateProfileDto,
  AuthResponseData,
  UserProfileDto,
  UserSummaryDto,
  UserRole,
  TenantType,
} from '@rental-peshawar/shared-types';
import { UserRoleName } from '@prisma/client';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Registers a new user with strict tenant classification and profile mapping.
   */
  async register(
    dto: RegisterDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthResponseData> {
    const email = normalizeEmail(dto.email);
    const phoneNumber = normalizePakistaniPhoneNumber(dto.phoneNumber);
    const fullName = sanitizeInput(dto.fullName);

    // Reject disposable / temporary email domains
    if (isDisposableEmail(email)) {
      throw new BadRequestException(
        'Registration with disposable or temporary email addresses is prohibited.',
      );
    }

    // Validate password strength
    this.passwordService.validatePasswordStrength(dto.password);

    // Strict non-negotiable rule: Tenants must specify eligibility type
    if (dto.role === UserRole.TENANT && !dto.tenantType) {
      throw new BadRequestException(
        'Tenant registration requires tenantType: either STUDENT or FAMILY.',
      );
    }

    // Check uniqueness of email and phone number
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, { phoneNumber }],
      },
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw new ConflictException('An account with this email address already exists.');
      }
      throw new ConflictException('An account with this phone number already exists.');
    }

    const passwordHash = await this.passwordService.hashPassword(dto.password);

    // Map role enum to database role name
    const roleName = dto.role as unknown as UserRoleName;

    // Transaction to create user, profile, and role mapping atomically
    const user = await this.prisma.$transaction(async (tx) => {
      // Find role
      let role = await tx.role.findUnique({
        where: { name: roleName },
      });

      if (!role) {
        role = await tx.role.create({
          data: {
            name: roleName,
            description: `${dto.role} system role`,
          },
        });
      }

      // Create user
      const createdUser = await tx.user.create({
        data: {
          email,
          phoneNumber,
          passwordHash,
          fullName,
          isVerified: false,
        },
      });

      // Link role
      await tx.userRole.create({
        data: {
          userId: createdUser.id,
          roleId: role.id,
        },
      });

      // Create profile based on role
      if (dto.role === UserRole.TENANT && dto.tenantType) {
        await tx.tenantProfile.create({
          data: {
            userId: createdUser.id,
            tenantType: dto.tenantType as any,
            institutionName:
              dto.tenantType === TenantType.STUDENT
                ? sanitizeInput(dto.institutionName || '')
                : undefined,
          },
        });
      } else if (dto.role === UserRole.LANDLORD) {
        await tx.landlordProfile.create({
          data: {
            userId: createdUser.id,
            businessName: dto.businessName ? sanitizeInput(dto.businessName) : undefined,
          },
        });
      }

      return createdUser;
    });

    await this.auditService.log({
      actorId: user.id,
      action: 'USER_REGISTERED',
      targetType: 'USER',
      targetId: user.id,
      after: { email: user.email, role: dto.role, tenantType: dto.tenantType },
      ipAddress,
      userAgent,
    });

    // Issue JWT tokens
    const tokens = await this.tokenService.generateTokens(
      user.id,
      user.email,
      [dto.role],
      dto.tenantType || null,
      undefined,
      undefined,
      userAgent,
    );

    const userSummary: UserSummaryDto = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phoneNumber: user.phoneNumber,
      roles: [dto.role],
      tenantType: dto.tenantType || null,
      isVerified: user.isVerified,
      isSuspended: user.isSuspended,
      createdAt: user.createdAt.toISOString(),
    };

    return {
      user: userSummary,
      tokens,
    };
  }

  /**
   * Logs in a user with account lockout and rate limiting protection.
   */
  async login(dto: LoginDto, ipAddress?: string, userAgent?: string): Promise<AuthResponseData> {
    const rawIdentifier = dto.emailOrPhone.trim();
    let email: string | undefined;
    let phoneNumber: string | undefined;

    if (rawIdentifier.includes('@')) {
      email = normalizeEmail(rawIdentifier);
    } else {
      try {
        phoneNumber = normalizePakistaniPhoneNumber(rawIdentifier);
      } catch {
        // Fallback for non-standard test identifier
        phoneNumber = rawIdentifier;
      }
    }

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [...(email ? [{ email }] : []), ...(phoneNumber ? [{ phoneNumber }] : [])],
        deletedAt: null,
      },
      include: {
        roles: { include: { role: true } },
        tenantProfile: true,
      },
    });

    if (!user) {
      await this.auditService.log({
        action: 'LOGIN_FAILED',
        targetType: 'AUTH',
        targetId: rawIdentifier,
        after: { reason: 'USER_NOT_FOUND' },
        ipAddress,
        userAgent,
      });
      throw new UnauthorizedException('Invalid email/phone or password.');
    }

    // Check account lockout
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const waitSeconds = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 1000);
      throw new UnauthorizedException(
        `Account is temporarily locked due to repeated failed logins. Please try again in ${waitSeconds} seconds.`,
      );
    }

    // Check if account is suspended
    if (user.isSuspended) {
      throw new ForbiddenException(
        `Account is suspended: ${user.suspendedReason || 'Contact support for assistance.'}`,
      );
    }

    // Compare password
    const isPasswordValid = await this.passwordService.comparePassword(
      dto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      const failedAttempts = user.failedLoginAttempts + 1;
      let lockedUntil: Date | null = null;

      if (failedAttempts >= 5) {
        // Lock account for 15 minutes
        lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
        this.logger.warn(`User ${user.id} locked out for 15 minutes after 5 failed attempts.`);
      }

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: failedAttempts >= 5 ? 0 : failedAttempts,
          lockedUntil,
        },
      });

      await this.auditService.log({
        actorId: user.id,
        action: 'LOGIN_FAILED',
        targetType: 'USER',
        targetId: user.id,
        after: { failedAttempts, isLocked: !!lockedUntil },
        ipAddress,
        userAgent,
      });

      throw new UnauthorizedException('Invalid email/phone or password.');
    }

    // Successful login: reset failed login counters
    if (user.failedLoginAttempts > 0 || user.lockedUntil) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      });
    }

    const roles = user.roles.map((r) => r.role.name as unknown as UserRole);
    const tenantType = (user.tenantProfile?.tenantType as unknown as TenantType) || null;

    // Issue tokens
    const tokens = await this.tokenService.generateTokens(
      user.id,
      user.email,
      roles,
      tenantType,
      undefined,
      dto.deviceId,
      userAgent,
    );

    await this.auditService.log({
      actorId: user.id,
      action: 'LOGIN_SUCCESS',
      targetType: 'USER',
      targetId: user.id,
      ipAddress,
      userAgent,
    });

    const userSummary: UserSummaryDto = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phoneNumber: user.phoneNumber,
      roles,
      tenantType,
      isVerified: user.isVerified,
      isSuspended: user.isSuspended,
      createdAt: user.createdAt.toISOString(),
    };

    return {
      user: userSummary,
      tokens,
    };
  }

  /**
   * Refreshes access token with rotating refresh token and reuse detection.
   */
  async refresh(
    refreshToken: string,
    deviceId?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthResponseData> {
    if (!refreshToken || typeof refreshToken !== 'string') {
      throw new UnauthorizedException('Refresh token is required.');
    }

    const { tokens, userId } = await this.tokenService.rotateRefreshToken(
      refreshToken,
      deviceId,
      userAgent,
      ipAddress,
    );

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: { include: { role: true } },
        tenantProfile: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User account no longer exists.');
    }

    const roles = user.roles.map((r) => r.role.name as unknown as UserRole);
    const tenantType = (user.tenantProfile?.tenantType as unknown as TenantType) || null;

    const userSummary: UserSummaryDto = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phoneNumber: user.phoneNumber,
      roles,
      tenantType,
      isVerified: user.isVerified,
      isSuspended: user.isSuspended,
      createdAt: user.createdAt.toISOString(),
    };

    return {
      user: userSummary,
      tokens,
    };
  }

  /**
   * Logs out a session by revoking the refresh token.
   */
  async logout(
    refreshToken?: string,
    userId?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    if (refreshToken) {
      await this.tokenService.revokeRefreshToken(refreshToken);
    }
    if (userId) {
      await this.auditService.log({
        actorId: userId,
        action: 'LOGOUT',
        targetType: 'USER',
        targetId: userId,
        ipAddress,
        userAgent,
      });
    }
  }

  /**
   * Initiates password reset by issuing a 1-hour cryptographic token.
   */
  async forgotPassword(
    email: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ message: string; token?: string }> {
    const normalizedEmail = normalizeEmail(email);
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail, deletedAt: null },
    });

    if (!user) {
      // Return ambiguous message to prevent email enumeration
      return {
        message:
          'If an account is associated with this email address, a password reset link has been dispatched.',
      };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires,
      },
    });

    await this.auditService.log({
      actorId: user.id,
      action: 'PASSWORD_RESET_REQUESTED',
      targetType: 'USER',
      targetId: user.id,
      ipAddress,
      userAgent,
    });

    return {
      message:
        'If an account is associated with this email address, a password reset link has been dispatched.',
      token: process.env['NODE_ENV'] !== 'production' ? resetToken : undefined,
    };
  }

  /**
   * Resets password using the valid reset token, updating hash and revoking tokens.
   */
  async resetPassword(
    dto: ResetPasswordDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ message: string }> {
    this.passwordService.validatePasswordStrength(dto.newPassword);

    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetToken: dto.token,
        passwordResetExpires: { gt: new Date() },
        deletedAt: null,
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired password reset token.');
    }

    const passwordHash = await this.passwordService.hashPassword(dto.newPassword);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    // Invalidate all active refresh tokens for the compromised/updated account
    await this.tokenService.revokeAllUserTokens(user.id);

    await this.auditService.log({
      actorId: user.id,
      action: 'PASSWORD_RESET_SUCCESS',
      targetType: 'USER',
      targetId: user.id,
      ipAddress,
      userAgent,
    });

    return {
      message: 'Password has been successfully updated. Please log in with your new password.',
    };
  }

  /**
   * Retrieves full profile of the authenticated user including permissions.
   */
  async getMe(userId: string): Promise<UserProfileDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
        tenantProfile: true,
        landlordProfile: true,
        adminProfile: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User profile not found.');
    }

    const roles = user.roles.map((r) => r.role.name as unknown as UserRole);
    const tenantType = (user.tenantProfile?.tenantType as unknown as TenantType) || null;

    // Collect distinct permissions
    const permissionsSet = new Set<string>();
    for (const ur of user.roles) {
      for (const rp of ur.role.permissions) {
        permissionsSet.add(rp.permission.code);
      }
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phoneNumber: user.phoneNumber,
      roles,
      tenantType,
      isVerified: user.isVerified,
      isSuspended: user.isSuspended,
      createdAt: user.createdAt.toISOString(),
      permissions: Array.from(permissionsSet),
      tenantProfile: user.tenantProfile
        ? {
            id: user.tenantProfile.id,
            tenantType: user.tenantProfile.tenantType as unknown as TenantType,
            institutionName: user.tenantProfile.institutionName,
            studentIdCardUrl: user.tenantProfile.studentIdCardUrl,
            familyMembersCount: user.tenantProfile.familyMembersCount,
          }
        : null,
      landlordProfile: user.landlordProfile
        ? {
            id: user.landlordProfile.id,
            cnicNumber: user.landlordProfile.cnicNumber,
            isCnicVerified: user.landlordProfile.isCnicVerified,
            businessName: user.landlordProfile.businessName,
            officeAddress: user.landlordProfile.officeAddress,
          }
        : null,
      adminProfile: user.adminProfile
        ? {
            id: user.adminProfile.id,
            department: user.adminProfile.department,
            designation: user.adminProfile.designation,
          }
        : null,
    };
  }

  /**
   * Updates authenticated user's profile information.
   */
  async updateMe(
    userId: string,
    dto: UpdateProfileDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<UserProfileDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
      include: { tenantProfile: true, landlordProfile: true },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const updatedUser = await this.prisma.$transaction(async (tx) => {
      // Update basic fields
      const updated = await tx.user.update({
        where: { id: userId },
        data: {
          fullName: dto.fullName ? sanitizeInput(dto.fullName) : undefined,
          phoneNumber: dto.phoneNumber ? normalizePakistaniPhoneNumber(dto.phoneNumber) : undefined,
        },
      });

      // Update tenant profile if applicable
      if (
        user.tenantProfile &&
        (dto.institutionName !== undefined || dto.familyMembersCount !== undefined)
      ) {
        await tx.tenantProfile.update({
          where: { userId },
          data: {
            institutionName:
              dto.institutionName !== undefined ? sanitizeInput(dto.institutionName) : undefined,
            familyMembersCount: dto.familyMembersCount,
          },
        });
      }

      // Update landlord profile if applicable
      if (
        user.landlordProfile &&
        (dto.businessName !== undefined || dto.officeAddress !== undefined)
      ) {
        await tx.landlordProfile.update({
          where: { userId },
          data: {
            businessName:
              dto.businessName !== undefined ? sanitizeInput(dto.businessName) : undefined,
            officeAddress:
              dto.officeAddress !== undefined ? sanitizeInput(dto.officeAddress) : undefined,
          },
        });
      }

      return updated;
    });

    await this.auditService.log({
      actorId: userId,
      action: 'PROFILE_UPDATED',
      targetType: 'USER',
      targetId: userId,
      after: { fullName: updatedUser.fullName, phoneNumber: updatedUser.phoneNumber },
      ipAddress,
      userAgent,
    });

    return this.getMe(userId);
  }
}
