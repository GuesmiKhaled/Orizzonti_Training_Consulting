import { InjectionToken } from '@angular/core';

declare global {
  interface Window {
    __ORIZZONTI_CONFIG__?: { apiBaseUrl?: string };
  }
}

export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () =>
    (window.__ORIZZONTI_CONFIG__?.apiBaseUrl ?? 'http://localhost:5007').replace(
      /\/+$/,
      '',
    ),
});
