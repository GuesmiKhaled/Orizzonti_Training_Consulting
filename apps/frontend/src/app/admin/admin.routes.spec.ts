import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of } from 'rxjs';
import { API_BASE_URL } from '../core/api/api.config';
import { AuthService } from '../core/auth/auth.service';
import { AuthUser } from '../services/orizzonti-api.service';
import { ADMIN_ROUTES } from './admin.routes';

function setup(permissions: string[]) {
  const profile: AuthUser = {
    id: 1,
    username: 'admin',
    role: 'super-admin',
    permissions,
  };
  const fakeAuth = {
    profile: signal(profile).asReadonly(),
    isAuthenticated: () => true,
    ensureProfile: () => of(profile),
    has: (permission: string) => permissions.includes(permission),
    logout: jasmine.createSpy('logout'),
  };
  TestBed.configureTestingModule({
    providers: [
      provideRouter([{ path: 'admin', children: ADMIN_ROUTES }]),
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: API_BASE_URL, useValue: 'http://api.test' },
      { provide: AuthService, useValue: fakeAuth },
    ],
  });
  return fakeAuth;
}

const text = (element: Element | null): string =>
  (element?.textContent ?? '').replace(/\s+/g, '');

describe('admin routes', () => {
  it('redirects /admin to the overview inside the layout', async () => {
    setup(['view_dashboard']);
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/admin');
    expect(TestBed.inject(Router).url).toBe('/admin/overview');
    const el: HTMLElement = harness.routeNativeElement as HTMLElement;
    expect(el.querySelector('app-overview-page h1')?.textContent).toContain('Overview');
  });

  it('shows only permitted entries in the sidebar', async () => {
    setup(['manage_blog']);
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/admin/blogs');
    const root: HTMLElement = harness.fixture.nativeElement;
    const sidebar = root.querySelector('app-admin-sidebar')?.textContent ?? '';
    expect(sidebar).toContain('Blogs');
    expect(sidebar).not.toContain('Mail settings');
    expect(sidebar).not.toContain('Users list');
  });

  it('builds breadcrumbs for nested sections', async () => {
    setup(['manage_roles']);
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/admin/users/roles');
    const root: HTMLElement = harness.fixture.nativeElement;
    expect(text(root.querySelector('app-admin-breadcrumbs'))).toContain('Home/Users/Affiliationroles');
  });

  it('shows list pages without repeating the group crumb', async () => {
    setup(['manage_blog']);
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/admin/blogs');
    const root: HTMLElement = harness.fixture.nativeElement;
    expect(text(root.querySelector('app-admin-breadcrumbs'))).toBe('Home/Blogs');
    expect(root.querySelector('app-blogs-page')).not.toBeNull();
  });

  it('routes /admin/blogs/new and /admin/blogs/:id to the editor', async () => {
    setup(['manage_blog']);
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/admin/blogs/new');
    const root: HTMLElement = harness.fixture.nativeElement;
    expect(root.querySelector('app-blog-editor-page')).not.toBeNull();
    expect(text(root.querySelector('app-admin-breadcrumbs'))).toBe('Home/Blogs/Newpost');

    await harness.navigateByUrl('/admin/blogs/12');
    expect(root.querySelector('app-blog-editor-page')).not.toBeNull();
    expect(text(root.querySelector('app-admin-breadcrumbs'))).toBe('Home/Blogs/Editpost');
  });

  it('opens the right page for each migrated section', async () => {
    const all = [
      'manage_users', 'manage_roles', 'manage_courses', 'manage_languages', 'manage_media',
      'manage_course_requests', 'manage_mail_settings', 'manage_site_settings',
    ];
    setup(all);
    const harness = await RouterTestingHarness.create();
    const root: HTMLElement = harness.fixture.nativeElement;
    const pages: Record<string, string> = {
      '/admin/users': 'app-users-page',
      '/admin/courses': 'app-courses-page',
      '/admin/languages': 'app-languages-dashboard',
      '/admin/languages/registrations': 'app-exam-registrations-page',
      '/admin/media': 'app-media-page',
      '/admin/requests': 'app-course-requests-page',
      '/admin/settings/mail': 'app-mail-settings-page',
      '/admin/settings/site': 'app-site-settings-page',
    };
    for (const [url, selector] of Object.entries(pages)) {
      await harness.navigateByUrl(url);
      expect(root.querySelector(selector)).withContext(url).not.toBeNull();
    }
  });

  it('keeps Mass import as a placeholder', async () => {
    setup(['manage_users']);
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/admin/users/import');
    const root: HTMLElement = harness.fixture.nativeElement;
    expect(root.querySelector('app-section-placeholder')?.textContent).toContain('not available yet');
  });

  it('redirects to the forbidden page without the permission', async () => {
    setup(['manage_blog']);
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/admin/users');
    expect(TestBed.inject(Router).url).toBe('/admin/forbidden');
    const el: HTMLElement = harness.routeNativeElement as HTMLElement;
    expect(el.querySelector('app-forbidden')?.textContent).toContain('Access denied');
  });

  it('requires the dedicated permission for site settings', async () => {
    setup(['manage_mail_settings']);
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/admin/settings/site');
    expect(TestBed.inject(Router).url).toBe('/admin/forbidden');
  });
});
