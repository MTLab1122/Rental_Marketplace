import { OwnershipGuard } from './ownership.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@rental-peshawar/shared-types';

describe('OwnershipGuard', () => {
  let guard: OwnershipGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new OwnershipGuard(reflector);
  });

  const createMockContext = (
    userSub: string,
    roles: string[],
    params: Record<string, string> = {},
  ): ExecutionContext =>
    ({
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          user: { sub: userSub, roles },
          params,
          body: {},
        }),
      }),
    }) as unknown as ExecutionContext;

  it('should allow user accessing own resource', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue({ paramName: 'userId' });
    const ctx = createMockContext('user-123', [UserRole.TENANT], { userId: 'user-123' });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should reject tenant trying to access another user resource (IDOR protection)', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue({ paramName: 'userId' });
    const ctx = createMockContext('user-attacker', [UserRole.TENANT], { userId: 'user-victim' });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('should allow ADMIN to bypass ownership checks', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue({ paramName: 'userId', allowAdmin: true });
    const ctx = createMockContext('admin-1', [UserRole.ADMIN], { userId: 'user-victim' });
    expect(guard.canActivate(ctx)).toBe(true);
  });
});
