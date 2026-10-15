import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  TestRequest,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '../../../core/api/api.config';
import { LanguageItem } from '../../../services/orizzonti-api.service';
import { LanguageWizardSaveService } from './language-wizard-save.service';
import { LanguageWizardStore } from './language-wizard.store';

const BASE = 'http://api.test';

const exam = (id: number) => ({
  id,
  examDate: new Date(2026, 11, 10, 9, 0).toISOString(),
  registrationStartDate: new Date(2026, 10, 1, 9, 0).toISOString(),
  registrationDeadline: new Date(2026, 10, 30, 9, 0).toISOString(),
  isActive: true,
});

const LANGUAGE: LanguageItem = {
  id: 7,
  name: 'English',
  code: 'ENG',
  isActive: true,
  levels: [
    { id: 11, cefrLevel: 'A1', price: '500', courseHours: '120', isActive: true, examSessions: [exam(1)] },
  ],
};

describe('LanguageWizardSaveService', () => {
  let service: LanguageWizardSaveService;
  let store: LanguageWizardStore;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE },
        LanguageWizardStore,
      ],
    });
    service = TestBed.inject(LanguageWizardSaveService);
    store = TestBed.inject(LanguageWizardStore);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  const expectCall = (method: string, url: string): TestRequest => {
    const req = http.expectOne((r) => r.method === method && r.url === `${BASE}${url}`);
    return req;
  };

  it('creates a language with a single transactional request', () => {
    store.load(null);
    store.languageForm.controls.name.setValue('French');
    store.addLevel();
    let result: LanguageItem | undefined;
    service.create(store).subscribe((l) => (result = l));

    const req = expectCall('POST', '/languages/wizard');
    expect(req.request.body.language.name).toBe('French');
    expect(req.request.body.levels.length).toBe(1);
    req.flush({ id: 3, name: 'French' });
    expect(result?.id).toBe(3);
  });

  it('sends nothing when there are no changes', () => {
    store.load(LANGUAGE);
    let completed = false;
    service.saveEdit(store).subscribe({ complete: () => (completed = true) });
    http.expectNone(() => true);
    expect(completed).toBeTrue();
  });

  it('patches only changed entities, in dependency order', () => {
    store.load(LANGUAGE);
    store.languageForm.controls.name.setValue('British English');
    store.levels()[0].form.controls.price.setValue('550');
    store.exams()[0].form.controls.maxParticipants.setValue('30');

    let completed = false;
    service.saveEdit(store).subscribe({ complete: () => (completed = true) });

    const language = expectCall('PATCH', '/languages/7');
    expect(language.request.body).toEqual({ name: 'British English' });
    language.flush({});

    const level = expectCall('PATCH', '/languages/7/levels/11');
    expect(level.request.body).toEqual({ price: '550' });
    level.flush({});

    const examReq = expectCall('PATCH', '/languages/7/levels/11/exams/1');
    expect(examReq.request.body).toEqual({ maxParticipants: 30 });
    examReq.flush({});

    expect(completed).toBeTrue();
    expect(store.totalChanges()).toBe(0);
  });

  it('creates a new level first and then its exams under the new level id', () => {
    store.load(LANGUAGE);
    const level = store.addLevel('B1');
    level.form.patchValue({ courseHours: '90', price: '600' });
    store.addExam(level.key).form.patchValue({
      examDate: '2026-12-20T09:00',
      registrationStartDate: '2026-11-01T09:00',
      registrationDeadline: '2026-11-30T09:00',
    });

    service.saveEdit(store).subscribe();

    const levelReq = expectCall('POST', '/languages/7/levels');
    expect(levelReq.request.body.cefrLevel).toBe('B1');
    levelReq.flush({ id: 55, cefrLevel: 'B1' });

    const examReq = expectCall('POST', '/languages/7/levels/55/exams');
    expect(examReq.request.body.examDate).toBe(new Date('2026-12-20T09:00').toISOString());
    examReq.flush({ id: 90 });

    expect(store.totalChanges()).toBe(0);
    expect(store.levelIdFor(level.key)).toBe(55);
  });

  it('stops at the first failure and a retry sends only what is left', () => {
    store.load(LANGUAGE);
    store.languageForm.controls.name.setValue('British English');
    store.levels()[0].form.controls.price.setValue('550');

    let failed = false;
    service.saveEdit(store).subscribe({ error: () => (failed = true) });
    expectCall('PATCH', '/languages/7').flush({}); // language saved
    expectCall('PATCH', '/languages/7/levels/11').flush(
      { message: 'boom' },
      { status: 500, statusText: 'Error' },
    );
    expect(failed).toBeTrue();
    expect(store.totalChanges()).toBe(1);

    service.saveEdit(store).subscribe();
    http.expectNone(`${BASE}/languages/7`);
    const retry = expectCall('PATCH', '/languages/7/levels/11');
    expect(retry.request.body).toEqual({ price: '550' });
    retry.flush({});
    expect(store.totalChanges()).toBe(0);
  });
});
