import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of, tap } from 'rxjs';
import { AuthUser } from '../../services/orizzonti-api.service';
import { API_BASE_URL } from '../api/api.config';
import { TokenStorage } from './token-storage.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly tokens = inject(TokenStorage);
  private readonly router = inject(Router);

  private loadedForToken: string | null = null;
  private readonly state = signal<AuthUser | null>(null);

  readonly profile = this.state.asReadonly();
  readonly permissions = computed(() => this.state()?.permissions ?? []);

  isAuthenticated(): boolean {
    return !!this.tokens.token;
  }

  has(permission: string): boolean {
    return this.permissions().includes(permission);
  }

  /** Loads the profile once per token, so a new login never reuses stale permissions. */
  ensureProfile(): Observable<AuthUser | null> {
    const token = this.tokens.token;
    if (!token) {
      this.reset();
      return of(null);
    }
    const current = this.state();
    if (current && this.loadedForToken === token) {
      return of(current);
    }
    return this.http.get<AuthUser>(`${this.baseUrl}/auth/profile`).pipe(
      tap((profile) => {
        this.loadedForToken = token;
        this.state.set(profile);
      }),
    );
  }

  logout(): void {
    this.tokens.clear();
    this.reset();
    void this.router.navigateByUrl('/login');
  }

  private reset(): void {
    this.loadedForToken = null;
    this.state.set(null);
  }
}
