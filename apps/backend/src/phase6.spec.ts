/// <reference types="jest" />
import {
  BadRequestException,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
  ValidationPipe,
} from '@nestjs/common';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import * as bcrypt from 'bcryptjs';
import request from 'supertest';
import {
  ALLOW_PENDING_PASSWORD_CHANGE_KEY,
  assertJwtSecretConfigured,
  getJwtSecret,
} from './auth/auth.constants';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { ChangePasswordDto } from './auth/dto/change-password.dto';
import { PermissionsGuard } from './auth/guards/permissions.guard';
import { BlogController } from './blog/blog.controller';
import { BlogService } from './blog/blog.service';
import { ContactController } from './contact/contact.controller';
import { ContactService } from './contact/contact.service';
import { GLOBAL_THROTTLE } from './throttling';

const STRONG = 'k'.repeat(40);

describe('JWT secret rules', () => {
  const original = process.env.JWT_SECRET;
  afterEach(() => {
    process.env.JWT_SECRET = original;
  });

  it('refuses to run without a secret', () => {
    delete process.env.JWT_SECRET;
    expect(() => getJwtSecret()).toThrow('JWT_SECRET is not set');
    expect(() => assertJwtSecretConfigured()).toThrow();
  });

  it('rejects short secrets and the old built-in placeholder', () => {
    process.env.JWT_SECRET = 'short';
    expect(() => getJwtSecret()).toThrow('too weak');
    process.env.JWT_SECRET = 'local-development-only-change-me';
    expect(() => getJwtSecret()).toThrow('too weak');
  });

  it('accepts a long secret and never echoes it in errors', () => {
    process.env.JWT_SECRET = STRONG;
    expect(getJwtSecret()).toBe(STRONG);
    process.env.JWT_SECRET = 'tiny-secret-value';
    try {
      getJwtSecret();
    } catch (error) {
      expect(String(error)).not.toContain('tiny-secret-value');
    }
  });
});

function makeAuth() {
  const users = {
    findOne: jest.fn(),
    count: jest.fn().mockResolvedValue(0),
    create: jest.fn((entity: object) => ({ id: 7, ...entity })),
    save: jest.fn(async (entity: object) => entity),
  };
  const roles = { findOne: jest.fn().mockResolvedValue({ id: 1, name: 'super-admin', permissions: [] }) };
  const service = new AuthService(users as never, roles as never, {} as never);
  return { service, users, roles };
}

describe('initial admin seeding', () => {
  const original = process.env.DEFAULT_ADMIN_PASSWORD;
  afterEach(() => {
    if (original === undefined) delete process.env.DEFAULT_ADMIN_PASSWORD;
    else process.env.DEFAULT_ADMIN_PASSWORD = original;
  });

  it('creates nothing and logs no password when DEFAULT_ADMIN_PASSWORD is unset', async () => {
    delete process.env.DEFAULT_ADMIN_PASSWORD;
    const { service, users } = makeAuth();
    users.findOne.mockResolvedValue(null);
    await service.seedDefaultAdmin();
    expect(users.save).not.toHaveBeenCalled();
  });

  it('refuses a short initial password', async () => {
    process.env.DEFAULT_ADMIN_PASSWORD = 'short-pass';
    const { service, users } = makeAuth();
    users.findOne.mockResolvedValue(null);
    await service.seedDefaultAdmin();
    expect(users.save).not.toHaveBeenCalled();
  });

  it('creates the first admin hashed and forced to change its password', async () => {
    process.env.DEFAULT_ADMIN_PASSWORD = 'a-long-initial-password';
    const { service, users } = makeAuth();
    users.findOne.mockResolvedValue(null);
    await service.seedDefaultAdmin();
    const saved = users.save.mock.calls[0][0] as { password: string; mustChangePassword: boolean; username: string };
    expect(saved.username).toBe('admin');
    expect(saved.mustChangePassword).toBe(true);
    expect(saved.password).not.toBe('a-long-initial-password');
    expect(await bcrypt.compare('a-long-initial-password', saved.password)).toBe(true);
  });

  it('does not seed when other accounts already exist', async () => {
    process.env.DEFAULT_ADMIN_PASSWORD = 'a-long-initial-password';
    const { service, users } = makeAuth();
    users.findOne.mockResolvedValue(null);
    users.count.mockResolvedValue(3);
    await service.seedDefaultAdmin();
    expect(users.save).not.toHaveBeenCalled();
  });

  it('forces an existing admin that still uses the old default password to change it', async () => {
    const admin = { id: 1, username: 'admin', password: await bcrypt.hash('admin123', 4), mustChangePassword: false, role: { id: 1 } };
    const { service, users } = makeAuth();
    users.findOne.mockResolvedValue(admin);
    await service.seedDefaultAdmin();
    expect(users.save).toHaveBeenCalledWith(expect.objectContaining({ mustChangePassword: true }));
  });

  it('leaves an admin with a custom password alone', async () => {
    const admin = { id: 1, username: 'admin', password: await bcrypt.hash('a-very-custom-password', 4), mustChangePassword: false, role: { id: 1 } };
    const { service, users } = makeAuth();
    users.findOne.mockResolvedValue(admin);
    await service.seedDefaultAdmin();
    expect(users.save).not.toHaveBeenCalled();
    expect(admin.mustChangePassword).toBe(false);
  });
});

