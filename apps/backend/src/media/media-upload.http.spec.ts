/// <reference types="jest" />
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';
import { configureUploads } from './configure-uploads';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { MediaUploadService } from './media-upload.service';

const PNG = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.alloc(64, 1),
]);

describe('POST /media/upload and /uploads (over HTTP)', () => {
  let app: NestExpressApplication;
  let directory: string;

  beforeAll(async () => {
    directory = await mkdtemp(join(tmpdir(), 'orizzonti-http-'));
    process.env.UPLOAD_DIR = directory;
    delete process.env.UPLOAD_PUBLIC_URL;
    await writeFile(join(directory, '.secret'), 'hidden');

    const module = await Test.createTestingModule({
      controllers: [MediaController],
      providers: [{ provide: MediaService, useValue: {} }, MediaUploadService],
    }).compile();
    app = module.createNestApplication<NestExpressApplication>();
    configureUploads(app);
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    delete process.env.UPLOAD_DIR;
    await rm(directory, { recursive: true, force: true });
  });

  const server = () => app.getHttpServer();

  it('stores a PNG and serves it back with hardened headers', async () => {
    const upload = await request(server())
      .post('/media/upload')
      .attach('file', PNG, { filename: 'whatever.exe', contentType: 'application/octet-stream' })
      .expect(201);

    const url = new URL(upload.body.url as string);
    expect(url.pathname).toMatch(/^\/uploads\/[0-9a-f-]{36}\.png$/);

    const served = await request(server()).get(url.pathname).expect(200);
    expect(served.headers['content-type']).toContain('image/png');
    expect(served.headers['x-content-type-options']).toBe('nosniff');
    expect(served.headers['cache-control']).toContain('immutable');
    expect(Buffer.from(served.body).equals(PNG)).toBe(true);
  });

  it('rejects a script renamed to .png', async () => {
    const response = await request(server())
      .post('/media/upload')
      .attach('file', Buffer.from('<script>alert(1)</script>'), {
        filename: 'evil.png',
        contentType: 'image/png',
      })
      .expect(400);
    expect(response.body.message).toContain('Only JPEG, PNG, WebP and GIF');
  });

  it('rejects a request without a file', async () => {
    await request(server()).post('/media/upload').expect(400);
  });

  it('rejects a file larger than 5 MB', async () => {
    const big = Buffer.concat([PNG, Buffer.alloc(5 * 1024 * 1024)]);
    await request(server())
      .post('/media/upload')
      .attach('file', big, { filename: 'big.png', contentType: 'image/png' })
      .expect(413);
  });

  it('only accepts the "file" field', async () => {
    await request(server())
      .post('/media/upload')
      .attach('upload', PNG, { filename: 'a.png', contentType: 'image/png' })
      .expect(400);
  });

  it('does not serve dotfiles, missing files or path traversal', async () => {
    await request(server()).get('/uploads/.secret').expect(404);
    await request(server()).get('/uploads/missing.png').expect(404);
    await request(server()).get('/uploads/..%2Fpackage.json').expect(404);
  });

  it('uses UPLOAD_PUBLIC_URL for the returned address when set', async () => {
    process.env.UPLOAD_PUBLIC_URL = 'https://cdn.orizzonti.tn/';
    const response = await request(server())
      .post('/media/upload')
      .attach('file', PNG, { filename: 'a.png', contentType: 'image/png' })
      .expect(201);
    delete process.env.UPLOAD_PUBLIC_URL;
    expect(response.body.url).toMatch(/^https:\/\/cdn\.orizzonti\.tn\/uploads\/[0-9a-f-]{36}\.png$/);
  });
});
