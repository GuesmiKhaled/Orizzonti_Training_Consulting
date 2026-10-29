import { Component, signal } from '@angular/core';
import {
  NavigationEnd,
  NavigationStart,
  Router,
  RouterOutlet,
} from '@angular/router';
import { filter } from 'rxjs';
import { ToastContainerComponent } from './core/toast/toast-container.component';
import { SiteHeaderComponent, SiteFooterComponent } from './shared/layout';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    ToastContainerComponent,
    SiteHeaderComponent,
    SiteFooterComponent,
  ],
  template: `
    @if (!isBackofficeArea) {
      <app-site-header />
    }

    <app-toast-container />
    <main class="site-main" [class.route-transitioning]="routeTransitioning()">
      <router-outlet></router-outlet>
    </main>

    @if (!isBackofficeArea) {
      <app-site-footer />
      <a href="#top" class="back-to-top" aria-label="Back to top">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 8l-6 6 1.41 1.41L12 10.83l4.59 4.58L18 14z"/></svg>
      </a>
    }
  `,
  styles: [
    `
      .site-main {
        min-height: 55vh;
      }
      .site-main.route-transitioning::ng-deep > router-outlet + * {
        animation: route-fade-in 220ms ease-out;
      }
      @keyframes route-fade-in {
        from { opacity: 0; transform: translateY(4px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .back-to-top {
        position: fixed;
        bottom: 1.5rem;
        right: 1.5rem;
        z-index: 100;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 44px;
        height: 44px;
        border-radius: var(--adm-radius-card, 6px);
        background: var(--adm-primary, #0a5cbd);
        color: #fff;
        text-decoration: none;
        box-shadow: 0 4px 12px var(--adm-shadow-color, rgba(15,23,42,0.2));
        transition: background 150ms ease, transform 150ms ease;
      }
      .back-to-top:hover { background: var(--adm-primary-dark, #084a99); transform: translateY(-2px); }
      .back-to-top:focus-visible { outline: 2px solid var(--adm-primary, #0a5cbd); outline-offset: 2px; }
      .back-to-top svg { width: 20px; height: 20px; }
      @media (prefers-reduced-motion: reduce) {
        .site-main.route-transitioning::ng-deep > router-outlet + * { animation: none; }
        .back-to-top { transition: none; }
      }
    `,
  ],
})
export class AppComponent {
  title = 'Orizzonti Training & Consulting';
  isBackofficeArea = false;
  protected readonly routeTransitioning = signal(false);

  constructor(router: Router) {
    const updateArea = (url: string) => {
      this.isBackofficeArea =
        url === '/login' ||
        url === '/change-password' ||
        url.startsWith('/admin');
    };
    updateArea(router.url);
    router.events
      .pipe(
        filter(
          (event): event is NavigationEnd => event instanceof NavigationEnd,
        ),
      )
      .subscribe((event) => updateArea(event.urlAfterRedirects));

    // Route transition: pulse the flag on start, clear on end.
    router.events
      .pipe(filter((event) => event instanceof NavigationStart))
      .subscribe(() => this.routeTransitioning.set(true));
    router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        // Brief delay so the animation has time to play before clearing.
        setTimeout(() => this.routeTransitioning.set(false), 250);
      });
  }
}
