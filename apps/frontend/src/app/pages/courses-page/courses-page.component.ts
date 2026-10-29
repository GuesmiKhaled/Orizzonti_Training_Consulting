import { Component, ChangeDetectionStrategy, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  OrizzontiApiService,
  LanguageItem,
} from '../../services/orizzonti-api.service';

@Component({
  selector: 'app-courses-page',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="page-hero">
      <div class="container">
        <h1>Languages</h1>
        <nav class="breadcrumb" aria-label="Breadcrumb">
          <a routerLink="/">Home</a>
          <span class="sep" aria-hidden="true">/</span>
          <span aria-current="page">Languages</span>
        </nav>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="section-header">
          <p class="section-kicker">Languages</p>
          <h2 class="section-title">Our Language Courses</h2>
        </div>

        @if (loading()) {
          <div class="state-text">Loading languages...</div>
        } @else if (error()) {
          <div class="state-error" role="alert">{{ error() }}</div>
        } @else if (languages().length > 0) {
          <div class="languages-grid">
            @for (language of languages(); track language.id) {
              <a [routerLink]="['/languages', language.id]" class="language-card">
                <div class="language-banner">
                  <h3>{{ language.name }}</h3>
                  @if (language.nativeName) {
                    <p class="native-name">{{ language.nativeName }}</p>
                  }
                </div>
                <div class="language-body">
                  <h4>{{ language.name }}</h4>
                  <p class="calendar-hint">
                    <svg viewBox="0 0 24 24" class="hint-icon" aria-hidden="true"><path fill="currentColor" d="M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2zm0 2v2h14V5H5zm0 4v10h14V9H5z"/></svg>
                    View exam calendar
                  </p>
                </div>
              </a>
            }
          </div>
        } @else {
          <div class="state-info">No languages available at the moment.</div>
        }

        <div class="section-action">
          <a routerLink="/contact" class="btn-primary">Contact us about courses</a>
        </div>
      </div>
    </section>
  `,
  styles: `
    :host { display: block; }
    .container { max-width: 1140px; margin: 0 auto; padding: 0 1.5rem; }
    .section { padding: 3.5rem 0; background: var(--adm-surface, #fff); }

    .page-hero {
      background: linear-gradient(135deg, var(--adm-primary, #0a5cbd), var(--adm-primary-dark, #084a99));
      padding: 4rem 0;
    }
    .page-hero h1 { color: #fff; font-size: clamp(2rem, 4vw, 2.5rem); margin: 0 0 0.5rem; }
    .breadcrumb { display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; }
    .breadcrumb a { color: rgba(255,255,255,0.85); text-decoration: none; }
    .breadcrumb a:hover { color: #fff; text-decoration: underline; }
    .breadcrumb .sep { color: rgba(255,255,255,0.6); }
    .breadcrumb span[aria-current] { color: #fff; }

    .section-header { text-align: center; margin-bottom: 2.5rem; }
    .section-kicker {
      letter-spacing: 4px; font-size: 0.9rem; font-weight: 600;
      color: var(--adm-primary, #0a5cbd); text-transform: uppercase;
      margin: 0 0 0.5rem;
    }
    .section-title {
      font-size: clamp(1.5rem, 3vw, 2.25rem); font-weight: 600;
      margin: 0; color: var(--adm-text, #1f2937);
    }

    .languages-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.5rem;
    }
    .language-card {
      display: block;
      text-decoration: none;
      color: inherit;
      border-radius: var(--adm-radius-card, 6px);
      overflow: hidden;
      background: var(--adm-surface, #fff);
      box-shadow: 0 4px 12px var(--adm-shadow-color, rgba(15,23,42,0.08));
      transition: transform 200ms ease, box-shadow 200ms ease;
    }
    .language-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px var(--adm-shadow-color, rgba(15,23,42,0.15));
    }
    .language-card:focus-visible { outline: 2px solid var(--adm-primary, #0a5cbd); outline-offset: 2px; }
    .language-banner {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      min-height: 180px;
      background: linear-gradient(135deg, var(--adm-primary, #0a5cbd), var(--adm-primary-dark, #084a99));
      color: #fff; text-align: center; padding: 1.5rem;
    }
    .language-banner h3 { margin: 0 0 0.25rem; font-size: 1.5rem; }
    .native-name { margin: 0; opacity: 0.85; font-size: 1rem; }
    .language-body { padding: 1.25rem; }
    .language-body h4 { margin: 0 0 0.75rem; font-size: 1.1rem; color: var(--adm-text, #1f2937); }
    .calendar-hint {
      display: flex; align-items: center; gap: 0.5rem;
      margin: 0; font-size: 0.9rem; color: var(--adm-text-muted, #475569);
    }
    .hint-icon { width: 16px; height: 16px; color: var(--adm-primary, #0a5cbd); }

    .state-text, .state-error, .state-info {
      text-align: center; padding: 2rem; border-radius: var(--adm-radius-card, 6px);
      color: var(--adm-text-muted, #475569);
    }
    .state-error { background: var(--adm-danger-light, #fee2e2); color: var(--adm-danger-dark, #b91c1c); }
    .state-info { background: var(--adm-primary-bg, #e7f0fb); color: var(--adm-primary-dark, #084a99); }

    .section-action { text-align: center; margin-top: 2rem; }
    .btn-primary {
      display: inline-flex; align-items: center; justify-content: center;
      padding: 0.6rem 1.5rem; border: 0;
      border-radius: var(--adm-radius-card, 6px);
      background: var(--adm-primary, #0a5cbd);
      color: var(--adm-text-on-primary, #fff);
      font: inherit; font-size: 0.95rem; font-weight: 600;
      text-decoration: none; cursor: pointer;
      transition: background 150ms ease, transform 100ms ease;
    }
    .btn-primary:hover { background: var(--adm-primary-dark, #084a99); }
    .btn-primary:active { transform: scale(0.98); }
    .btn-primary:focus-visible { outline: 2px solid var(--adm-primary, #0a5cbd); outline-offset: 2px; }

    @media (prefers-reduced-motion: reduce) {
      .language-card, .btn-primary { transition: none; }
    }
  `,
})
export class CoursesPageComponent implements OnInit {
  private readonly apiService = inject(OrizzontiApiService);
  protected readonly languages = signal<LanguageItem[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  ngOnInit() {
    this.loading.set(true);
    this.error.set(null);
    this.apiService.getLanguages().subscribe({
      next: (languages) => {
        this.languages.set(languages.filter((l) => l.isActive !== false));
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load languages');
        this.loading.set(false);
      },
    });
  }
}
