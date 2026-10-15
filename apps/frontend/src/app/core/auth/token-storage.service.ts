import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TokenStorage {
  private readonly tokenKey = 'orizzonti-admin-token';
  private readonly profileKey = 'orizzonti-admin-profile';

  get token(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  clear(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.profileKey);
  }
}
