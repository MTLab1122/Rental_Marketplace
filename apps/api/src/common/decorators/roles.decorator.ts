import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@rental-peshawar/shared-types';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: (UserRole | string)[]) => SetMetadata(ROLES_KEY, roles);
