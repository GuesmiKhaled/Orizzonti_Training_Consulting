import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { Type, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of } from 'rxjs';
import { ADMIN_ROUTES } from './admin/admin.routes';
import { BlogEditorPageComponent } from './admin/blogs/blog-editor-page.component';
import { BlogsPageComponent } from './admin/blogs/blogs-page.component';
import { CourseFormModalComponent } from './admin/courses/course-form-modal.component';
import { CoursesPageComponent } from './admin/courses/courses-page.component';
import { LanguagesDashboardComponent } from './admin/languages/languages-dashboard.component';
import { LanguageWizardComponent } from './admin/languages/wizard/language-wizard.component';
import { MediaFormModalComponent } from './admin/media/media-form-modal.component';
import { MediaPageComponent } from './admin/media/media-page.component';
import { OverviewPageComponent } from './admin/overview/overview-page.component';
import { CourseRequestsPageComponent } from './admin/requests/course-requests-page.component';
import { ExamRegistrationsPageComponent } from './admin/requests/exam-registrations-page.component';
import { MailSettingsPageComponent } from './admin/settings/mail-settings-page.component';
import { SiteSettingsPageComponent } from './admin/settings/site-settings-page.component';
import { RolesPageComponent } from './admin/users/roles/roles-page.component';
import { UserFormModalComponent } from './admin/users/user-form-modal.component';
import { UsersPageComponent } from './admin/users/users-page.component';
import { API_BASE_URL } from './core/api/api.config';
import { AuthService } from './core/auth/auth.service';
import { AdminLoginPageComponent } from './pages/admin-login-page/admin-login-page.component';
import { ChangePasswordPageComponent } from './pages/change-password-page/change-password-page.component';
import { ContactPageComponent } from './pages/contact-page/contact-page.component';
import { a11yViolations } from './testing/a11y';

const BASE = 'http://api.test';
const PIXEL = 'data:image/gif;base64,R0lGODlhAQABAAAAACw=';
const PERMISSIONS = [
  { id: 1, name: 'manage_blog' },
  { id: 2, name: 'manage_users' },
  { id: 3, name: 'view_dashboard' },
];
const ROLES = [
  { id: 1, name: 'super-admin', description: 'Full access', permissions: PERMISSIONS },
  { id: 2, name: 'editor', description: 'Writes content', permissions: [PERMISSIONS[0]] },
];
const EXAM = {
  id: 9,
  examDate: '2026-12-10T09:00:00Z',
  registrationStartDate: '2026-11-01T09:00:00Z',
  registrationDeadline: '2026-11-30T09:00:00Z',
  bookingStatus: 'Open',
  isBookable: true,
  maxParticipants: 10,
  placesLeft: 4,
};
const LANGUAGE = {
  id: 1,
  name: 'English',
  code: 'ENG',
  isActive: true,
  levels: [{ id: 5, cefrLevel: 'A1', price: '500', courseHours: '120', examSessions: [EXAM] }],
};

/** Canned API answers keyed by path; anything else gets an empty list. */
const DATA: Record<string, unknown> = {
  '/auth/roles': ROLES,
  '/auth/permissions': PERMISSIONS,
  '/auth/users': {
    items: [
      { id: 1, username: 'admin', fullName: 'Guesmi Khaled', email: 'a@b.tn', phone: '+216 24 422 753', role: 'super-admin', roleId: 1, isActive: true },
    ],
    total: 1,
    page: 0,
    size: 10,
  },
  '/dashboard/stats': {
    blogsCount: 3, coursesCount: 4, languagesCount: 2, sliderCount: 1, courseRequestsCount: 5, newCourseRequestsCount: 2, adminUsersCount: 1,
    requestsByCourse: [{ name: 'Italian', count: 3 }],
    latestRequests: [{ id: 1, applicant: 'Sana B.', courseName: 'Italian', status: 'new', createdAt: '2026-10-10T10:00:00Z' }],
  },
  '/languages': [LANGUAGE],
  '/languages/1': LANGUAGE,
  '/blogs/manage': [{ id: 1, title: 'Nursing in Italy', slug: 'nursing', isPublished: true, createdAt: '2026-10-01T10:00:00Z' }],
  '/courses': [{ id: 3, name: 'Italian', level: 'B1', price: '500', startDate: '2026-11-02' }],
  '/media/manage': [{ id: 4, title: 'Hero', imageUrl: PIXEL, altText: 'Classroom', isActive: true }],
  '/course-requests': [{ id: 1, fullName: 'Sana Ben Ali', email: 's@x.tn', courseName: 'Italian', status: 'new', createdAt: '2026-10-10T10:00:00Z' }],
  '/exam-registrations': [{ id: 11, fullName: 'Leila M', email: 'l@x.tn', status: 'pending', createdAt: '2026-10-12T10:00:00Z', examSessionId: 9, examDate: '2026-12-10T09:00:00Z', cefrLevel: 'B1', languageName: 'English' }],
  '/settings/mail': { host: 'smtp.x.tn', port: 587, username: 'u', fromAddress: 'f@x.tn', secure: true, passwordConfigured: true },
  '/site-settings': { contactEmail: null, contactPhone: null, contactAddress: null, facebookUrl: null, instagramUrl: null, aboutText: null, studentsCount: null, coursesCount: null, yearsOfExperience: null, nextSessionDate: null },
};

