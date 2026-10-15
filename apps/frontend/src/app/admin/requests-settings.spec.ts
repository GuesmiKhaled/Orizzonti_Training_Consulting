import { HttpTestingController } from '@angular/common/http/testing';
import {
  CourseRequestItem,
  DashboardStats,
  ExamRegistrationItem,
  MailSettings,
  SiteSettings,
} from '../services/orizzonti-api.service';
import { OverviewPageComponent } from './overview/overview-page.component';
import { CourseRequestsPageComponent } from './requests/course-requests-page.component';
import { ExamRegistrationsPageComponent } from './requests/exam-registrations-page.component';
import { MailSettingsPageComponent } from './settings/mail-settings-page.component';
import {
  SiteSettingsPageComponent,
  toSiteSettingsBody,
} from './settings/site-settings-page.component';
import {
  choose,
  clickButton,
  configureHttpTesting,
  expectCall,
  mount,
  rootOf,
  typeInto,
} from './testing/admin-test-utils';

const REQUESTS: CourseRequestItem[] = [
  {
    id: 1,
    fullName: 'Sana Ben Ali',
    email: 's@x.tn',
    phone: '+216 20 000 000',
    courseName: 'Italian',
    message: 'Hello there',
    status: 'new',
    createdAt: '2026-10-10T10:00:00Z',
  },
  { id: 2, fullName: 'Omar K', email: 'o@x.tn', courseName: 'English', status: 'accepted', createdAt: '2026-10-11T10:00:00Z' },
];

const REGISTRATIONS: ExamRegistrationItem[] = [
  {
    id: 11,
    fullName: 'Leila M',
    email: 'l@x.tn',
    phone: '+216 21 111 111',
    status: 'pending',
    createdAt: '2026-10-12T10:00:00Z',
    examSessionId: 5,
    examDate: '2026-12-10T09:00:00Z',
    cefrLevel: 'B1',
    languageName: 'English',
  },
  {
    id: 12,
    fullName: 'Youssef T',
    email: 'y@x.tn',
    status: 'accepted',
    createdAt: '2026-10-13T10:00:00Z',
    examSessionId: 5,
    examDate: '2026-12-10T09:00:00Z',
    cefrLevel: 'B1',
    languageName: 'English',
  },
];

describe('CourseRequestsPageComponent', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    http = configureHttpTesting();
  });

  afterEach(() => http.verify());

  const open = () => {
    const fixture = mount(CourseRequestsPageComponent);
    expectCall(http, 'GET', '/course-requests').flush(REQUESTS);
    fixture.detectChanges();
    return fixture;
  };

  it('lists requests with status tags', () => {
    const rows = rootOf(open()).querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);
    expect(rows[0].textContent).toContain('Sana Ben Ali');
    expect(rows[0].querySelector('app-status-tag')?.textContent).toContain('new');
    expect(rows[1].querySelector('app-status-tag')?.textContent).toContain('accepted');
  });

  it('filters by status without another request', () => {
    const fixture = open();
    const root = rootOf(fixture);
    choose(root, 'select.toolbar-filter', 'Accepted');
    fixture.detectChanges();
    expect(root.querySelectorAll('tbody tr').length).toBe(1);
    expect(root.querySelector('tbody')?.textContent).toContain('Omar K');
    http.expectNone((r) => r.url.includes('course-requests'));
  });

  it('updates the status with PATCH and reloads', () => {
    const fixture = open();
    clickButton(rootOf(fixture), 'tbody tr:first-child .row-actions button', 'Review');
    const req = expectCall(http, 'PATCH', '/course-requests/1');
    expect(req.request.body).toEqual({ status: 'reviewed' });
    req.flush({});
    expectCall(http, 'GET', '/course-requests').flush(REQUESTS);
  });

  it('deletes only after confirmation', () => {
    const fixture = open();
    const root = rootOf(fixture);
    clickButton(root, 'tbody tr:first-child .row-actions button', 'Delete');
    fixture.detectChanges();
    http.expectNone((r) => r.method === 'DELETE');
    clickButton(root, 'app-confirm-dialog footer button', 'Delete');
    const deletion = expectCall(http, 'DELETE', '/course-requests/1');
    expect(deletion.request.method).toBe('DELETE');
    deletion.flush({ deleted: true, id: 1 });
    expectCall(http, 'GET', '/course-requests').flush([REQUESTS[1]]);
  });
});

