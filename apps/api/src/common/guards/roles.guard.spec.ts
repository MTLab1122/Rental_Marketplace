import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@rental-peshawar/shared-types';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  const createMockContext = (roles: string[] = []): ExecutionContext =>
    ({
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          user: { sub: 'user-id-1', roles },
        }),
      }),
    }) as unknown as ExecutionContext;

  it('should allow access if no roles are required on route', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const ctx = createMockContext([UserRole.TENANT]);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should allow user possessing the required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);
    const ctx = createMockContext([UserRole.ADMIN]);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should allow SUPER_ADMIN to bypass any role requirement', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.LANDLORD]);
    const ctx = createMockContext([UserRole.SUPER_ADMIN]);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should throw ForbiddenException if user lacks required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRole.ADMIN]);
    const ctx = createMockContext([UserRole.TENANT]);
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });
});
