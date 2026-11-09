import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { PrismaService } from '../../database/prisma.service';
import { JwtPayload } from '../../modules/auth/token.service';
import { UserRole } from '@rental-peshawar/shared-types';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest<{ user?: JwtPayload }>();

    if (!user || !user.sub) {
      throw new ForbiddenException('User is not authenticated.');
    }

    // SUPER_ADMIN has all permissions
    if (user.roles?.includes(UserRole.SUPER_ADMIN)) {
      return true;
    }

    // Query user permissions via roles
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId: user.sub },
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
      },
    });

    const userPermissionCodes = new Set<string>();
    for (const ur of userRoles) {
      for (const rp of ur.role.permissions) {
        userPermissionCodes.add(rp.permission.code);
      }
    }

    const hasAll = requiredPermissions.every((perm) => userPermissionCodes.has(perm));

    if (!hasAll) {
      throw new ForbiddenException(
        `Insufficient permissions. Missing: [${requiredPermissions
          .filter((p) => !userPermissionCodes.has(p))
          .join(', ')}]`,
      );
    }

    return true;
  }
}
