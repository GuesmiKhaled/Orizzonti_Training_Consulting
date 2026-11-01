import {
  HttpErrorResponse,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, of, switchMap, throwError } from 'rxjs';
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
 * - Sends credentials (cookies) with every API request via `withCredentials`.
 * - Proactively fetches a CSRF token before the first state-changing request
 *   (the token is not issued at login; it is only set by GET /auth/csrf).
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

  const isCsrfBootstrap = req.url.endsWith(CSRF_PATH);
  const isRefresh = req.url.endsWith(REFRESH_PATH);
  const isLogin = req.url.endsWith(LOGIN_PATH);
  const needsCsrf =
    STATE_CHANGING.has(req.method) &&
    !isCsrfBootstrap &&
    !isRefresh &&
    !isLogin;

  // Build the outgoing request: always send credentials, and attach the
  // double-submit CSRF header on state-changing requests when a token is
  // available (and the caller hasn't set one manually).
  const buildRequest = (): HttpRequest<unknown> => {
    let request = req.clone({ withCredentials: true });
    if (needsCsrf && !req.headers.has(CSRF_HEADER) && csrf.token) {
      request = request.clone({ setHeaders: { [CSRF_HEADER]: csrf.token } });
    }
    return request;
  };

  // Proactively fetch a CSRF token before the first state-changing request
  // if none is cached. The token is not issued at login; it is only set by
  // GET /auth/csrf. Without this, the first POST after login gets a 401 and
  // relies on the retry path below, which adds a round-trip and is fragile.
  // Errors are swallowed so the request proceeds and the 401 handler below
  // can deal with auth issues.
  const ensureCsrf: Observable<unknown> =
    needsCsrf && !csrf.token && !req.headers.has(CSRF_HEADER)
      ? csrf.ensureToken().pipe(catchError(() => of(null)))
      : of(null);

  return ensureCsrf.pipe(
    switchMap(() => next(buildRequest())),
    catchError((error: unknown) => {
      if (
        !(error instanceof HttpErrorResponse) ||
        error.status !== 401 ||
        isLogin ||
        isRefresh
      ) {
        return throwError(() => error);
      }
      // 401 on a protected request: try to refresh once, then retry.
      return csrf.refreshOnce().pipe(
        switchMap(() => next(buildRequest())),
        catchError((retryError: unknown) => {
          csrf.clear();
          void router.navigateByUrl('/login');
          return throwError(() => retryError);
        }),
      );
    }),
  );
};
