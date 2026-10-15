/// <reference types="jest" />
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { AppService, abbreviateName } from './app.service';
import { AuthService } from './auth/auth.service';
import { CreateAdminUserDto } from './auth/dto/create-admin-user.dto';
import { ListAdminUsersDto } from './auth/dto/list-admin-users.dto';
import { UpdateAdminUserDto } from './auth/dto/update-admin-user.dto';
import { UpdateBlogDto } from './blog/dto/update-blog.dto';
import { UpdateCourseDto } from './course/dto/update-course.dto';
import { detectImageType } from './media/detect-image-type';
import { CreateMediaDto, UpdateMediaDto } from './media/dto/create-media.dto';
import { MediaUploadService } from './media/media-upload.service';
import { UpdateMailSettingsDto } from './settings/dto/update-mail-settings.dto';
import { UpdateSiteSettingsDto } from './site-settings/dto/update-site-settings.dto';
import { SiteSettingsService } from './site-settings/site-settings.service';

const pipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
});
const run = (value: unknown, metatype: new () => object) =>
  pipe.transform(value, { type: 'body', metatype });

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0]);
const GIF = Buffer.from('GIF89a......');
const WEBP = Buffer.from('RIFF\0\0\0\0WEBPVP8 ', 'latin1');

describe('detectImageType', () => {
  it('recognises the four allowed formats by content', () => {
    expect(detectImageType(PNG)?.ext).toBe('png');
    expect(detectImageType(JPEG)?.ext).toBe('jpg');
    expect(detectImageType(GIF)?.ext).toBe('gif');
    expect(detectImageType(WEBP)?.ext).toBe('webp');
  });

  it('rejects other content, including scripts renamed to .png', () => {
    expect(detectImageType(Buffer.from('<svg onload=alert(1)>'))).toBeNull();
    expect(detectImageType(Buffer.from('<?php echo 1; ?>'))).toBeNull();
    expect(detectImageType(Buffer.alloc(0))).toBeNull();
    expect(detectImageType(Buffer.from('RIFF\0\0\0\0WAVEfmt '))).toBeNull();
  });
});

describe('MediaUploadService', () => {
  let directory: string;
  const service = new MediaUploadService();

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'orizzonti-upload-'));
    process.env.UPLOAD_DIR = directory;
  });

  afterEach(async () => {
    delete process.env.UPLOAD_DIR;
    await rm(directory, { recursive: true, force: true });
  });

  it('stores a valid image under a random name with the detected extension', async () => {
    const name = await service.save({ buffer: PNG, size: PNG.length });
    expect(name).toMatch(/^[0-9a-f-]{36}\.png$/);
    expect(await readFile(join(directory, name))).toEqual(PNG);
  });

  it('never reuses the client file name and creates unique names', async () => {
    const a = await service.save({ buffer: JPEG, size: JPEG.length });
    const b = await service.save({ buffer: JPEG, size: JPEG.length });
    expect(a).not.toBe(b);
    expect(await readdir(directory)).toHaveLength(2);
  });

  it('refuses non-images and writes nothing', async () => {
    const html = Buffer.from('<html><script>alert(1)</script></html>');
    await expect(service.save({ buffer: html, size: html.length })).rejects.toThrow(
      BadRequestException,
    );
    expect(await readdir(directory)).toHaveLength(0);
  });
});

