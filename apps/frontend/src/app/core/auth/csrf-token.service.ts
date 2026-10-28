import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, firstValueFrom, shareReplay } from 'rxjs';
import { API_BASE_URL } from '../api/api.config';

/** HTTP header name for the double-submit CSRF token. */
export const CSRF_HEADER = 'x-csrf-token';
const CSRF_COOKIE = 'orizzonti_csrf';

/**
 * Manages the double-submit CSRF token for the cookie-based auth flow
 * (audit finding #4). The token is read from the `orizzonti_csrf` cookie
 * (non-HttpOnly) and sent back via the `x-csrf-token` header on
 * state-changing requests.
 *
 * `ensureToken()` fetches a token from `GET /auth/csrf` once and caches it.
 * `refreshOnce()` is called by the auth interceptor on a 401 to refresh
 * both the auth cookies and the CSRF token before retrying the request.
 */
@Injectable({ providedIn: 'root' })
export class CsrfTokenService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private cachedToken: string | null = null;
  private inflight: Observable<{ token: string }> | null = null;

  get token(): string | null {
    if (this.cachedToken) {
      return this.cachedToken;
    }
    // The cookie is non-HttpOnly; read it as a fallback so a page reload
    // can recover the token without an extra request.
    const fromCookie = this.readCookie(CSRF_COOKIE);
    if (fromCookie) {
      this.cachedToken = fromCookie;
      return fromCookie;
    }
    return null;
  }

  /** Fetches a CSRF token once; subsequent calls return the cached value. */
  ensureToken(): Observable<{ token: string }> {
    if (this.cachedToken) {
      return new Observable<{ token: string }>((subscriber) => {
        subscriber.next({ token: this.cachedToken! });
        subscriber.complete();
      });
    }
    if (this.inflight) {
      return this.inflight;
    }
    this.inflight = this.http
      .get<{ token: string }>(`${this.baseUrl}/auth/csrf`, {
        withCredentials: true,
      })
      .pipe(
        // shareReplay so concurrent callers share one request
        shareReplay(1),
      );
    firstValueFrom(this.inflight)
      .then((res) => {
        this.cachedToken = res.token;
        this.inflight = null;
      })
      .catch(() => {
        this.inflight = null;
      });
    return this.inflight;
  }

  /**
   * Called by the auth interceptor on a 401: refreshes auth cookies via
   * `/auth/refresh` and re-fetches the CSRF token. Errors propagate to the
   * caller (which redirects to /login).
   */
  refreshOnce(): Observable<unknown> {
    this.cachedToken = null;
    return new Observable<unknown>((subscriber) => {
      this.http
        .post(`${this.baseUrl}/auth/refresh`, {}, { withCredentials: true })
        .subscribe({
          next: () => {
            this.ensureToken().subscribe({
              next: () => {
                subscriber.next(null);
                subscriber.complete();
              },
              error: (err) => subscriber.error(err),
            });
          },
          error: (err) => subscriber.error(err),
        });
    });
  }

  clear(): void {
    this.cachedToken = null;
    this.inflight = null;
  }

  private readCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;
    const match = document.cookie
      .split('; ')
      .find((row) => row.startsWith(`${name}=`));
    return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
  }
}
