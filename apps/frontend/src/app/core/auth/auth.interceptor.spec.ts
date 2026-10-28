import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { API_BASE_URL } from '../api/api.config';
import { CsrfTokenService } from './csrf-token.service';
import { authInterceptor } from './auth.interceptor';

const BASE = 'http://api.test';

describe('authInterceptor (cookie-based auth)', () => {
  let http: HttpClient;
  let controller: HttpTestingController;
  let navigate: jasmine.Spy;
  let csrf: CsrfTokenService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE },
      ],
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
    navigate = spyOn(TestBed.inject(Router), 'navigateByUrl').and.resolveTo(true);
    csrf = TestBed.inject(CsrfTokenService);
    csrf.clear();
  });

  afterEach(() => {
    controller.verify();
    csrf.clear();
  });

  it('sends withCredentials on API requests', () => {
    http.get(`${BASE}/blogs`).subscribe();
    const req = controller.expectOne(`${BASE}/blogs`);
    expect(req.request.withCredentials).toBeTrue();
    req.flush([]);
  });

  it('does not send withCredentials to other origins', () => {
    http.get('https://example.org/data').subscribe();
    const req = controller.expectOne('https://example.org/data');
    expect(req.request.withCredentials).toBeFalse();
    req.flush({});
  });

  it('attaches the CSRF header on POST when a token is available', () => {
    (csrf as any).cachedToken = 'csrf-abc';
    http.post(`${BASE}/blogs`, {}).subscribe();
    const req = controller.expectOne(`${BASE}/blogs`);
    expect(req.request.headers.get('x-csrf-token')).toBe('csrf-abc');
    req.flush({});
  });

  it('does not attach the CSRF header on GET', () => {
    (csrf as any).cachedToken = 'csrf-abc';
    http.get(`${BASE}/blogs`).subscribe();
    const req = controller.expectOne(`${BASE}/blogs`);
    expect(req.request.headers.has('x-csrf-token')).toBeFalse();
    req.flush([]);
  });

  it('keeps an existing CSRF header that is already set', () => {
    (csrf as any).cachedToken = 'csrf-abc';
    http
      .post(`${BASE}/blogs`, {}, { headers: { 'x-csrf-token': 'manual' } })
      .subscribe();
    const req = controller.expectOne(`${BASE}/blogs`);
    expect(req.request.headers.get('x-csrf-token')).toBe('manual');
    req.flush({});
  });

  it('does not redirect on a 401 from the login request', () => {
    http.post(`${BASE}/auth/login`, {}).subscribe({ error: () => undefined });
    controller
      .expectOne(`${BASE}/auth/login`)
      .flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(navigate).not.toHaveBeenCalled();
  });

  it('ignores 401 responses from other origins', () => {
    http.get('https://example.org/x').subscribe({ error: () => undefined });
    controller
      .expectOne('https://example.org/x')
      .flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(navigate).not.toHaveBeenCalled();
  });

  it('transparently refreshes and retries on a 401 from a protected request', () => {
    (csrf as any).cachedToken = 'csrf-abc';
    http.get(`${BASE}/auth/users`).subscribe({
      next: () => undefined,
      error: () => undefined,
    });
    // First request returns 401.
    controller
      .expectOne(`${BASE}/auth/users`)
      .flush({}, { status: 401, statusText: 'Unauthorized' });
    // Interceptor calls /auth/refresh.
    controller.expectOne(`${BASE}/auth/refresh`).flush({});
    // Then re-fetches the CSRF token.
    controller.expectOne(`${BASE}/auth/csrf`).flush({ token: 'csrf-new' });
    // Then retries the original request.
    const retry = controller.expectOne(`${BASE}/auth/users`);
    retry.flush([]);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('redirects to /login when refresh also fails', () => {
    http.get(`${BASE}/auth/users`).subscribe({ error: () => undefined });
    controller
      .expectOne(`${BASE}/auth/users`)
      .flush({}, { status: 401, statusText: 'Unauthorized' });
    controller
      .expectOne(`${BASE}/auth/refresh`)
      .flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(navigate).toHaveBeenCalledWith('/login');
  });
});
