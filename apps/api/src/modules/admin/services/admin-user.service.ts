import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { AuditService } from '../../../common/audit/audit.service';
import { AdminUserQueryDto } from '../dto/admin.dto';
import { UserRoleName } from '@prisma/client';
import { UserRole as SharedUserRole } from '@rental-peshawar/shared-types';

@Injectable()
export class AdminUserService {
  private readonly logger = new Logger(AdminUserService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findUsers(query: AdminUserQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
    };

    if (query.search) {
      const s = query.search.trim();
      where.OR = [
        { fullName: { contains: s, mode: 'insensitive' } },
        { email: { contains: s, mode: 'insensitive' } },
        { phoneNumber: { contains: s } },
      ];
    }

    if (query.role) {
      where.roles = {
        some: {
          role: {
            name: query.role as unknown as UserRoleName,
          },
        },
      };
    }

    if (query.isVerified !== undefined) {
      where.isVerified = query.isVerified;
    }

    if (query.isSuspended !== undefined) {
      where.isSuspended = query.isSuspended;
    }

    const orderBy: any = {};
    const sortField = query.sortBy || 'createdAt';
    const sortDir = query.sortOrder || 'desc';
    orderBy[sortField] = sortDir;

    const [total, items] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          email: true,
          phoneNumber: true,
          fullName: true,
          isVerified: true,
          isSuspended: true,
          suspendedReason: true,
          failedLoginAttempts: true,
          isMfaEnabled: true,
          createdAt: true,
          updatedAt: true,
          roles: {
            select: {
              role: {
                select: {
                  name: true,
                },
              },
            },
          },
          tenantProfile: {
            select: {
              tenantType: true,
              institutionName: true,
            },
          },
          landlordProfile: {
            select: {
              cnicNumber: true,
              isCnicVerified: true,
              businessName: true,
            },
          },
          _count: {
            select: {
              properties: true,
              inquiriesSent: true,
              inquiriesReceived: true,
            },
          },
        },
      }),
    ]);

    const formatted = items.map((u) => ({
      ...u,
      roles: u.roles.map((r) => r.role.name),
    }));

    return {
      items: formatted,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        roles: {
          include: { role: true },
        },
        tenantProfile: true,
        landlordProfile: true,
        adminProfile: true,
        _count: {
          select: {
            properties: true,
            inquiriesSent: true,
            inquiriesReceived: true,
            reportsFiled: true,
            favorites: true,
          },
        },
      },
    });

    if (!user || user.deletedAt) {
      throw new NotFoundException(`User with ID '${id}' not found`);
    }

    // Recent audit activity
    const auditLogs = await this.prisma.auditLog.findMany({
      where: {
        OR: [{ actorId: id }, { targetType: 'USER', targetId: id }],
      },
      take: 10,
      orderBy: { createdAt: 'desc' },
    });

    return {
      id: user.id,
      email: user.email,
      phoneNumber: user.phoneNumber,
      fullName: user.fullName,
      isVerified: user.isVerified,
      isSuspended: user.isSuspended,
      suspendedReason: user.suspendedReason,
      failedLoginAttempts: user.failedLoginAttempts,
      isMfaEnabled: user.isMfaEnabled,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      roles: user.roles.map((r) => r.role.name),
      tenantProfile: user.tenantProfile,
      landlordProfile: user.landlordProfile,
      adminProfile: user.adminProfile,
      counts: user._count,
      recentAuditLogs: auditLogs,
    };
  }

  async suspendUser(id: string, adminId: string, reason: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { roles: { include: { role: true } } },
    });

    if (!user || user.deletedAt) {
      throw new NotFoundException(`User with ID '${id}' not found`);
    }

    // Prevent suspending SUPER_ADMIN
    const isSuperAdmin = user.roles.some((r) => r.role.name === 'SUPER_ADMIN');
    if (isSuperAdmin) {
      throw new BadRequestException('Cannot suspend a SUPER_ADMIN account');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      // Suspend user
      const u = await tx.user.update({
        where: { id },
        data: {
          isSuspended: true,
          suspendedReason: reason,
        },
      });

      // Revoke all active refresh tokens immediately to terminate all sessions
      await tx.refreshToken.updateMany({
        where: { userId: id, isRevoked: false },
        data: { isRevoked: true },
      });

      return u;
    });

    await this.auditService.log({
      actorId: adminId,
      action: 'USER_SUSPENDED',
      targetType: 'USER',
      targetId: id,
      before: { isSuspended: user.isSuspended },
      after: { isSuspended: true, reason },
    });

    this.logger.warn(`User ${id} suspended by admin ${adminId}. Reason: ${reason}`);

    return {
      id: updated.id,
      isSuspended: updated.isSuspended,
      suspendedReason: updated.suspendedReason,
      message: 'User account suspended and all active sessions revoked',
    };
  }

  async unsuspendUser(id: string, adminId: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user || user.deletedAt) {
      throw new NotFoundException(`User with ID '${id}' not found`);
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        isSuspended: false,
        suspendedReason: null,
      },
    });

    await this.auditService.log({
      actorId: adminId,
      action: 'USER_UNSUSPENDED',
      targetType: 'USER',
      targetId: id,
      before: { isSuspended: user.isSuspended, reason: user.suspendedReason },
      after: { isSuspended: false, reason: null },
    });

    this.logger.log(`User ${id} unsuspended by admin ${adminId}`);

    return {
      id: updated.id,
      isSuspended: updated.isSuspended,
      message: 'User account restored successfully',
    };
  }

  async updateUserRole(
    id: string,
    newRoleName: SharedUserRole,
    adminId: string,
    adminRoles: string[],
  ) {
    // Only SUPER_ADMIN can change roles
    if (!adminRoles.includes('SUPER_ADMIN')) {
      throw new ForbiddenException('Only SUPER_ADMIN can modify user roles');
    }

    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { roles: { include: { role: true } } },
    });

    if (!user || user.deletedAt) {
      throw new NotFoundException(`User with ID '${id}' not found`);
    }

    const oldRoles = user.roles.map((r) => r.role.name);

    // Find role in DB
    const roleRecord = await this.prisma.role.findFirst({
      where: { name: newRoleName as unknown as UserRoleName },
    });

    if (!roleRecord) {
      throw new BadRequestException(`Role '${newRoleName}' does not exist`);
    }

    await this.prisma.$transaction(async (tx) => {
      // Remove previous roles
      await tx.userRole.deleteMany({
        where: { userId: id },
      });

      // Add new role
      await tx.userRole.create({
        data: {
          userId: id,
          roleId: roleRecord.id,
        },
      });

      // Revoke refresh tokens so user re-authenticates with fresh permissions
      await tx.refreshToken.updateMany({
        where: { userId: id, isRevoked: false },
        data: { isRevoked: true },
      });
    });

    await this.auditService.log({
      actorId: adminId,
      action: 'USER_ROLE_CHANGED',
      targetType: 'USER',
      targetId: id,
      before: { roles: oldRoles },
      after: { roles: [newRoleName] },
    });

    this.logger.log(`User ${id} role updated to ${newRoleName} by admin ${adminId}`);

    return {
      id,
      roles: [newRoleName],
      message: `User role updated to ${newRoleName}`,
    };
  }

  async updateUserStatus(
    id: string,
    isSuspended: boolean,
    reason: string | undefined,
    adminId: string,
  ) {
    if (isSuspended) {
      return this.suspendUser(id, adminId, reason || 'Administrative action');
    } else {
      return this.unsuspendUser(id, adminId);
    }
  }

  async deleteUser(id: string, adminId: string, adminRoles: string[]) {
    // Only SUPER_ADMIN can delete accounts
    if (!adminRoles.includes('SUPER_ADMIN')) {
      throw new ForbiddenException('Only SUPER_ADMIN can delete user accounts');
    }

    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user || user.deletedAt) {
      throw new NotFoundException(`User with ID '${id}' not found`);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          isSuspended: true,
          suspendedReason: 'Account deleted by administrator',
        },
      });

      await tx.refreshToken.updateMany({
        where: { userId: id },
        data: { isRevoked: true },
      });
    });

    await this.auditService.log({
      actorId: adminId,
      action: 'USER_DELETED',
      targetType: 'USER',
      targetId: id,
    });

    return { id, message: 'User deleted successfully' };
  }
}
