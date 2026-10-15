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

const BASE = 'http://api.test';
const TOKEN_KEY = 'orizzonti-admin-token';

describe('auth guards', () => {
  let controller: HttpTestingController;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();
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
  });

  afterEach(() => {
    controller.verify();
    localStorage.clear();
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

  describe('signedInGuard', () => {
    it('allows a request with a token without loading the profile', async () => {
      localStorage.setItem(TOKEN_KEY, 't');
      expect(await enter(signedInGuard)).toBeTrue();
      controller.expectNone(`${BASE}/auth/profile`);
    });

    it('redirects anonymous users to /login', async () => {
      const result = await enter(signedInGuard);
      expect(router.serializeUrl(result as UrlTree)).toBe('/login');
    });
  });

  describe('authGuard', () => {
    it('allows a signed-in account that is up to date', async () => {
      localStorage.setItem(TOKEN_KEY, 't');
      const pending = enter(authGuard);
      controller
        .expectOne(`${BASE}/auth/profile`)
        .flush({ id: 1, username: 'a', permissions: [], mustChangePassword: false });
      expect(await pending).toBeTrue();
    });

    it('sends an account that must change its password to /change-password', async () => {
      localStorage.setItem(TOKEN_KEY, 't');
      const pending = enter(authGuard);
      controller
        .expectOne(`${BASE}/auth/profile`)
        .flush({ id: 1, username: 'a', permissions: [], mustChangePassword: true });
      expect(router.serializeUrl((await pending) as UrlTree)).toBe('/change-password');
    });

    it('redirects anonymous users to /login without a request', async () => {
      const result = await enter(authGuard);
      expect(router.serializeUrl(result as UrlTree)).toBe('/login');
    });

    it('redirects to /login when the profile cannot be loaded', async () => {
      localStorage.setItem(TOKEN_KEY, 't');
      const pending = enter(authGuard);
      controller
        .expectOne(`${BASE}/auth/profile`)
        .flush({}, { status: 500, statusText: 'Error' });
      expect(router.serializeUrl((await pending) as UrlTree)).toBe('/login');
    });
  });

  describe('permissionGuard', () => {
    it('redirects to /login without a token (no request)', async () => {
      const result = await match('manage_blog');
      expect(router.serializeUrl(result as UrlTree)).toBe('/login');
    });

    it('allows a user holding the permission', async () => {
      localStorage.setItem(TOKEN_KEY, 't');
      const pending = match('manage_blog');
      controller.expectOne(`${BASE}/auth/profile`).flush({
        id: 1,
        username: 'a',
        permissions: ['manage_blog'],
      });
      expect(await pending).toBeTrue();
    });

    it('redirects to the forbidden page when the permission is missing', async () => {
      localStorage.setItem(TOKEN_KEY, 't');
      const pending = match('manage_users');
      controller.expectOne(`${BASE}/auth/profile`).flush({
        id: 1,
        username: 'a',
        permissions: ['manage_blog'],
      });
      expect(router.serializeUrl((await pending) as UrlTree)).toBe(
        '/admin/forbidden',
      );
    });

    it('loads the profile once per token', async () => {
      localStorage.setItem(TOKEN_KEY, 't');
      const first = match('manage_blog');
      controller
        .expectOne(`${BASE}/auth/profile`)
        .flush({ id: 1, username: 'a', permissions: ['manage_blog'] });
      await first;
      expect(await match('manage_blog')).toBeTrue();
      controller.expectNone(`${BASE}/auth/profile`);
    });

    it('reloads the profile when the token changes', async () => {
      localStorage.setItem(TOKEN_KEY, 't1');
      const first = match('manage_blog');
      controller
        .expectOne(`${BASE}/auth/profile`)
        .flush({ id: 1, username: 'a', permissions: ['manage_blog'] });
      await first;

      localStorage.setItem(TOKEN_KEY, 't2');
      const second = match('manage_blog');
      controller
        .expectOne(`${BASE}/auth/profile`)
        .flush({ id: 2, username: 'b', permissions: [] });
      expect(router.serializeUrl((await second) as UrlTree)).toBe(
        '/admin/forbidden',
      );
    });

    it('redirects to /login when the profile request fails', async () => {
      localStorage.setItem(TOKEN_KEY, 't');
      const pending = match('manage_blog');
      controller
        .expectOne(`${BASE}/auth/profile`)
        .flush({}, { status: 500, statusText: 'Error' });
      expect(router.serializeUrl((await pending) as UrlTree)).toBe('/login');
    });
  });
});
