import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SiteContentService } from '../../core/site/site-content.service';

@Component({
  selector: 'app-about-page',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="page-hero">
      <div class="container">
        <h1>About Us</h1>
        <nav class="breadcrumb" aria-label="Breadcrumb">
          <a routerLink="/">Home</a>
          <span class="sep" aria-hidden="true">/</span>
          <span aria-current="page">About</span>
        </nav>
      </div>
    </section>

    <section class="section about-section">
      <div class="container">
        <div class="about-grid">
          <div class="about-image-wrap">
            <img
              class="about-image"
              src="/img/orizontiLanguages.jpg"
              alt="Orizzonti language courses"
              loading="lazy"
            />
          </div>
          <div class="about-content">
            <p class="section-kicker">About Us</p>
            <h2 class="section-title">Orizzonti Training & Consulting</h2>
            @if (site.aboutParagraphs(); as paragraphs) {
              @for (paragraph of paragraphs; track $index) {
                <p>{{ paragraph }}</p>
              }
            } @else {
              <p>
                <strong>Orizzonti Training & Consulting</strong> provides
                Italian language classes and communication skills to students
                who need certification in Italian. Our center has an approved
                certificate in the Italian language by CERT.IT SIS in Tunisia.
                We also provide courses in other languages.
              </p>
            }
            <a routerLink="/courses" class="btn-primary">Explore subjects</a>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: `
    :host { display: block; }
    .container { max-width: 1140px; margin: 0 auto; padding: 0 1.5rem; }
    .section { padding: 3.5rem 0; }

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

    .about-section { background: var(--adm-surface, #fff); }
    .about-grid {
      display: grid;
      grid-template-columns: 5fr 7fr;
      gap: 2rem;
      align-items: center;
    }
    .about-image {
      width: 100%;
      max-height: 420px;
      object-fit: cover;
      border-radius: var(--adm-radius-card, 6px);
    }
    .about-content p { color: var(--adm-text-muted, #475569); line-height: 1.7; }
    .section-kicker {
      letter-spacing: 4px; font-size: 0.9rem; font-weight: 600;
      color: var(--adm-primary, #0a5cbd); text-transform: uppercase;
      margin: 0 0 0.5rem;
    }
    .section-title {
      font-size: clamp(1.5rem, 3vw, 2.25rem); font-weight: 600;
      margin: 0 0 1rem; color: var(--adm-text, #1f2937);
    }
    .btn-primary {
      display: inline-flex; align-items: center; justify-content: center;
      padding: 0.6rem 1.5rem; border: 0;
      border-radius: var(--adm-radius-card, 6px);
      background: var(--adm-primary, #0a5cbd);
      color: var(--adm-text-on-primary, #fff);
      font: inherit; font-size: 0.95rem; font-weight: 600;
      text-decoration: none; cursor: pointer;
      transition: background 150ms ease, transform 100ms ease;
      margin-top: 0.5rem;
    }
    .btn-primary:hover { background: var(--adm-primary-dark, #084a99); }
    .btn-primary:active { transform: scale(0.98); }
    .btn-primary:focus-visible { outline: 2px solid var(--adm-primary, #0a5cbd); outline-offset: 2px; }

    @media (max-width: 991px) { .about-grid { grid-template-columns: 1fr; } }
    @media (prefers-reduced-motion: reduce) { .btn-primary { transition: none; } }
  `,
})
export class AboutPageComponent {
  protected readonly site = inject(SiteContentService);
}
