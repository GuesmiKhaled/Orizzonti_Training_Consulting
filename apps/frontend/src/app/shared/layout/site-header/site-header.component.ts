import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SiteContentService } from '../../../core/site/site-content.service';
import { ThemeToggleComponent } from '../../ui';

interface NavItem {
  readonly label: string;
  readonly url: string;
  readonly exact?: boolean;
}

const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Home', url: '/', exact: true },
  { label: 'About', url: '/about' },
  { label: 'Courses', url: '/courses' },
  { label: 'News', url: '/blog' },
  { label: 'Contact', url: '/contact' },
  { label: 'Admin', url: '/login' },
];

const LANGUAGES: readonly { code: string; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'French' },
  { code: 'it', label: 'Italian' },
  { code: 'ar', label: 'Arabic' },
];

/**
 * Accessible, token-based public site header. Replaces the legacy Bootstrap
 * navbar. Mobile menu is a CSS-only disclosure with focus management via
 * `aria-expanded`. The language switcher is a hover/focus dropdown.
 */
@Component({
  selector: 'app-site-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, ThemeToggleComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="site-header">
      <div class="topbar">
        <div class="topbar-inner">
          <a routerLink="/" class="brand" aria-label="Orizzonti home">
            <img src="/img/log_orizzonti.png" alt="Orizzonti Training & Consulting" class="brand-logo" />
          </a>
          <div class="contact-info">
            <span class="contact-item">
              <svg viewBox="0 0 24 24" class="contact-icon" aria-hidden="true"><path fill="currentColor" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"/></svg>
              <span>6 rue Lucie Faure, Tunis, Tunisia</span>
            </span>
            <span class="contact-item">
              <svg viewBox="0 0 24 24" class="contact-icon" aria-hidden="true"><path fill="currentColor" d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
              <span>{{ site.email() }}</span>
            </span>
            <span class="contact-item">
              <svg viewBox="0 0 24 24" class="contact-icon" aria-hidden="true"><path fill="currentColor" d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
              <span>{{ site.headerPhone() }}</span>
            </span>
          </div>
          <app-theme-toggle />
        </div>
      </div>

      <nav class="main-nav" aria-label="Main navigation">
        <div class="nav-inner">
          <button
            type="button"
            class="menu-toggle"
            [attr.aria-expanded]="menuOpen()"
            aria-controls="main-nav-list"
            (click)="menuOpen.set(!menuOpen())"
          >
            <span class="hamburger" [class.open]="menuOpen()">
              <span></span><span></span><span></span>
            </span>
            <span class="menu-label">Menu</span>
          </button>

          <ul id="main-nav-list" class="nav-list" [class.open]="menuOpen()">
            @for (item of navItems; track item.url) {
              <li>
                <a
                  [routerLink]="item.url"
                  routerLinkActive="active"
                  [routerLinkActiveOptions]="{ exact: item.exact ?? false }"
                  (click)="menuOpen.set(false)"
                >{{ item.label }}</a>
              </li>
            }
            <li class="lang-item">
              <div
                class="lang-menu"
                (mouseenter)="langMenuOpen.set(true)"
                (mouseleave)="langMenuOpen.set(false)"
              >
                <button
                  type="button"
                  class="lang-trigger"
                  [attr.aria-expanded]="langMenuOpen()"
                  aria-controls="lang-submenu"
                  (click)="langMenuOpen.set(!langMenuOpen())"
                >
                  Select Language
                </button>
                <ul id="lang-submenu" class="lang-submenu" [hidden]="!langMenuOpen()">
                  @for (lang of languages; track lang.code) {
                    <li>
                      <button
                        type="button"
                        [class.active]="currentLang() === lang.code"
                        (click)="setLanguage(lang.code)"
                      >{{ lang.label }}</button>
                    </li>
                  }
                </ul>
              </div>
            </li>
          </ul>
        </div>
      </nav>
    </header>
  `,
  styles: `
    :host { display: block; }

    .site-header {
      background: var(--adm-surface, #fff);
      border-bottom: 1px solid var(--adm-border, #eef1f6);
    }

    .topbar {
      background: var(--adm-surface-muted, #f8fafc);
      border-bottom: 1px solid var(--adm-border, #eef1f6);
    }
    .topbar-inner {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      max-width: 1400px;
      margin: 0 auto;
      padding: 1rem 1.5rem;
    }
    .brand { flex-shrink: 0; }
    .brand-logo { max-height: 56px; width: auto; }
    .contact-info {
      display: flex;
      gap: 1.5rem;
      margin-left: auto;
      flex-wrap: wrap;
    }
    .contact-item {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.85rem;
      color: var(--adm-text-muted, #475569);
    }
    .contact-icon { width: 18px; height: 18px; color: var(--adm-primary, #0a5cbd); }

    .main-nav { background: var(--adm-surface, #fff); }
    .nav-inner {
      display: flex;
      align-items: center;
      max-width: 1400px;
      margin: 0 auto;
      padding: 0 1.5rem;
    }

    .menu-toggle {
      display: none;
      align-items: center;
      gap: 0.5rem;
      border: 0;
      background: transparent;
      color: var(--adm-text, #1f2937);
      font: inherit;
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      padding: 1rem 0;
    }
    .hamburger {
      position: relative;
      display: block;
      width: 20px;
      height: 14px;
    }
    .hamburger span {
      position: absolute;
      left: 0;
      width: 100%;
      height: 2px;
      border-radius: 2px;
      background: var(--adm-text, #1f2937);
      transition: transform 220ms ease, opacity 160ms ease, top 160ms ease;
    }
    .hamburger span:nth-child(1) { top: 0; }
    .hamburger span:nth-child(2) { top: 6px; }
    .hamburger span:nth-child(3) { top: 12px; }
    .hamburger.open span:nth-child(1) { top: 6px; transform: rotate(45deg); }
    .hamburger.open span:nth-child(2) { opacity: 0; transform: scaleX(0.4); }
    .hamburger.open span:nth-child(3) { top: 6px; transform: rotate(-45deg); }

    .nav-list {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      list-style: none;
      margin: 0;
      padding: 0;
    }
    .nav-list a {
      display: block;
      padding: 1rem 0.85rem;
      color: var(--adm-text, #1f2937);
      text-decoration: none;
      font-size: 0.9rem;
      font-weight: 500;
      border-bottom: 2px solid transparent;
      transition: color 150ms ease, border-color 150ms ease;
    }
    .nav-list a:hover { color: var(--adm-primary, #0a5cbd); }
    .nav-list a.active {
      color: var(--adm-primary, #0a5cbd);
      border-bottom-color: var(--adm-primary, #0a5cbd);
    }
    .nav-list a:focus-visible {
      outline: 2px solid var(--adm-primary, #0a5cbd);
      outline-offset: -2px;
    }
    .lang-item { margin-left: auto; }
    .lang-menu { position: relative; }
    .lang-trigger {
      border: 1px solid var(--adm-border-strong, #cbd5e1);
      border-radius: var(--adm-radius-card, 6px);
      background: var(--adm-surface, #fff);
      color: var(--adm-text, #1f2937);
      font: inherit;
      font-size: 0.85rem;
      padding: 0.5rem 1rem;
      cursor: pointer;
    }
    .lang-trigger:focus-visible {
      outline: 2px solid var(--adm-primary, #0a5cbd);
      outline-offset: 1px;
    }
    .lang-submenu {
      position: absolute;
      top: 100%;
      right: 0;
      min-width: 140px;
      margin: 0;
      padding: 0.25rem 0;
      list-style: none;
      background: var(--adm-surface, #fff);
      border: 1px solid var(--adm-border, #eef1f6);
      border-radius: var(--adm-radius-card, 6px);
      box-shadow: 0 4px 12px var(--adm-shadow-color, rgba(15,23,42,0.1));
      z-index: 100;
    }
    .lang-submenu button {
      display: block;
      width: 100%;
      text-align: left;
      border: 0;
      background: transparent;
      color: var(--adm-text, #1f2937);
      font: inherit;
      font-size: 0.85rem;
      padding: 0.5rem 1rem;
      cursor: pointer;
    }
    .lang-submenu button:hover { background: var(--adm-surface-hover, #f1f5f9); }
    .lang-submenu button.active { color: var(--adm-primary, #0a5cbd); font-weight: 600; }

    /* Mobile: under 992px, collapse nav into a vertical menu. */
    @media (max-width: 991px) {
      .menu-toggle { display: inline-flex; }
      .contact-info { display: none; }
      .nav-list {
        display: none;
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        flex-direction: column;
        align-items: stretch;
        gap: 0;
        background: var(--adm-surface, #fff);
        border-top: 1px solid var(--adm-border, #eef1f6);
        box-shadow: 0 4px 12px var(--adm-shadow-color, rgba(15,23,42,0.1));
        z-index: 50;
      }
      .nav-list.open { display: flex; }
      .nav-list a { padding: 0.85rem 1.5rem; border-bottom: 1px solid var(--adm-border, #eef1f6); }
      .nav-list a.active { border-bottom-color: var(--adm-border, #eef1f6); background: var(--adm-surface-hover, #f1f5f9); }
      .lang-item { margin-left: 0; }
      .lang-menu { padding: 0.85rem 1.5rem; }
      .lang-submenu { position: static; box-shadow: none; border: 0; }
    }

    @media (prefers-reduced-motion: reduce) {
      .hamburger span { transition: none; }
    }
  `,
})
export class SiteHeaderComponent {
  protected readonly site = inject(SiteContentService);
  protected readonly menuOpen = signal(false);
  protected readonly langMenuOpen = signal(false);
  protected readonly currentLang = signal('en');

  protected readonly navItems = NAV_ITEMS;
  protected readonly languages = LANGUAGES;

  protected setLanguage(code: string): void {
    this.currentLang.set(code);
    document.documentElement.lang = code;
    document.documentElement.dir = code === 'ar' ? 'rtl' : 'ltr';
    this.langMenuOpen.set(false);
  }
}
