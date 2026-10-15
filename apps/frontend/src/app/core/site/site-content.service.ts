import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { LanguageItem, SiteSettings } from '../../services/orizzonti-api.service';
import { API_BASE_URL } from '../api/api.config';
import { SKIP_ERROR_TOAST } from '../http/http-context.tokens';

/** Shown whenever the admin has not filled a field in (or the API is unreachable). */
export const SITE_DEFAULTS = {
  heroTitle: 'Orizzonti',
  heroSubtitle:
    'Italian language classes, communication skills, and courses in other languages.',
  email: 'info@orizzonti.tn',
  headerPhone: '+216 24 422 753 · +216 36 239 750',
  phone: '+216 24 422 753',
  address: '6 rue Lucie Faure en plein centre ville en face du Jardin Le Passage.',
  facebookUrl: 'https://www.facebook.com/orizzonti.tn',
  instagramUrl: 'https://www.instagram.com/Orizzonti_tn',
} as const;

export interface Highlight {
  readonly label: string;
  readonly value: string;
}

const SESSION_DATE = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const text = (value: string | null | undefined): string | null => value?.trim() || null;

/** Public website content edited under Admin > Settings > Site settings. */
@Injectable({ providedIn: 'root' })
export class SiteContentService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly settings = signal<SiteSettings | null>(null);
  private readonly languages = signal<readonly LanguageItem[]>([]);

  readonly heroTitle = computed(() => text(this.settings()?.heroTitle) ?? SITE_DEFAULTS.heroTitle);
  readonly heroSubtitle = computed(
    () => text(this.settings()?.heroSubtitle) ?? SITE_DEFAULTS.heroSubtitle,
  );

  /** Active languages for the footer list; empty until loaded (the footer then keeps its built-in list). */
  readonly footerLanguages = computed(() =>
    this.languages()
      .filter((language) => language.isActive !== false && language.id !== undefined)
      .map((language) => ({
        id: language.id as number,
        label: language.nativeName?.trim() || language.name,
      })),
  );

  readonly email = computed(() => text(this.settings()?.contactEmail) ?? SITE_DEFAULTS.email);
  readonly headerPhone = computed(
    () => text(this.settings()?.contactPhone) ?? SITE_DEFAULTS.headerPhone,
  );
  readonly phone = computed(() => text(this.settings()?.contactPhone) ?? SITE_DEFAULTS.phone);
  readonly address = computed(
    () => text(this.settings()?.contactAddress) ?? SITE_DEFAULTS.address,
  );
  readonly facebookUrl = computed(
    () => text(this.settings()?.facebookUrl) ?? SITE_DEFAULTS.facebookUrl,
  );
  readonly instagramUrl = computed(
    () => text(this.settings()?.instagramUrl) ?? SITE_DEFAULTS.instagramUrl,
  );

  /** Paragraphs of the About text, or null to keep the built-in wording. */
  readonly aboutParagraphs = computed<string[] | null>(() => {
    const about = text(this.settings()?.aboutText);
    if (!about) {
      return null;
    }
    return about
      .split(/\n\s*\n/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean);
  });

  /** Only the figures the admin filled in; empty when none are set. */
  readonly highlights = computed<Highlight[]>(() => {
    const s = this.settings();
    if (!s) {
      return [];
    }
    const items: Highlight[] = [];
    const number = (label: string, value: number | null) => {
      if (value !== null && value !== undefined) {
        items.push({ label, value: value.toLocaleString('en-GB') });
      }
    };
    number('Students', s.studentsCount);
    number('Courses', s.coursesCount);
    number('Years of experience', s.yearsOfExperience);
    const next = s.nextSessionDate ? new Date(s.nextSessionDate) : null;
    if (next && !Number.isNaN(next.getTime())) {
      items.push({ label: 'Next session', value: SESSION_DATE.format(next) });
    }
    return items;
  });

  constructor() {
    this.load();
  }

  private load(): void {
    const context = new HttpContext().set(SKIP_ERROR_TOAST, true);
    this.http.get<SiteSettings>(`${this.baseUrl}/site-settings`, { context }).subscribe({
      next: (settings) => this.settings.set(settings),
      error: () => this.settings.set(null),
    });
    this.http.get<LanguageItem[]>(`${this.baseUrl}/languages`, { context }).subscribe({
      next: (languages) => this.languages.set(languages),
      error: () => this.languages.set([]),
    });
  }
}
