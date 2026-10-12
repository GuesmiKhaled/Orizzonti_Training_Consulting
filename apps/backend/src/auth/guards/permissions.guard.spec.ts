import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from '../auth.service';
import { PermissionsGuard } from './permissions.guard';

function contextFor(request: any): ExecutionContext {
  return {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('PermissionsGuard', () => {
  it('allows a user with the required permission and attaches the current profile', async () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue('manage_users'),
    };
    const user = { id: 1, isActive: true, permissions: ['manage_users'] };
    const authService = { getUserAccess: jest.fn().mockResolvedValue(user) };
    const request = { authUserId: 1 };
    const guard = new PermissionsGuard(
      reflector as unknown as Reflector,
      authService as unknown as AuthService,
    );

    await expect(guard.canActivate(contextFor(request))).resolves.toBe(true);
    expect(request.user).toBe(user);
  });

  it('rejects a user without the required permission', async () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue('manage_roles'),
    };
    const authService = {
      getUserAccess: jest
        .fn()
        .mockResolvedValue({
          id: 2,
          isActive: true,
          permissions: ['manage_blog'],
        }),
    };
    const guard = new PermissionsGuard(
      reflector as unknown as Reflector,
      authService as unknown as AuthService,
    );

    await expect(
      guard.canActivate(contextFor({ authUserId: 2 })),
    ).rejects.toThrow(ForbiddenException);
  });

  it('allows either permission for explicitly shared read access', async () => {
    const reflector = {
      getAllAndOverride: jest
        .fn()
        .mockReturnValue(['manage_users', 'manage_roles']),
    };
    const authService = {
      getUserAccess: jest
        .fn()
        .mockResolvedValue({
          id: 3,
          isActive: true,
          permissions: ['manage_users'],
        }),
    };
    const guard = new PermissionsGuard(
      reflector as unknown as Reflector,
      authService as unknown as AuthService,
    );

    await expect(
      guard.canActivate(contextFor({ authUserId: 3 })),
    ).resolves.toBe(true);
  });

  it('rejects missing or inactive accounts', async () => {
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue(null) };
    const authService = { getUserAccess: jest.fn().mockResolvedValue(null) };
    const guard = new PermissionsGuard(
      reflector as unknown as Reflector,
      authService as unknown as AuthService,
    );

    await expect(
      guard.canActivate(contextFor({ authUserId: 9 })),
    ).rejects.toThrow(UnauthorizedException);
  });
});
