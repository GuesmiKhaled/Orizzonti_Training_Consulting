/// <reference types="jest" />
import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { CreateLanguageWizardDto } from './language/dto/create-language-wizard.dto';
import { CreateLanguageDto } from './language/dto/create-language.dto';
import { UpdateLanguageDto } from './language/dto/update-language.dto';
import { MediaController } from './media/media.controller';
import { MediaUploadService } from './media/media-upload.service';
import { MediaService } from './media/media.service';
import { UpdateSiteSettingsDto } from './site-settings/dto/update-site-settings.dto';

const pipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
});
const run = (value: unknown, metatype: new () => object) =>
  pipe.transform(value, { type: 'body', metatype });

describe('language picture (image library path)', () => {
  const valid = (imageUrl: string) =>
    run({ name: 'Italian', imageUrl }, CreateLanguageDto);

  it('accepts files from the img library, including accents, spaces and subfolders', async () => {
    for (const path of [
      '/img/cat-1.jpg',
      '/img/eng/italian.jpg',
      '/img/fr/français.jpg',
      '/img/283466707_731832808261199_7392528288068236206_n.jpg',
      '/img/Untitled.png',
      '/img/some folder/photo one.WEBP',
    ]) {
      await expect(valid(path)).resolves.toBeDefined();
    }
  });

  it('rejects external URLs, schemes, traversal and non-images', async () => {
    for (const path of [
      'https://evil.example/x.jpg',
      '//evil.example/x.jpg',
      'javascript:alert(1)',
      '/img/../secret.jpg',
      '/img/a/../../b.jpg',
      '/img//double.jpg',
      '/uploads/x.png',
      '/img/readme.txt',
      '/img/no-extension',
      '/img/script.svg',
      'img/cat-1.jpg',
      '',
    ]) {
      await expect(valid(path)).rejects.toThrow();
    }
  });

  it('is optional on create and can be cleared with null on update', async () => {
    await expect(run({ name: 'French' }, CreateLanguageDto)).resolves.toBeDefined();
    await expect(run({ imageUrl: null }, UpdateLanguageDto)).resolves.toBeDefined();
    await expect(run({ imageUrl: '/img/cat-2.jpg' }, UpdateLanguageDto)).resolves.toBeDefined();
  });

  it('is checked inside the wizard payload too', async () => {
    const wizard = (imageUrl: string) =>
      run({ language: { name: 'Italian', imageUrl }, levels: [] }, CreateLanguageWizardDto);
    await expect(wizard('/img/cat-1.jpg')).resolves.toBeDefined();
    await expect(wizard('https://evil.example/x.jpg')).rejects.toThrow();
  });
});

describe('site settings hero text', () => {
  it('accepts a title and subtitle, allows clearing, and bounds the length', async () => {
    await expect(
      run({ heroTitle: 'Orizzonti', heroSubtitle: 'Learn languages in Tunis' }, UpdateSiteSettingsDto),
    ).resolves.toBeDefined();
    await expect(run({ heroTitle: null, heroSubtitle: null }, UpdateSiteSettingsDto)).resolves.toBeDefined();
    await expect(run({ heroTitle: 'x'.repeat(151) }, UpdateSiteSettingsDto)).rejects.toThrow();
    await expect(run({ heroSubtitle: 'x'.repeat(301) }, UpdateSiteSettingsDto)).rejects.toThrow();
  });
});

describe('slider media for the carousel', () => {
  const setup = () => {
    const repository = { find: jest.fn().mockResolvedValue([]) };
    return { service: new MediaService(repository as never), repository };
  };

  it('the public list is active images only, newest first', async () => {
    const { service, repository } = setup();
    await service.findActive();
    expect(repository.find).toHaveBeenCalledWith({
      where: { isActive: true },
      order: { createdAt: 'DESC', id: 'DESC' },
    });
  });

  it('the admin list includes hidden images, newest first', async () => {
    const { service, repository } = setup();
    await service.findAll();
    expect(repository.find).toHaveBeenCalledWith({ order: { createdAt: 'DESC', id: 'DESC' } });
  });

  it('serves GET /media from the active list and GET /media/manage from the full list', async () => {
    const service = {
      findActive: jest.fn().mockResolvedValue([{ id: 2, isActive: true }]),
      findAll: jest.fn().mockResolvedValue([{ id: 2, isActive: true }, { id: 1, isActive: false }]),
    };
    const module = await Test.createTestingModule({
      controllers: [MediaController],
      providers: [
        { provide: MediaService, useValue: service },
        { provide: MediaUploadService, useValue: {} },
      ],
    }).compile();
    const app = module.createNestApplication();
    await app.init();

    const publicList = await request(app.getHttpServer()).get('/media').expect(200);
    expect(publicList.body).toHaveLength(1);
    const adminList = await request(app.getHttpServer()).get('/media/manage').expect(200);
    expect(adminList.body).toHaveLength(2);
    expect(service.findActive).toHaveBeenCalledTimes(1);
    expect(service.findAll).toHaveBeenCalledTimes(1);
    await app.close();
  });
});
