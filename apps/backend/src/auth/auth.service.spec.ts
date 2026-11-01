import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';

function makeOtpServiceMock(
  overrides: Partial<Record<string, jest.Mock>> = {},
) {
  return {
    createChallenge: jest.fn().mockResolvedValue({
      challengeId: 'test-challenge',
      code: '123456',
    }),
    verifyAndConsume: jest.fn(),
    resend: jest.fn(),
    cleanupExpired: jest.fn(),
    ...overrides,
  } as any;
}

function makeTrustedDeviceServiceMock(
  overrides: Partial<Record<string, jest.Mock>> = {},
) {
  return {
    validate: jest.fn().mockResolvedValue(null),
    create: jest
      .fn()
      .mockResolvedValue({ deviceToken: 'device-token', record: {} }),
    parseUserAgent: jest.fn().mockReturnValue({
      deviceName: 'Test',
      browser: 'Test',
      operatingSystem: 'Test',
    }),
    listForUser: jest.fn(),
    revoke: jest.fn(),
    cleanupExpired: jest.fn(),
    ...overrides,
  } as any;
}

function makeMailerMock() {
  return { sendMail: jest.fn().mockResolvedValue(undefined) } as any;
}

describe('AuthService', () => {
  it('returns a JWT payload when a valid trusted device is present', async () => {
    const user = {
      id: 1,
      username: 'admin',
      password: await bcrypt.hash('admin123', 10),
      isActive: true,
      email: 'admin@test.com',
      role: {
        name: 'super-admin',
        permissions: [{ name: 'manage_blog' }, { name: 'manage_courses' }],
      },
    };

    const otpService = makeOtpServiceMock();
    const trustedDeviceService = makeTrustedDeviceServiceMock({
      validate: jest.fn().mockResolvedValue({ userId: 1 }),
    });

    const service = new AuthService(
      { findOne: jest.fn().mockResolvedValue(user) } as any,
      { findOne: jest.fn() } as any,
      { findOne: jest.fn() } as any,
      {
        create: jest.fn((entity) => entity),
        save: jest.fn().mockResolvedValue(undefined),
        delete: jest.fn().mockResolvedValue(undefined),
        findOne: jest.fn(),
      } as any,
      otpService,
      trustedDeviceService,
      makeMailerMock(),
    );

    const result = await service.login(
      'admin',
      'admin123',
      'valid-device-token',
    );

    expect('challengeRequired' in result).toBe(false);
    if (!('challengeRequired' in result)) {
      expect(result.user.username).toBe('admin');
      expect(result.user.role).toBe('super-admin');
      expect(result.user.permissions).toContain('manage_blog');
      expect(result.accessToken).toBeTruthy();
      expect(result.refreshToken).toBeTruthy();
    }
    expect(otpService.createChallenge).not.toHaveBeenCalled();
  });

  it('returns a challenge when no trusted device is present', async () => {
    const user = {
      id: 1,
      username: 'admin',
      password: await bcrypt.hash('admin123', 10),
      isActive: true,
      email: 'admin@test.com',
      role: {
        name: 'super-admin',
        permissions: [{ name: 'manage_blog' }],
      },
    };

    const otpService = makeOtpServiceMock();
    const trustedDeviceService = makeTrustedDeviceServiceMock();
    const mailer = makeMailerMock();

    const service = new AuthService(
      { findOne: jest.fn().mockResolvedValue(user) } as any,
      { findOne: jest.fn() } as any,
      { findOne: jest.fn() } as any,
      {
        create: jest.fn((entity) => entity),
        save: jest.fn().mockResolvedValue(undefined),
        delete: jest.fn().mockResolvedValue(undefined),
        findOne: jest.fn(),
      } as any,
      otpService,
      trustedDeviceService,
      mailer,
    );

    const result = await service.login('admin', 'admin123');

    expect('challengeRequired' in result).toBe(true);
    if ('challengeRequired' in result) {
      expect(result.challengeId).toBe('test-challenge');
      expect(result.email).toBe('admin@test.com');
    }
    expect(otpService.createChallenge).toHaveBeenCalledWith(1);
    expect(mailer.sendMail).toHaveBeenCalledTimes(1);
  });

  it('revokes all refresh tokens for a user', async () => {
    const deleteSpy = jest.fn().mockResolvedValue(undefined);
    const service = new AuthService(
      {} as any,
      {} as any,
      {} as any,
      { delete: deleteSpy } as any,
      makeOtpServiceMock(),
      makeTrustedDeviceServiceMock(),
      makeMailerMock(),
    );
    await service.revokeAllUserTokens(42);
    expect(deleteSpy).toHaveBeenCalledWith({ userId: 42 });
  });
});
