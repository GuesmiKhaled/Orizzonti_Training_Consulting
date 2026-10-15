import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import {
  DashboardStats,
  SiteSettings,
} from '../../../services/orizzonti-api.service';
import { API_BASE_URL } from '../api.config';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  stats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.baseUrl}/dashboard/stats`);
  }
}

/** Singleton resource: GET is public, PATCH needs `manage_site_settings`. */
@Injectable({ providedIn: 'root' })
export class SiteSettingsService {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(API_BASE_URL)}/site-settings`;

  get(): Observable<SiteSettings> {
    return this.http.get<SiteSettings>(this.url);
  }

  save(settings: Partial<SiteSettings>): Observable<SiteSettings> {
    return this.http.patch<SiteSettings>(this.url, settings);
  }
}

/** Uploads one image (multipart field `file`) and resolves to its public URL. */
@Injectable({ providedIn: 'root' })
export class UploadService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  uploadImage(file: File): Observable<string> {
    const body = new FormData();
    body.append('file', file);
    return this.http
      .post<{ url: string }>(`${this.baseUrl}/media/upload`, body)
      .pipe(map((response) => response.url));
  }
}