describe('Phase 5 DTO validation', () => {
  it('admin users accept optional contact fields and reject bad ones', async () => {
    const base = { username: 'amel', password: 'longenough', roleId: 2 };
    await expect(
      run({ ...base, fullName: 'Amel Ben Ali', email: 'a@b.tn', phone: '+216 24 422 753' }, CreateAdminUserDto),
    ).resolves.toBeDefined();
    await expect(run({ ...base, email: 'not-an-email' }, CreateAdminUserDto)).rejects.toThrow();
    await expect(run({ ...base, phone: 'call me' }, CreateAdminUserDto)).rejects.toThrow();
  });

  it('admin user updates are partial, can clear contact fields and reject unknown ones', async () => {
    await expect(run({ phone: null, email: null }, UpdateAdminUserDto)).resolves.toBeDefined();
    await expect(run({ id: 3, fullName: 'x' }, UpdateAdminUserDto)).rejects.toThrow();
  });

  it('user list filters parse numbers from the query string', async () => {
    const parsed = (await run({ page: '2', size: '10', roleId: '3' }, ListAdminUsersDto)) as ListAdminUsersDto;
    expect(parsed).toEqual(expect.objectContaining({ page: 2, size: 10, roleId: 3 }));
    await expect(run({ roleId: '0' }, ListAdminUsersDto)).rejects.toThrow();
  });

  it('media requires a title and an http(s) URL or absolute path', async () => {
    await expect(run({ title: 'Hero', imageUrl: '/uploads/a.png' }, CreateMediaDto)).resolves.toBeDefined();
    await expect(run({ title: 'Hero', imageUrl: 'https://x.tn/a.png' }, CreateMediaDto)).resolves.toBeDefined();
    await expect(run({ title: 'Hero', imageUrl: 'javascript:alert(1)' }, CreateMediaDto)).rejects.toThrow();
    await expect(run({ imageUrl: '/a.png' }, CreateMediaDto)).rejects.toThrow();
    await expect(run({ id: 1, title: 'x' }, UpdateMediaDto)).rejects.toThrow();
  });

  it('blog and course updates reject unknown fields but allow partial bodies', async () => {
    await expect(run({ isPublished: false }, UpdateBlogDto)).resolves.toBeDefined();
    await expect(run({ id: 4, title: 'Valid title' }, UpdateBlogDto)).rejects.toThrow();
    await expect(run({ level: 'B1', startDate: '2026-11-01' }, UpdateCourseDto)).resolves.toBeDefined();
    await expect(run({ id: 4 }, UpdateCourseDto)).rejects.toThrow();
  });

  it('mail settings accept known fields only and bound the port', async () => {
    await expect(run({ host: 'smtp.x.tn', port: 587, secure: true }, UpdateMailSettingsDto)).resolves.toBeDefined();
    await expect(run({ port: 70000 }, UpdateMailSettingsDto)).rejects.toThrow();
    await expect(run({ id: 1, createdAt: 'x' }, UpdateMailSettingsDto)).rejects.toThrow();
  });

  it('site settings validate contacts and URLs and allow clearing with null', async () => {
    await expect(
      run(
        {
          contactEmail: 'info@orizzonti.tn',
          facebookUrl: 'https://facebook.com/orizzonti.tn',
          studentsCount: 2500,
          nextSessionDate: '2026-11-01T09:00:00.000Z',
          aboutText: null,
        },
        UpdateSiteSettingsDto,
      ),
    ).resolves.toBeDefined();
    await expect(run({ facebookUrl: 'javascript:alert(1)' }, UpdateSiteSettingsDto)).rejects.toThrow();
    await expect(run({ contactEmail: 'nope' }, UpdateSiteSettingsDto)).rejects.toThrow();
    await expect(run({ studentsCount: -1 }, UpdateSiteSettingsDto)).rejects.toThrow();
  });
});