describe('ExamRegistrationsPageComponent', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    http = configureHttpTesting();
  });

  afterEach(() => http.verify());

  const open = () => {
    const fixture = mount(ExamRegistrationsPageComponent);
    expectCall(http, 'GET', '/exam-registrations').flush(REGISTRATIONS);
    fixture.detectChanges();
    return fixture;
  };

  it('shows applicant, exam and status', () => {
    const row = rootOf(open()).querySelector('tbody tr');
    expect(row?.textContent).toContain('Leila M');
    expect(row?.textContent).toContain('English B1');
    expect(row?.querySelector('app-status-tag')?.textContent).toContain('pending');
  });

  it('asks the server to filter by status', () => {
    const fixture = open();
    choose(rootOf(fixture), 'select.toolbar-filter', 'Pending');
    const req = expectCall(http, 'GET', '/exam-registrations');
    expect(req.request.params.get('status')).toBe('pending');
    req.flush([REGISTRATIONS[0]]);
  });

  it('accepts a pending registration', () => {
    const fixture = open();
    clickButton(rootOf(fixture), 'tbody tr:first-child .row-actions button', 'Accept');
    const req = expectCall(http, 'PATCH', '/exam-registrations/11');
    expect(req.request.body).toEqual({ status: 'accepted' });
    req.flush({});
    expectCall(http, 'GET', '/exam-registrations').flush(REGISTRATIONS);
  });

  it('does nothing when the registration already has that status', () => {
    const fixture = open();
    clickButton(rootOf(fixture), 'tbody tr:nth-child(2) .row-actions button', 'Accept');
    expect(http.match((r) => r.method === 'PATCH').length).toBe(0);
  });

  it('deletes after confirmation', () => {
    const fixture = open();
    const root = rootOf(fixture);
    clickButton(root, 'tbody tr:first-child .row-actions button', 'Delete');
    fixture.detectChanges();
    clickButton(root, 'app-confirm-dialog footer button', 'Delete');
    const deletion = expectCall(http, 'DELETE', '/exam-registrations/11');
    expect(deletion.request.method).toBe('DELETE');
    deletion.flush({ deleted: true, id: 11 });
    expectCall(http, 'GET', '/exam-registrations').flush([REGISTRATIONS[1]]);
  });
});

describe('MailSettingsPageComponent', () => {
  let http: HttpTestingController;
  const SETTINGS: MailSettings = {
    host: 'smtp.orizzonti.tn',
    port: 587,
    username: 'info@orizzonti.tn',
    fromAddress: 'info@orizzonti.tn',
    secure: true,
    passwordConfigured: true,
  };

  beforeEach(() => {
    http = configureHttpTesting();
  });

  afterEach(() => http.verify());

  const open = () => {
    const fixture = mount(MailSettingsPageComponent);
    expectCall(http, 'GET', '/settings/mail').flush(SETTINGS);
    fixture.detectChanges();
    return { fixture, root: rootOf(fixture) };
  };

  it('prefills the form and says a password is saved without showing it', () => {
    const { root } = open();
    expect(root.querySelector<HTMLInputElement>('input[formControlName="host"]')?.value).toBe('smtp.orizzonti.tn');
    expect(root.querySelector<HTMLInputElement>('input[formControlName="port"]')?.value).toBe('587');
    expect(root.querySelector<HTMLInputElement>('input[formControlName="password"]')?.value).toBe('');
    expect(root.textContent).toContain('A password is saved');
  });

  it('keeps the stored password when the field is left empty', () => {
    const { root } = open();
    typeInto(root, 'input[formControlName="port"]', '465');
    clickButton(root, 'button[type="submit"]', 'Save mail settings');
    const req = expectCall(http, 'PATCH', '/settings/mail');
    expect(req.request.body.port).toBe(465);
    expect('password' in req.request.body).toBeFalse();
    req.flush(SETTINGS);
  });

  it('sends a new password once and clears the field afterwards', () => {
    const { fixture, root } = open();
    typeInto(root, 'input[formControlName="password"]', 'new-secret');
    clickButton(root, 'button[type="submit"]', 'Save mail settings');
    const req = expectCall(http, 'PATCH', '/settings/mail');
    expect(req.request.body.password).toBe('new-secret');
    req.flush(SETTINGS);
    fixture.detectChanges();
    expect(root.querySelector<HTMLInputElement>('input[formControlName="password"]')?.value).toBe('');
  });

  it('rejects an invalid port', () => {
    const { fixture, root } = open();
    typeInto(root, 'input[formControlName="port"]', 'abc');
    clickButton(root, 'button[type="submit"]', 'Save mail settings');
    fixture.detectChanges();
    http.expectNone((r) => r.method === 'PATCH');
    expect(root.textContent).toContain('Enter a port number');
  });
});