describe('changePassword', () => {
  const setup = async () => {
    const { service, users } = makeAuth();
    const user = { id: 5, username: 'amel', isActive: true, mustChangePassword: true, password: await bcrypt.hash('current-password-1', 4) };
    users.findOne.mockResolvedValue(user);
    return { service, users, user };
  };

  it('rejects a wrong current password', async () => {
    const { service, user } = await setup();
    await expect(service.changePassword(5, { currentPassword: 'wrong', newPassword: 'brand-new-password-9' })).rejects.toThrow('Current password is incorrect');
    expect(user.mustChangePassword).toBe(true);
  });

  it('rejects reusing the current password and passwords containing the username', async () => {
    const { service } = await setup();
    await expect(service.changePassword(5, { currentPassword: 'current-password-1', newPassword: 'current-password-1' })).rejects.toThrow('different');
    await expect(service.changePassword(5, { currentPassword: 'current-password-1', newPassword: 'my-Amel-password-2026' })).rejects.toThrow('username');
  });

  it('stores a new hash and clears the forced-change flag', async () => {
    const { service, users, user } = await setup();
    await expect(service.changePassword(5, { currentPassword: 'current-password-1', newPassword: 'brand-new-password-9' })).resolves.toEqual({ success: true });
    expect(user.mustChangePassword).toBe(false);
    expect(await bcrypt.compare('brand-new-password-9', user.password)).toBe(true);
    expect(users.save).toHaveBeenCalledTimes(1);
  });

  it('rejects inactive or missing accounts', async () => {
    const { service, users } = await setup();
    users.findOne.mockResolvedValue(null);
    await expect(service.changePassword(5, { currentPassword: 'x', newPassword: 'y'.repeat(12) })).rejects.toThrow();
  });

  it('requires a long new password at the API boundary', async () => {
    const pipe = new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true });
    const meta = { type: 'body' as const, metatype: ChangePasswordDto };
    await expect(pipe.transform({ currentPassword: 'a', newPassword: 'short' }, meta)).rejects.toThrow(BadRequestException);
    await expect(pipe.transform({ currentPassword: 'a', newPassword: 'twelve-chars!' }, meta)).resolves.toBeDefined();
  });
});

describe('forced password change for created and reset accounts', () => {
  const requester = { id: 1, isActive: true, role: { id: 1, name: 'super-admin', permissions: [{ name: 'manage_roles' }, { name: 'manage_users' }] } };
  const target = { id: 2, username: 'amel', isActive: true, password: 'old', mustChangePassword: false, role: { id: 2, name: 'editor', permissions: [] } };

  const setup = () => {
    const { service, users, roles } = makeAuth();
    users.findOne.mockImplementation(async ({ where }: { where: { id?: number } }) =>
      where.id === 1 ? requester : where.id === 2 ? target : null,
    );
    roles.findOne.mockResolvedValue({ id: 2, name: 'editor', permissions: [] });
    return { service, users };
  };

  it('flags accounts created by an admin', async () => {
    const { service, users } = setup();
    users.findOne.mockImplementationOnce(async () => null);
    const result = await service.createUser({ username: 'newbie', password: 'temporary-pass-1', roleId: 2 }, 1);
    expect(users.save.mock.calls[0][0]).toEqual(expect.objectContaining({ mustChangePassword: true }));
    expect(result.mustChangePassword).toBe(true);
  });

  it('flags another user whose password an admin resets', async () => {
    const { service } = setup();
    await service.updateUser(2, { password: 'reset-by-admin-1' }, 1);
    expect(target.mustChangePassword).toBe(true);
  });

  it('does not flag an admin changing their own password', async () => {
    const self = { ...requester, username: 'boss', password: 'old', mustChangePassword: false };
    const { service, users } = makeAuth();
    users.findOne.mockResolvedValue(self);
    await service.updateUser(1, { password: 'my-new-password-12' }, 1);
    expect(self.mustChangePassword).toBe(false);
    expect(self.password).not.toBe('old');
  });
});