describe('SiteSettingsService', () => {
  const setup = (existing: object | null) => {
    const row = existing ? { id: 1, ...existing } : null;
    const repository = {
      find: jest.fn().mockResolvedValue(row ? [row] : []),
      create: jest.fn((v: object) => ({ ...v })),
      save: jest.fn(async (v: object) => ({ id: 1, ...v })),
      merge: jest.fn((target: object, values: object) => Object.assign(target, values)),
    };
    return { service: new SiteSettingsService(repository as never), repository };
  };

  it('creates the single row on first read', async () => {
    const { service, repository } = setup(null);
    await service.get();
    expect(repository.save).toHaveBeenCalledTimes(1);
  });

  it('does not create another row when one exists', async () => {
    const { service, repository } = setup({ contactEmail: 'a@b.tn' });
    await expect(service.get()).resolves.toMatchObject({ contactEmail: 'a@b.tn' });
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('merges updates, converts the session date and clears with null', async () => {
    const { service } = setup({ aboutText: 'old', nextSessionDate: new Date() });
    const result = await service.update({
      aboutText: null,
      studentsCount: 10,
      nextSessionDate: '2026-12-01T09:00:00.000Z',
    });
    expect(result.aboutText).toBeNull();
    expect(result.studentsCount).toBe(10);
    expect(result.nextSessionDate).toEqual(new Date('2026-12-01T09:00:00.000Z'));

    const cleared = await service.update({ nextSessionDate: null });
    expect(cleared.nextSessionDate).toBeNull();
  });
});

describe('dashboard stats', () => {
  it('abbreviates applicant names', () => {
    expect(abbreviateName('Sana Ben Ali')).toBe('Sana B.');
    expect(abbreviateName('  omar   khelifi ')).toBe('omar K.');
    expect(abbreviateName('Leila')).toBe('Leila');
  });

  it('adds admin users, requests per course and abbreviated latest requests', async () => {
    const query = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([{ name: 'Italian', count: '4' }]),
    };
    const counter = (value: number) => ({ count: jest.fn().mockResolvedValue(value) });
    const requests = {
      ...counter(9),
      createQueryBuilder: jest.fn(() => query),
      find: jest.fn().mockResolvedValue([
        { id: 1, fullName: 'Sana Ben Ali', email: 'secret@x.tn', courseName: 'Italian', status: 'new', createdAt: new Date() },
      ]),
    };
    const service = new AppService(
      counter(18) as never,
      counter(12) as never,
      counter(5) as never,
      counter(3) as never,
      requests as never,
      counter(4) as never,
    );

    const stats = await service.getDashboardStats();
    expect(stats).toMatchObject({
      blogsCount: 18,
      coursesCount: 12,
      languagesCount: 5,
      adminUsersCount: 4,
      requestsByCourse: [{ name: 'Italian', count: 4 }],
    });
    expect(stats.latestRequests[0]).toEqual(
      expect.objectContaining({ applicant: 'Sana B.', courseName: 'Italian' }),
    );
    expect(JSON.stringify(stats)).not.toContain('secret@x.tn');
  });
});

describe('AuthService user directory', () => {
  const role = { id: 2, name: 'editor', permissions: [] };

  const setup = () => {
    const users = {
      findAndCount: jest.fn().mockResolvedValue([[], 0]),
      findOne: jest.fn(),
      create: jest.fn((entity: object) => ({ id: 9, ...entity })),
      save: jest.fn(async (entity: object) => entity),
    };
    const roles = { findOne: jest.fn().mockResolvedValue(role) };
    const service = new AuthService(users as never, roles as never, {} as never);
    return { service, users };
  };

  it('searches username, name and email and combines the role filter', async () => {
    const { service, users } = setup();
    await service.listUsers({ page: 0, size: 20, search: 'amel', roleId: 2 });
    const where = users.findAndCount.mock.calls[0][0].where as Record<string, unknown>[];
    expect(where.map((w) => Object.keys(w)[0])).toEqual(['username', 'fullName', 'email']);
    expect(where.every((w) => JSON.stringify(w.role) === JSON.stringify({ id: 2 }))).toBe(true);
  });

  it('filters by role only when there is no search term', async () => {
    const { service, users } = setup();
    await service.listUsers({ page: 0, size: 20, roleId: 2 });
    expect(users.findAndCount.mock.calls[0][0].where).toEqual({ role: { id: 2 } });
    await service.listUsers({ page: 0, size: 20 });
    expect(users.findAndCount.mock.calls[1][0].where).toBeUndefined();
  });

  it('returns contact details but never the password hash', async () => {
    const { service, users } = setup();
    users.findAndCount.mockResolvedValue([
      [{ id: 3, username: 'amel', password: 'hash', fullName: 'Amel', email: 'a@b.tn', phone: '+216', isActive: true, role }],
      1,
    ]);
    const result = await service.listUsers({ page: 0, size: 20 });
    expect(result.items[0]).toEqual(
      expect.objectContaining({ fullName: 'Amel', email: 'a@b.tn', phone: '+216' }),
    );
    expect(result.items[0]).not.toHaveProperty('password');
  });
});
