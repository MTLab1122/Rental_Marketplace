import { SetMetadata } from '@nestjs/common';
import { PermissionCode } from '@rental-peshawar/shared-types';

export const PERMISSIONS_KEY = 'permissions';
export const RequirePermissions = (...permissions: (PermissionCode | string)[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
