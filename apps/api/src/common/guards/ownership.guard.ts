import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtPayload } from '../../modules/auth/token.service';
import { UserRole } from '@rental-peshawar/shared-types';

export interface OwnershipOptions {
  paramName?: string; // Route param name to match against user.sub (default: 'userId' or 'id')
  allowAdmin?: boolean; // Whether ADMIN and SUPER_ADMIN can bypass ownership (default: true)
}

export const OWNERSHIP_KEY = 'ownership_check';
export const CheckOwnership = (options: OwnershipOptions = {}) =>
  SetMetadata(OWNERSHIP_KEY, options);

@Injectable()
export class OwnershipGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const options = this.reflector.getAllAndOverride<OwnershipOptions>(OWNERSHIP_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!options) {
      return true; // No ownership check requested
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtPayload | undefined;

    if (!user || !user.sub) {
      throw new ForbiddenException('User is not authenticated.');
    }

    const allowAdmin = options.allowAdmin !== false;
    if (
      allowAdmin &&
      (user.roles.includes(UserRole.ADMIN) || user.roles.includes(UserRole.SUPER_ADMIN))
    ) {
      return true;
    }

    const paramName = options.paramName || 'id';
    const targetUserId = request.params[paramName] || request.body[paramName];

    if (!targetUserId) {
      return true; // Param not present in route/body
    }

    if (user.sub !== targetUserId) {
      throw new ForbiddenException('Access denied. You can only view or modify your own records.');
    }

    return true;
  }
}