describe('PermissionsGuard password-change gate', () => {
  const contextFor = (): ExecutionContext =>
    ({ getHandler: jest.fn(), getClass: jest.fn(), switchToHttp: () => ({ getRequest: () => ({ authUserId: 1 }) }) }) as never;

  const guardFor = (user: object, allowPending: boolean) => {
    const reflector = {
      getAllAndOverride: jest.fn((key: string) => (key === ALLOW_PENDING_PASSWORD_CHANGE_KEY ? allowPending : undefined)),
    };
    return new PermissionsGuard(reflector as unknown as Reflector, { getUserAccess: jest.fn().mockResolvedValue(user) } as unknown as AuthService);
  };

  it('blocks ordinary endpoints while a change is required', async () => {
    const guard = guardFor({ isActive: true, mustChangePassword: true, permissions: ['manage_users'] }, false);
    await expect(guard.canActivate(contextFor())).rejects.toThrow(ForbiddenException);
    await expect(guard.canActivate(contextFor())).rejects.toThrow('Password change required');
  });

  it('still allows profile and change-password', async () => {
    const guard = guardFor({ isActive: true, mustChangePassword: true, permissions: [] }, true);
    await expect(guard.canActivate(contextFor())).resolves.toBe(true);
  });

  it('does not gate accounts that are up to date', async () => {
    const guard = guardFor({ isActive: true, mustChangePassword: false, permissions: [] }, false);
    await expect(guard.canActivate(contextFor())).resolves.toBe(true);
  });
});

describe('public blog visibility', () => {
  const setup = () => {
    const repository = { find: jest.fn().mockResolvedValue([]), findOne: jest.fn() };
    return { service: new BlogService(repository as never), repository };
  };

  it('lists only published posts publicly and everything for admins', async () => {
    const { service, repository } = setup();
    await service.findPublished();
    expect(repository.find).toHaveBeenLastCalledWith(expect.objectContaining({ where: { isPublished: true } }));
    await service.findAll();
    expect(repository.find).toHaveBeenLastCalledWith({ order: { createdAt: 'DESC' } });
  });

  it('hides an unpublished post from the public by id', async () => {
    const { service, repository } = setup();
    repository.findOne.mockResolvedValue(null);
    await expect(service.findPublishedOne(3)).rejects.toThrow(NotFoundException);
    expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 3, isPublished: true } });
  });
});

describe('HTTP behaviour', () => {
  const pipes = new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true });

  const boot = async (controllers: never[], providers: unknown[]) => {
    const module = await Test.createTestingModule({
      imports: [ThrottlerModule.forRoot([GLOBAL_THROTTLE])],
      controllers,
      providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }, ...(providers as never[])],
    }).compile();
    const app = module.createNestApplication();
    app.useGlobalPipes(pipes);
    await app.init();
    return app;
  };

  it('limits login attempts to 5 per minute', async () => {
    const login = jest.fn().mockResolvedValue({ accessToken: 't' });
    const app = await boot([AuthController as never], [{ provide: AuthService, useValue: { login } }]);
    const attempt = () => request(app.getHttpServer()).post('/auth/login').send({ username: 'admin', password: 'wrong-password' });
    for (let i = 0; i < 5; i++) await attempt().expect(201);
    await attempt().expect(429);
    expect(login).toHaveBeenCalledTimes(5);
    await app.close();
  });

  it('limits the public contact form to 5 per 10 minutes', async () => {
    const send = jest.fn().mockResolvedValue({ success: true });
    const app = await boot([ContactController as never], [{ provide: ContactService, useValue: { sendContactMessage: send } }]);
    const body = { name: 'Sana', email: 'sana@example.com', subject: 'Question', message: 'A message long enough.' };
    for (let i = 0; i < 5; i++) await request(app.getHttpServer()).post('/contact').send(body).expect(201);
    await request(app.getHttpServer()).post('/contact').send(body).expect(429);
    expect(send).toHaveBeenCalledTimes(5);
    await app.close();
  });

  it('does not count read-only public requests against the strict limits', async () => {
    const findPublished = jest.fn().mockResolvedValue([]);
    const app = await boot([BlogController as never], [{ provide: BlogService, useValue: { findPublished } }]);
    for (let i = 0; i < 20; i++) await request(app.getHttpServer()).get('/blogs').expect(200);
    await app.close();
  });

  it('routes /blogs/manage before /blogs/:id and rejects non-numeric ids', async () => {
    const service = {
      findPublished: jest.fn().mockResolvedValue([{ id: 1 }]),
      findAll: jest.fn().mockResolvedValue([{ id: 1 }, { id: 2 }]),
      findOne: jest.fn().mockResolvedValue({ id: 9, isPublished: false }),
      findPublishedOne: jest.fn(),
    };
    const app = await boot([BlogController as never], [{ provide: BlogService, useValue: service }]);
    const listed = await request(app.getHttpServer()).get('/blogs/manage').expect(200);
    expect(listed.body).toHaveLength(2);
    await request(app.getHttpServer()).get('/blogs/manage/9').expect(200);
    expect(service.findOne).toHaveBeenCalledWith(9);
    await request(app.getHttpServer()).get('/blogs/abc').expect(400);
    expect(service.findPublishedOne).not.toHaveBeenCalled();
    await app.close();
  });
});