describe('SiteSettingsPageComponent', () => {
  let http: HttpTestingController;
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

  beforeEach(() => {
    http = configureHttpTesting();
  });

  afterEach(() => http.verify());

  const open = (settings: SiteSettings = EMPTY) => {
    const fixture = mount(SiteSettingsPageComponent);
    expectCall(http, 'GET', '/site-settings').flush(settings);
    fixture.detectChanges();
    return { fixture, root: rootOf(fixture) };
  };

  it('converts form values to the API shape: blanks become null, counts numbers, dates ISO', () => {
    const body = toSiteSettingsBody({
      heroTitle: ' Welcome ',
      heroSubtitle: '',
      contactEmail: ' info@orizzonti.tn ',
      contactPhone: '',
      contactAddress: '',
      facebookUrl: 'https://facebook.com/orizzonti.tn',
      instagramUrl: '',
      aboutText: '',
      studentsCount: '2500',
      coursesCount: '',
      yearsOfExperience: '10',
      nextSessionDate: '2026-11-01T09:00',
    });
    expect(body).toEqual({
      heroTitle: 'Welcome',
      heroSubtitle: null,
      contactEmail: 'info@orizzonti.tn',
      contactPhone: null,
      contactAddress: null,
      facebookUrl: 'https://facebook.com/orizzonti.tn',
      instagramUrl: null,
      aboutText: null,
      studentsCount: 2500,
      coursesCount: null,
      yearsOfExperience: 10,
      nextSessionDate: new Date('2026-11-01T09:00').toISOString(),
    });
  });

  it('prefills saved values including the session date in local time', () => {
    const iso = new Date(2026, 10, 1, 9, 30).toISOString();
    const { root } = open({ ...EMPTY, contactEmail: 'info@orizzonti.tn', studentsCount: 2500, nextSessionDate: iso });
    expect(root.querySelector<HTMLInputElement>('input[formControlName="contactEmail"]')?.value).toBe('info@orizzonti.tn');
    expect(root.querySelector<HTMLInputElement>('input[formControlName="studentsCount"]')?.value).toBe('2500');
    expect(root.querySelector<HTMLInputElement>('input[type="datetime-local"]')?.value).toBe('2026-11-01T09:30');
  });

  it('saves with PATCH', () => {
    const { root } = open();
    typeInto(root, 'input[formControlName="contactEmail"]', 'info@orizzonti.tn');
    typeInto(root, 'input[formControlName="studentsCount"]', '300');
    clickButton(root, 'button[type="submit"]', 'Save site settings');
    const req = expectCall(http, 'PATCH', '/site-settings');
    expect(req.request.body.contactEmail).toBe('info@orizzonti.tn');
    expect(req.request.body.studentsCount).toBe(300);
    expect(req.request.body.aboutText).toBeNull();
    expect(req.request.body.heroTitle).toBeNull();
    req.flush(EMPTY);
  });

  it('blocks invalid links, emails and counts', () => {
    const { fixture, root } = open();
    typeInto(root, 'input[formControlName="facebookUrl"]', 'javascript:alert(1)');
    typeInto(root, 'input[formControlName="contactEmail"]', 'nope');
    typeInto(root, 'input[formControlName="studentsCount"]', '12a');
    clickButton(root, 'button[type="submit"]', 'Save site settings');
    fixture.detectChanges();
    http.expectNone((r) => r.method === 'PATCH');
    expect(root.querySelectorAll('[role="alert"]').length).toBe(2);
  });
});

describe('OverviewPageComponent', () => {
  let http: HttpTestingController;
  const STATS: DashboardStats = {
    blogsCount: 18,
    coursesCount: 12,
    languagesCount: 5,
    sliderCount: 3,
    courseRequestsCount: 20,
    newCourseRequestsCount: 7,
    adminUsersCount: 4,
    requestsByCourse: [
      { name: 'Italian', count: 8 },
      { name: 'English', count: 4 },
    ],
    latestRequests: [
      { id: 1, applicant: 'Sana B.', courseName: 'Italian', status: 'new', createdAt: '2026-10-10T10:00:00Z' },
    ],
  };

  beforeEach(() => {
    http = configureHttpTesting();
  });

  afterEach(() => http.verify());

  it('shows the key figures, request bars and latest requests', () => {
    const fixture = mount(OverviewPageComponent);
    expectCall(http, 'GET', '/dashboard/stats').flush(STATS);
    fixture.detectChanges();
    const root = rootOf(fixture);

    const values = Array.from(root.querySelectorAll('app-stat-card .value')).map((v) => v.textContent);
    expect(values).toEqual(['12', '5', '18', '7', '4']);

    const bars = root.querySelectorAll<HTMLElement>('.bar');
    expect(bars[0].style.width).toBe('100%');
    expect(bars[1].style.width).toBe('50%');
    expect(root.querySelector('tbody')?.textContent).toContain('Sana B.');
  });

  it('shows empty states when there is no request data', () => {
    const fixture = mount(OverviewPageComponent);
    expectCall(http, 'GET', '/dashboard/stats').flush({ ...STATS, requestsByCourse: [], latestRequests: [] });
    fixture.detectChanges();
    expect(rootOf(fixture).textContent).toContain('No requests yet');
  });

  it('offers a retry when loading fails', () => {
    const fixture = mount(OverviewPageComponent);
    expectCall(http, 'GET', '/dashboard/stats').flush({}, { status: 500, statusText: 'Error' });
    fixture.detectChanges();
    const root = rootOf(fixture);
    expect(root.querySelector('[role="alert"]')?.textContent).toContain('Could not load');

    clickButton(root, '.link', 'Retry');
    expectCall(http, 'GET', '/dashboard/stats').flush(STATS);
    fixture.detectChanges();
    expect(root.querySelectorAll('app-stat-card').length).toBe(5);
  });
});
