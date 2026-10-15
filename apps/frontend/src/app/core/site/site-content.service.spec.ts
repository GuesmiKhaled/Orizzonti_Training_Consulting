import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { SiteSettings } from '../../services/orizzonti-api.service';
import { API_BASE_URL } from '../api/api.config';
import { SKIP_ERROR_TOAST } from '../http/http-context.tokens';
import { SITE_DEFAULTS, SiteContentService } from './site-content.service';

const BASE = 'http://api.test';

const EMPTY: SiteSettings = {
  contactEmail: null,
  contactPhone: null,
  contactAddress: null,
  facebookUrl: null,
  instagramUrl: null,
  aboutText: null,
  studentsCount: null,
  coursesCount: null,
  yearsOfExperience: null,
  nextSessionDate: null,
};

describe('SiteContentService', () => {
  let http: HttpTestingController;
  let service: SiteContentService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    service = TestBed.inject(SiteContentService);
  });

  afterEach(() => http.verify());

  const load = (settings: SiteSettings) =>
    http.expectOne(`${BASE}/site-settings`).flush(settings);

  it('requests the public settings once, without an error toast', () => {
    const req = http.expectOne(`${BASE}/site-settings`);
    expect(req.request.method).toBe('GET');
    expect(req.request.context.get(SKIP_ERROR_TOAST)).toBeTrue();
    req.flush(EMPTY);
  });

  it('shows the built-in contact details while nothing is set', () => {
    load(EMPTY);
    expect(service.email()).toBe(SITE_DEFAULTS.email);
    expect(service.phone()).toBe(SITE_DEFAULTS.phone);
    expect(service.headerPhone()).toBe(SITE_DEFAULTS.headerPhone);
    expect(service.address()).toBe(SITE_DEFAULTS.address);
    expect(service.facebookUrl()).toBe(SITE_DEFAULTS.facebookUrl);
    expect(service.aboutParagraphs()).toBeNull();
    expect(service.highlights()).toEqual([]);
  });

  it('keeps the defaults when the API is unreachable', () => {
    http
      .expectOne(`${BASE}/site-settings`)
      .flush({}, { status: 500, statusText: 'Error' });
    expect(service.email()).toBe(SITE_DEFAULTS.email);
    expect(service.highlights()).toEqual([]);
  });

  it('uses the values the admin saved and trims blanks back to the defaults', () => {
    load({
      ...EMPTY,
      contactEmail: ' hello@orizzonti.tn ',
      contactPhone: '+216 70 000 000',
      contactAddress: '   ',
      facebookUrl: 'https://facebook.com/other',
    });
    expect(service.email()).toBe('hello@orizzonti.tn');
    expect(service.phone()).toBe('+216 70 000 000');
    expect(service.headerPhone()).toBe('+216 70 000 000');
    expect(service.address()).toBe(SITE_DEFAULTS.address);
    expect(service.facebookUrl()).toBe('https://facebook.com/other');
    expect(service.instagramUrl()).toBe(SITE_DEFAULTS.instagramUrl);
  });

  it('splits the About text into paragraphs', () => {
    load({ ...EMPTY, aboutText: 'First paragraph.\n\n  Second paragraph.  \n\n\nThird.' });
    expect(service.aboutParagraphs()).toEqual([
      'First paragraph.',
      'Second paragraph.',
      'Third.',
    ]);
  });

  it('lists only the highlights that are set, including zero, and the next session', () => {
    load({
      ...EMPTY,
      studentsCount: 2500,
      coursesCount: 0,
      nextSessionDate: '2026-11-01T09:00:00.000Z',
    });
    const items = service.highlights();
    expect(items.map((i) => i.label)).toEqual(['Students', 'Courses', 'Next session']);
    expect(items[0].value).toBe('2,500');
    expect(items[1].value).toBe('0');
    expect(items[2].value).toContain('2026');
  });

  it('ignores an invalid session date', () => {
    load({ ...EMPTY, nextSessionDate: 'not-a-date' });
    expect(service.highlights()).toEqual([]);
  });
});
