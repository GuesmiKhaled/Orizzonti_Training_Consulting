import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  it('returns a JWT payload with role and permissions for valid credentials', async () => {
    const user = {
      id: 1,
      username: 'admin',
      password: await bcrypt.hash('admin123', 10),
      isActive: true,
      role: {
        name: 'super-admin',
        permissions: [{ name: 'manage_blog' }, { name: 'manage_courses' }],
      },
    };

    const service = new AuthService(
      {
        findOne: jest.fn().mockResolvedValue(user),
      } as any,
      {
        findOne: jest.fn(),
      } as any,
      {
        findOne: jest.fn(),
      } as any,
      {
        create: jest.fn((entity) => entity),
        save: jest.fn().mockResolvedValue(undefined),
        delete: jest.fn().mockResolvedValue(undefined),
        findOne: jest.fn(),
      } as any,
    );

    const result = await service.login('admin', 'admin123');

    expect(result.user.username).toBe('admin');
    expect(result.user.role).toBe('super-admin');
    expect(result.user.permissions).toContain('manage_blog');
    expect(result.accessToken).toBeTruthy();
    expect(result.refreshToken).toBeTruthy();
  });

  it('revokes all refresh tokens for a user', async () => {
    const deleteSpy = jest.fn().mockResolvedValue(undefined);
    const service = new AuthService(
      {} as any,
      {} as any,
      {} as any,
      { delete: deleteSpy } as any,
    );
    await service.revokeAllUserTokens(42);
    expect(deleteSpy).toHaveBeenCalledWith({ userId: 42 });
  });
});