describe('accessibility (axe-core)', () => {
  let http: HttpTestingController;

  const configure = (permissions: string[] = []) => {
    const profile = { id: 1, username: 'admin', role: 'super-admin', permissions };
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'admin', children: ADMIN_ROUTES }]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE },
        {
          provide: AuthService,
          useValue: {
            profile: signal(profile).asReadonly(),
            isAuthenticated: () => true,
            ensureProfile: () => of(profile),
            has: (p: string) => permissions.includes(p),
            logout: () => undefined,
          },
        },
      ],
    });
    http = TestBed.inject(HttpTestingController);
  };

  const settle = (): void => {
    for (const req of http.match(() => true)) {
      const path = new URL(req.request.url).pathname;
      req.flush(DATA[path] ?? []);
    }
  };

  const render = async <T>(type: Type<T>, inputs: Record<string, unknown> = {}, waitMs = 0) => {
    const fixture: ComponentFixture<T> = TestBed.createComponent(type);
    for (const [name, value] of Object.entries(inputs)) {
      fixture.componentRef.setInput(name, value);
    }
    document.body.appendChild(fixture.nativeElement as HTMLElement);
    fixture.detectChanges();
    if (waitMs) {
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
    settle();
    fixture.detectChanges();
    return fixture;
  };

  const audit = async (fixture: ComponentFixture<unknown>): Promise<void> => {
    const host = fixture.nativeElement as HTMLElement;
    expect(await a11yViolations(host)).toEqual([]);
    host.remove();
  };

  beforeEach(() => configure(['view_dashboard', 'manage_blog', 'manage_users', 'manage_roles']));

  it('login page', async () => audit(await render(AdminLoginPageComponent)));
  it('change-password page', async () => audit(await render(ChangePasswordPageComponent)));
  it('public contact form', async () => audit(await render(ContactPageComponent)));

  it('admin shell with the overview (sidebar, top bar, breadcrumbs, landmarks)', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/admin/overview');
    settle();
    harness.fixture.detectChanges();
    const host = harness.fixture.nativeElement as HTMLElement;
    expect(await a11yViolations(host, { rules: { region: { enabled: true } } })).toEqual([]);
  });

  it('overview', async () => audit(await render(OverviewPageComponent)));
  it('users table', async () => audit(await render(UsersPageComponent, {}, 300)));
  it('add-user modal', async () => audit(await render(UserFormModalComponent, { user: null, roles: ROLES })));
  it('roles and permissions', async () => audit(await render(RolesPageComponent)));
  it('languages dashboard', async () => audit(await render(LanguagesDashboardComponent)));
  it('language wizard (create)', async () => audit(await render(LanguageWizardComponent)));
  it('language wizard (edit)', async () => audit(await render(LanguageWizardComponent, { languageId: 1, initialStep: 1 })));
  it('blogs table', async () => audit(await render(BlogsPageComponent)));
  it('blog editor', async () => audit(await render(BlogEditorPageComponent)));
  it('courses table', async () => audit(await render(CoursesPageComponent)));
  it('course modal', async () => audit(await render(CourseFormModalComponent, { course: null })));
  it('slider media grid', async () => audit(await render(MediaPageComponent)));
  it('slider media modal', async () => audit(await render(MediaFormModalComponent, { item: null })));
  it('course requests', async () => audit(await render(CourseRequestsPageComponent)));
  it('exam registrations', async () => audit(await render(ExamRegistrationsPageComponent)));
  it('mail settings', async () => audit(await render(MailSettingsPageComponent)));
  it('site settings', async () => audit(await render(SiteSettingsPageComponent)));
});
