import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SiteContentService } from '../../../core/site/site-content.service';

/**
 * Token-based public site footer. Replaces the legacy Bootstrap footer.
 * Preserves the same content (contact info, social links, course links,
 * legal row) and landmark structure.
 */
@Component({
  selector: 'app-site-footer',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer class="site-footer">
      <div class="footer-inner">
        <div class="footer-grid">
          <section class="footer-col">
            <h2 class="footer-heading">Get In Touch</h2>
            <p class="footer-line">
              <svg viewBox="0 0 24 24" class="footer-icon" aria-hidden="true"><path fill="currentColor" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"/></svg>
              {{ site.address() }}
            </p>
            <p class="footer-line">
              <svg viewBox="0 0 24 24" class="footer-icon" aria-hidden="true"><path fill="currentColor" d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
              {{ site.phone() }}
            </p>
            <p class="footer-line">
              <svg viewBox="0 0 24 24" class="footer-icon" aria-hidden="true"><path fill="currentColor" d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
              {{ site.email() }}
            </p>
            <div class="social-links">
              <a [href]="site.facebookUrl()" target="_blank" rel="noopener noreferrer" class="social-link" aria-label="Orizzonti on Facebook">
                <svg viewBox="0 0 24 24" class="social-icon" aria-hidden="true"><path fill="currentColor" d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.26h3.32l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z"/></svg>
              </a>
              <a [href]="site.instagramUrl()" target="_blank" rel="noopener noreferrer" class="social-link" aria-label="Orizzonti on Instagram">
                <svg viewBox="0 0 24 24" class="social-icon" aria-hidden="true"><path fill="currentColor" d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41-.56-.22-.96-.48-1.38-.9-.42-.42-.68-.82-.9-1.38-.16-.42-.36-1.06-.41-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41 1.27-.06 1.65-.07 4.85-.07M12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63c-.79.31-1.46.72-2.13 1.38C1.35 2.68.94 3.35.63 4.14.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.31.79.72 1.46 1.38 2.13.67.66 1.34 1.07 2.13 1.38.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56.79-.31 1.46-.72 2.13-1.38.66-.67 1.07-1.34 1.38-2.13.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91-.31-.79-.72-1.46-1.38-2.13-.67-.66-1.34-1.07-2.13-1.38-.76-.3-1.64-.5-2.91-.56C15.67.01 15.26 0 12 0zm0 5.84A6.16 6.16 0 105.84 12 6.16 6.16 0 0012 5.84zM12 16a4 4 0 110-8 4 4 0 010 8zm6.41-10.85a1.44 1.44 0 11-1.44-1.44 1.44 1.44 0 011.44 1.44z"/></svg>
              </a>
            </div>
          </section>

          <section class="footer-col">
            <h2 class="footer-heading">Our Courses</h2>
            <div class="course-links">
              @for (language of site.footerLanguages(); track language.id) {
                <a class="course-link" [routerLink]="['/languages', language.id]">
                  <svg viewBox="0 0 24 24" class="arrow-icon" aria-hidden="true"><path fill="currentColor" d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z"/></svg>
                  {{ language.label }}
                </a>
              } @empty {
                @for (label of defaultLanguageLinks; track label) {
                  <a class="course-link" routerLink="/courses">
                    <svg viewBox="0 0 24 24" class="arrow-icon" aria-hidden="true"><path fill="currentColor" d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z"/></svg>
                    {{ label }}
                  </a>
                }
              }
            </div>
          </section>
        </div>

        <div class="footer-legal">
          <p class="legal-text">
            &copy; <a href="#top" class="legal-link">Orizzonti.tn</a>. All Rights Reserved.
          </p>
          <div class="legal-links">
            <a href="mailto:info&#64;orizzonti.tn" class="legal-link">Privacy</a>
            <a href="/other/terms.html" class="legal-link">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  `,
  styles: `
    :host { display: block; }
    .site-footer {
      background: #1a1a2e;
      color: #e2e8f0;
      padding: 2.5rem 1.5rem 1.5rem;
    }
    .footer-inner {
      max-width: 1400px;
      margin: 0 auto;
    }
    .footer-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
      padding-bottom: 2rem;
    }
    .footer-heading {
      margin: 0 0 1rem;
      font-size: 1rem;
      font-weight: 600;
      color: var(--adm-primary-light, #3b82d6);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .footer-line {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 0 0 0.75rem;
      font-size: 0.9rem;
    }
    .footer-icon { width: 16px; height: 16px; flex-shrink: 0; color: var(--adm-primary-light, #3b82d6); }
    .social-links { display: flex; gap: 0.75rem; margin-top: 1rem; }
    .social-link {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border: 1px solid rgba(255,255,255,0.3);
      border-radius: var(--adm-radius-card, 6px);
      color: #e2e8f0;
      transition: background 150ms ease, border-color 150ms ease;
    }
    .social-link:hover { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.5); }
    .social-link:focus-visible { outline: 2px solid var(--adm-primary-light, #3b82d6); outline-offset: 2px; }
    .social-icon { width: 18px; height: 18px; }
    .course-links { display: flex; flex-direction: column; gap: 0.5rem; }
    .course-link {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #e2e8f0;
      text-decoration: none;
      font-size: 0.9rem;
      transition: color 150ms ease;
    }
    .course-link:hover { color: var(--adm-primary-light, #3b82d6); }
    .arrow-icon { width: 14px; height: 14px; }
    .footer-legal {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding-top: 1.5rem;
      border-top: 1px solid rgba(255,255,255,0.15);
      flex-wrap: wrap;
    }
    .legal-text { margin: 0; font-size: 0.85rem; }
    .legal-links { display: flex; gap: 1rem; }
    .legal-link { color: #e2e8f0; text-decoration: none; font-size: 0.85rem; }
    .legal-link:hover { text-decoration: underline; }

    @media (max-width: 767px) {
      .footer-grid { grid-template-columns: 1fr; gap: 1.5rem; }
      .footer-legal { flex-direction: column; align-items: flex-start; }
    }
  `,
})
export class SiteFooterComponent {
  protected readonly site = inject(SiteContentService);
  protected readonly defaultLanguageLinks = ['Italiano', 'العربّية', 'English', 'Français'];
}
