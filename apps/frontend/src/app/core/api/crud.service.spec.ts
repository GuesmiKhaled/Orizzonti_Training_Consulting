import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { Injectable } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from './api.config';
import { CrudService, ParentIds } from './crud.service';
import {
  ExamSessionsService,
  LanguageLevelsService,
} from './entities/language.services';

interface Thing {
  id?: number;
  name: string;
}

@Injectable()
class ThingsService extends CrudService<Thing> {
  protected path(): string {
    return 'things';
  }
}

@Injectable()
class NestedService extends CrudService<Thing> {
  protected path(parents: ParentIds): string {
    return `parents/${parents[0]}/things`;
  }
}

const BASE = 'http://api.test';

describe('CrudService', () => {
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE },
        ThingsService,
        NestedService,
      ],
    });
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  it('list does GET on the collection', () => {
    TestBed.inject(ThingsService).list().subscribe();
    const req = controller.expectOne(`${BASE}/things`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('get does GET on the item', () => {
    TestBed.inject(ThingsService).get(3).subscribe();
    const req = controller.expectOne(`${BASE}/things/3`);
    expect(req.request.method).toBe('GET');
    req.flush({ id: 3, name: 'a' });
  });

  it('create does POST with the body', () => {
    TestBed.inject(ThingsService).create({ name: 'a' }).subscribe();
    const req = controller.expectOne(`${BASE}/things`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ name: 'a' });
    req.flush({ id: 1, name: 'a' });
  });

  it('update uses PATCH with a partial body', () => {
    TestBed.inject(ThingsService).update(3, { name: 'b' }).subscribe();
    const req = controller.expectOne(`${BASE}/things/3`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ name: 'b' });
    req.flush({ id: 3, name: 'b' });
  });

  it('remove does DELETE', () => {
    TestBed.inject(ThingsService).remove(3).subscribe();
    const req = controller.expectOne(`${BASE}/things/3`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ deleted: true, id: 3 });
  });

  it('builds nested URLs from parent ids', () => {
    TestBed.inject(NestedService).update(5, { name: 'x' }, [9]).subscribe();
    const req = controller.expectOne(`${BASE}/parents/9/things/5`);
    expect(req.request.method).toBe('PATCH');
    req.flush({});
  });
});

describe('nested entity services', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE },
      ],
    });
  });

  it('LanguageLevelsService targets languages/:id/levels', () => {
    TestBed.inject(LanguageLevelsService).list([2]).subscribe();
    const req = TestBed.inject(HttpTestingController).expectOne(
      `${BASE}/languages/2/levels`,
    );
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('ExamSessionsService targets levels/:levelId/exams and registers', () => {
    const service = TestBed.inject(ExamSessionsService);
    const controller = TestBed.inject(HttpTestingController);
    service.list([2, 4]).subscribe();
    controller.expectOne(`${BASE}/languages/2/levels/4/exams`).flush([]);
    service.register(7, [2, 4], { fullName: 'A', email: 'a@b.c' }).subscribe();
    const req = controller.expectOne(
      `${BASE}/languages/2/levels/4/exams/7/register`,
    );
    expect(req.request.method).toBe('POST');
    req.flush({ id: 1, status: 'pending', message: 'ok' });
  });

  it('throws when a parent id is missing', () => {
    expect(() => TestBed.inject(LanguageLevelsService).list()).toThrowError(
      'Missing parent id for nested resource',
    );
  });
});
