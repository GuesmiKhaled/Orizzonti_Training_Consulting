import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of, tap } from 'rxjs';
import { AuthUser } from '../../services/orizzonti-api.service';
import { API_BASE_URL } from '../api/api.config';
import { SKIP_ERROR_TOAST } from '../http/http-context.tokens';
import { CsrfTokenService } from './csrf-token.service';

/**
 * Auth service for the cookie-based auth flow (audit finding #4). The access
 * and refresh tokens live in httpOnly cookies set by the backend, so this
 * service no longer touches localStorage. Auth state is derived from the
 * `/auth/profile` response; `isAuthenticated()` is now async via
 * `ensureProfile()`.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly router = inject(Router);
  private readonly csrf = inject(CsrfTokenService);

  private readonly state = signal<AuthUser | null>(null);

  readonly profile = this.state.asReadonly();
  readonly permissions = computed(() => this.state()?.permissions ?? []);

  /**
   * True only when a profile has been loaded. Guards use this instead of a
   * token check since the token is no longer readable from JS.
   */
  isAuthenticated(): boolean {
    return this.state() !== null;
  }

  has(permission: string): boolean {
    return this.permissions().includes(permission);
  }

  /** Loads the profile once per session; cached until logout. */
  ensureProfile(): Observable<AuthUser | null> {
    const current = this.state();
    if (current) {
      return of(current);
    }
    return this.http.get<AuthUser>(`${this.baseUrl}/auth/profile`, {
      withCredentials: true,
    }).pipe(
      tap((profile) => {
        this.state.set(profile);
      }),
    );
  }

  /**
   * Sets a new password. The page shows the server's message itself, so no toast.
   * The cached profile is dropped so the cleared "must change" flag is re-read.
   */
  changePassword(
    currentPassword: string,
    newPassword: string,
  ): Observable<{ success: boolean }> {
    return this.http
      .post<{ success: boolean }>(
        `${this.baseUrl}/auth/change-password`,
        { currentPassword, newPassword },
        {
          withCredentials: true,
          context: new HttpContext().set(SKIP_ERROR_TOAST, true),
        },
      )
      .pipe(tap(() => this.reset()));
  }

  logout(): void {
    // Call the backend to clear cookies; fire-and-forget.
    this.http
      .post(`${this.baseUrl}/auth/logout`, {}, { withCredentials: true })
      .subscribe({ error: () => undefined });
    this.csrf.clear();
    this.reset();
    void this.router.navigateByUrl('/login');
  }

  /** Clears in-memory auth state (used on 401 / logout). */
  reset(): void {
    this.state.set(null);
  }
}
