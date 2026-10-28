import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { EnvironmentInjector, runInInjectionContext } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  CanActivateFn,
  CanMatchFn,
  Route,
  Router,
  UrlSegment,
  UrlTree,
  provideRouter,
} from '@angular/router';
import { Observable, firstValueFrom, isObservable, of } from 'rxjs';
import { API_BASE_URL } from '../api/api.config';
import { authGuard, permissionGuard, signedInGuard } from './auth.guards';
import { AuthService } from './auth.service';

const BASE = 'http://api.test';

describe('auth guards (cookie-based auth)', () => {
  let controller: HttpTestingController;
  let router: Router;
  let auth: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE },
      ],
    });
    controller = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    auth = TestBed.inject(AuthService);
    auth.reset();
  });

  afterEach(() => {
    controller.verify();
    auth.reset();
  });

  const run = <T>(factory: () => T): T =>
    runInInjectionContext(TestBed.inject(EnvironmentInjector), factory);

  const asObservable = (
    value: ReturnType<CanMatchFn> | ReturnType<CanActivateFn>,
  ): Observable<boolean | UrlTree> =>
    isObservable(value)
      ? (value as Observable<boolean | UrlTree>)
      : of(value as boolean | UrlTree);

  const match = (permission: string): Promise<boolean | UrlTree> => {
    const result = run(() =>
      permissionGuard(permission)({} as Route, [] as UrlSegment[]),
    );
    return firstValueFrom(asObservable(result));
  };

  const enter = (guard: CanActivateFn): Promise<boolean | UrlTree> =>
    firstValueFrom(asObservable(run(() => guard({} as never, {} as never))));

  const flushProfile = (
    profile: Record<string, unknown>,
    token = 't',
  ): void => {
    controller
      .expectOne(`${BASE}/auth/profile`)
      .flush(profile, { headers: { 'x-csrf-token': token } });
  };

  describe('signedInGuard', () => {
    it('allows when a profile is already loaded', async () => {
      (auth as any).state.set({
        id: 1,
        username: 'a',
        permissions: [],
        mustChangePassword: false,
      });
      expect(await enter(signedInGuard)).toBeTrue();
      controller.expectNone(`${BASE}/auth/profile`);
    });

    it('loads the profile and allows when authenticated', async () => {
      const pending = enter(signedInGuard);
      flushProfile({ id: 1, username: 'a', permissions: [], mustChangePassword: false });
      expect(await pending).toBeTrue();
    });

    it('redirects to /login when the profile is missing', async () => {
      const pending = enter(signedInGuard);
      controller
        .expectOne(`${BASE}/auth/profile`)
        .flush({}, { status: 401, statusText: 'Unauthorized' });
      expect(router.serializeUrl((await pending) as UrlTree)).toBe('/login');
    });
  });

  describe('authGuard', () => {
    it('allows a signed-in account that is up to date', async () => {
      const pending = enter(authGuard);
      flushProfile({ id: 1, username: 'a', permissions: [], mustChangePassword: false });
      expect(await pending).toBeTrue();
    });

    it('sends an account that must change its password to /change-password', async () => {
      const pending = enter(authGuard);
      flushProfile({ id: 1, username: 'a', permissions: [], mustChangePassword: true });
      expect(router.serializeUrl((await pending) as UrlTree)).toBe('/change-password');
    });

    it('redirects to /login when the profile cannot be loaded', async () => {
      const pending = enter(authGuard);
      controller
        .expectOne(`${BASE}/auth/profile`)
        .flush({}, { status: 500, statusText: 'Error' });
      expect(router.serializeUrl((await pending) as UrlTree)).toBe('/login');
    });
  });

  describe('permissionGuard', () => {
    it('allows a user holding the permission', async () => {
      const pending = match('manage_blog');
      flushProfile({ id: 1, username: 'a', permissions: ['manage_blog'] });
      expect(await pending).toBeTrue();
    });

    it('redirects to the forbidden page when the permission is missing', async () => {
      const pending = match('manage_users');
      flushProfile({ id: 1, username: 'a', permissions: ['manage_blog'] });
      expect(router.serializeUrl((await pending) as UrlTree)).toBe(
        '/admin/forbidden',
      );
    });

    it('redirects to /login when the profile request fails', async () => {
      const pending = match('manage_blog');
      controller
        .expectOne(`${BASE}/auth/profile`)
        .flush({}, { status: 500, statusText: 'Error' });
      expect(router.serializeUrl((await pending) as UrlTree)).toBe('/login');
    });
  });
});
