import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of } from 'rxjs';
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
      { provide: AuthService, useValue: fakeAuth },
    ],
  });
  return fakeAuth;
}

describe('admin routes', () => {
  it('redirects /admin to the overview inside the layout', async () => {
    setup(['view_dashboard']);
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/admin');
    expect(TestBed.inject(Router).url).toBe('/admin/overview');
    const el: HTMLElement = harness.routeNativeElement as HTMLElement;
    expect(el.querySelector('h1')?.textContent).toContain('Overview');
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
    const crumbs: HTMLElement = harness.fixture.nativeElement;
    const text = crumbs.querySelector('app-admin-breadcrumbs')?.textContent ?? '';
    expect(text.replace(/\s+/g, '')).toContain('Home/Users/Affiliationroles');
  });

  it('redirects to the forbidden page without the permission', async () => {
    setup(['manage_blog']);
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/admin/users');
    expect(TestBed.inject(Router).url).toBe('/admin/forbidden');
    const el: HTMLElement = harness.routeNativeElement as HTMLElement;
    expect(el.querySelector('app-forbidden')?.textContent).toContain(
      'Access denied',
    );
  });

  it('deep-links placeholders to the classic dashboard section', async () => {
    setup(['manage_blog']);
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/admin/blogs');
    const link = (harness.routeNativeElement as HTMLElement).querySelector(
      'app-section-placeholder a',
    );
    expect(link?.getAttribute('href')).toBe('/admin/legacy?section=blogs');
  });
});
