import {
  HttpErrorResponse,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  BehaviorSubject,
  Observable,
  catchError,
  filter,
  switchMap,
  take,
  throwError,
} from 'rxjs';
import { API_BASE_URL } from '../api/api.config';
import { CSRF_HEADER } from './csrf-token.service';
import { CsrfTokenService } from './csrf-token.service';

const LOGIN_PATH = '/auth/login';
const REFRESH_PATH = '/auth/refresh';
const CSRF_PATH = '/auth/csrf';
const STATE_CHANGING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Auth interceptor for the cookie-based auth flow (audit finding #4).
 *
 * - Sends credentials (cookies) with every same-origin-ish API request via
 *   `withCredentials`.
 * - Attaches the double-submit CSRF header on state-changing requests.
 * - On a 401 from a non-login/refresh request, transparently calls
 *   `/auth/refresh` once and retries the original request; a second 401
 *   clears auth state and redirects to /login.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const baseUrl = inject(API_BASE_URL);
  const router = inject(Router);
  const csrf = inject(CsrfTokenService);

  const isApiRequest = req.url.startsWith(baseUrl);
  if (!isApiRequest) {
    return next(req);
  }

  let request = req.clone({ withCredentials: true });

  // Attach the CSRF header on state-changing requests (except the CSRF
  // bootstrap and refresh endpoints, which run before a token exists).
  const isCsrfBootstrap = req.url.endsWith(CSRF_PATH);
  const isRefresh = req.url.endsWith(REFRESH_PATH);
  if (
    STATE_CHANGING.has(req.method) &&
    !isCsrfBootstrap &&
    !isRefresh &&
    !req.headers.has(CSRF_HEADER)
  ) {
    const token = csrf.token;
    if (token) {
      request = request.clone({ setHeaders: { [CSRF_HEADER]: token } });
    }
  }

  return next(request).pipe(
    catchError((error: unknown) => {
      if (
        !(error instanceof HttpErrorResponse) ||
        error.status !== 401 ||
        req.url.endsWith(LOGIN_PATH) ||
        req.url.endsWith(REFRESH_PATH)
      ) {
        return throwError(() => error);
      }
      // 401 on a protected request: try to refresh once, then retry.
      return csrf.refreshOnce().pipe(
        switchMap(() => next(retryRequest(request, csrf))),
        catchError((retryError: unknown) => {
          csrf.clear();
          void router.navigateByUrl('/login');
          return throwError(() => retryError);
        }),
      );
    }),
  );
};

function retryRequest(
  req: HttpRequest<unknown>,
  csrf: CsrfTokenService,
): HttpRequest<unknown> {
  const token = csrf.token;
  if (!token || !STATE_CHANGING.has(req.method)) {
    return req;
  }
  return req.clone({ setHeaders: { [CSRF_HEADER]: token } });
}
