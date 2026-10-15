import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { API_BASE_URL } from '../api/api.config';
import { authInterceptor } from './auth.interceptor';

const BASE = 'http://api.test';
const TOKEN_KEY = 'orizzonti-admin-token';

describe('authInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;
  let navigate: jasmine.Spy;

  beforeEach(() => {
    localStorage.clear();
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
  });

  afterEach(() => {
    controller.verify();
    localStorage.clear();
  });

  it('attaches the bearer token to API requests', () => {
    localStorage.setItem(TOKEN_KEY, 'abc');
    http.get(`${BASE}/blogs`).subscribe();
    const req = controller.expectOne(`${BASE}/blogs`);
    expect(req.request.headers.get('Authorization')).toBe('Bearer abc');
    req.flush([]);
  });

  it('sends no header when there is no token', () => {
    http.get(`${BASE}/blogs`).subscribe();
    const req = controller.expectOne(`${BASE}/blogs`);
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush([]);
  });

  it('never sends the token to other origins', () => {
    localStorage.setItem(TOKEN_KEY, 'abc');
    http.get('https://example.org/data').subscribe();
    const req = controller.expectOne('https://example.org/data');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  it('keeps an Authorization header that is already set', () => {
    localStorage.setItem(TOKEN_KEY, 'abc');
    http
      .get(`${BASE}/blogs`, { headers: { Authorization: 'Bearer manual' } })
      .subscribe();
    const req = controller.expectOne(`${BASE}/blogs`);
    expect(req.request.headers.get('Authorization')).toBe('Bearer manual');
    req.flush([]);
  });

  it('clears the token and redirects to /login on 401', () => {
    localStorage.setItem(TOKEN_KEY, 'abc');
    http.get(`${BASE}/auth/users`).subscribe({ error: () => undefined });
    controller
      .expectOne(`${BASE}/auth/users`)
      .flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(navigate).toHaveBeenCalledWith('/login');
  });

  it('does not redirect when the login request itself returns 401', () => {
    http.post(`${BASE}/auth/login`, {}).subscribe({ error: () => undefined });
    controller
      .expectOne(`${BASE}/auth/login`)
      .flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(navigate).not.toHaveBeenCalled();
  });

  it('ignores 401 responses from other origins', () => {
    localStorage.setItem(TOKEN_KEY, 'abc');
    http.get('https://example.org/x').subscribe({ error: () => undefined });
    controller
      .expectOne('https://example.org/x')
      .flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(localStorage.getItem(TOKEN_KEY)).toBe('abc');
    expect(navigate).not.toHaveBeenCalled();
  });
});
