import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { filter } from 'rxjs';
import { ToastContainerComponent } from './core/toast/toast-container.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    ToastContainerComponent,
  ],
  template: `
    <header id="top" *ngIf="!isBackofficeArea">
      <div class="container-fluid d-none d-lg-block">
        <div class="row align-items-center py-4 px-xl-5">
          <div class="col-lg-3">
            <a routerLink="/" aria-label="Orizzonti home">
              <img
                class="site-logo desktop-logo"
                src="/img/log_orizzonti.png"
                alt="Orizzonti Training & Consulting"
              />
            </a>
          </div>
          <div class="col-lg-3 text-right">
            <div class="d-inline-flex align-items-center">
              <i
                class="fa fa-2x fa-map-marker-alt text-primary mr-3"
                aria-hidden="true"
              ></i>
              <div class="text-left">
                <h6 class="font-weight-semi-bold mb-1">Our Office</h6>
                <small>6 rue Lucie Faure, Tunis, Tunisia</small>
              </div>
            </div>
          </div>
          <div class="col-lg-3 text-right">
            <div class="d-inline-flex align-items-center">
              <i
                class="fa fa-2x fa-envelope text-primary mr-3"
                aria-hidden="true"
              ></i>
              <div class="text-left">
                <h6 class="font-weight-semi-bold mb-1">Email Us</h6>
                <small>info&#64;orizzonti.tn</small>
              </div>
            </div>
          </div>
          <div class="col-lg-3 text-right">
            <div class="d-inline-flex align-items-center">
              <i
                class="fa fa-2x fa-phone text-primary mr-3"
                aria-hidden="true"
              ></i>
              <div class="text-left">
                <h6 class="font-weight-semi-bold mb-1">Call Us</h6>
                <small>+216 24 422 753 · +216 36 239 750</small>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="container-fluid site-navigation">
        <div class="row border-top px-xl-5">
          <div class="col-lg-3 d-none d-lg-block"></div>
          <div class="col-lg-9">
            <nav
              class="navbar navbar-expand-lg bg-light navbar-light py-3 py-lg-0 px-0"
              aria-label="Main navigation"
            >
              <a
                routerLink="/"
                class="d-block d-lg-none"
                aria-label="Orizzonti home"
              >
                <img
                  class="site-logo mobile-logo"
                  src="/img/log_orizzonti.png"
                  alt="Orizzonti Training & Consulting"
                />
              </a>
              <button
                type="button"
                class="navbar-toggler"
                (click)="isMenuOpen = !isMenuOpen"
                [attr.aria-expanded]="isMenuOpen"
                aria-controls="mainNavigation"
                aria-label="Toggle navigation"
              >
                <span class="navbar-toggler-icon"></span>
              </button>
              <div
                id="mainNavigation"
                class="navbar-collapse justify-content-between"
                [class.show]="isMenuOpen"
              >
                <div class="navbar-nav py-0">
                  <a
                    routerLink="/"
                    routerLinkActive="active"
                    [routerLinkActiveOptions]="{ exact: true }"
                    class="nav-item nav-link"
                    (click)="isMenuOpen = false"
                    >Home</a
                  >
                  <a
                    routerLink="/about"
                    routerLinkActive="active"
                    class="nav-item nav-link"
                    (click)="isMenuOpen = false"
                    >About</a
                  >
                  <a
                    routerLink="/courses"
                    routerLinkActive="active"
                    class="nav-item nav-link"
                    (click)="isMenuOpen = false"
                    >Courses</a
                  >
                  <a
                    routerLink="/blog"
                    routerLinkActive="active"
                    class="nav-item nav-link"
                    (click)="isMenuOpen = false"
                    >News</a
                  >
                  <a
                    routerLink="/contact"
                    routerLinkActive="active"
                    class="nav-item nav-link"
                    (click)="isMenuOpen = false"
                    >Contact</a
                  >
                  <a
                    routerLink="/login"
                    routerLinkActive="active"
                    class="nav-item nav-link"
                    (click)="isMenuOpen = false"
                    >Admin</a
                  >
                </div>
                <div
                  id="menu_languages"
                  class="legacy-language-menu"
                  (mouseenter)="isLanguageMenuOpen = true"
                  (mouseleave)="isLanguageMenuOpen = false"
                  (focusout)="closeLanguageMenu($event)"
                >
                  <button
                    type="button"
                    class="language-trigger"
                    aria-controls="subMenu"
                    [attr.aria-expanded]="isLanguageMenuOpen"
                    (click)="isLanguageMenuOpen = !isLanguageMenuOpen"
                  >
                    Select Language
                  </button>
                  <div id="subMenu" [hidden]="!isLanguageMenuOpen">
                    <ul>
                      <li>
                        <button
                          type="button"
                          [class.active]="language === 'en'"
                          (click)="setLanguage('en')"
                        >
                          English
                        </button>
                      </li>
                      <li>
                        <button
                          type="button"
                          [class.active]="language === 'fr'"
                          (click)="setLanguage('fr')"
                        >
                          French
                        </button>
                      </li>
                      <li>
                        <button
                          type="button"
                          [class.active]="language === 'it'"
                          (click)="setLanguage('it')"
                        >
                          Italian
                        </button>
                      </li>
                      <li>
                        <button
                          type="button"
                          [class.active]="language === 'ar'"
                          (click)="setLanguage('ar')"
                        >
                          Arabic
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </nav>
          </div>
        </div>
      </div>
    </header>

    <app-toast-container />
    <main class="site-main">
      <router-outlet></router-outlet>
    </main>

    <footer
      *ngIf="!isBackofficeArea"
      class="container-fluid bg-dark text-white py-5 px-sm-3 px-lg-5 site-footer"
    >
      <div class="row pt-4">
        <div class="col-lg-7 col-md-12">
          <div class="row">
            <div class="col-md-7 mb-4">
              <h5 class="text-primary text-uppercase mb-4">Get In Touch</h5>
              <p>
                <i class="fa fa-map-marker-alt mr-2" aria-hidden="true"></i>6
                rue Lucie Faure en plein centre ville en face du Jardin Le
                Passage.
              </p>
              <p>
                <i class="fa fa-phone-alt mr-2" aria-hidden="true"></i>+216 24
                422 753
              </p>
              <p>
                <i class="fa fa-envelope mr-2" aria-hidden="true"></i
                >info&#64;orizzonti.tn
              </p>
              <div class="d-flex justify-content-start mt-4 social-links">
                <a
                  class="btn btn-outline-light btn-square mr-2"
                  href="https://www.facebook.com/orizzonti.tn"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Orizzonti on Facebook"
                  ><i class="fab fa-facebook-f" aria-hidden="true"></i
                ></a>
                <a
                  class="btn btn-outline-light btn-square"
                  href="https://www.instagram.com/Orizzonti_tn"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Orizzonti on Instagram"
                  ><i class="fab fa-instagram" aria-hidden="true"></i
                ></a>
              </div>
            </div>
          </div>
        </div>
        <div class="col-lg-5 mb-4">
          <h5 class="text-primary text-uppercase mb-4">Our Courses</h5>
          <div class="d-flex flex-column justify-content-start">
            <a class="text-white mb-2" routerLink="/courses"
              ><i class="fa fa-angle-right mr-2" aria-hidden="true"></i
              >Italiano</a
            >
            <a class="text-white mb-2" routerLink="/courses"
              ><i class="fa fa-angle-right mr-2" aria-hidden="true"></i
              >العربّية</a
            >
            <a class="text-white mb-2" routerLink="/courses"
              ><i class="fa fa-angle-right mr-2" aria-hidden="true"></i
              >English</a
            >
            <a class="text-white mb-2" routerLink="/courses"
              ><i class="fa fa-angle-right mr-2" aria-hidden="true"></i
              >Français</a
            >
          </div>
        </div>
      </div>

      <div class="row border-top pt-4 mt-3 footer-legal">
        <div class="col-lg-6 text-center text-md-left mb-3 mb-lg-0">
          <p class="m-0">
            &copy; <a href="#top" class="text-white">Orizzonti.tn</a>. All
            Rights Reserved. Designed by
            <a
              href="https://www.linkedin.com/in/khaled-guesmi/"
              target="_blank"
              rel="noopener noreferrer"
              class="text-white"
              >Khaled Guesmi</a
            >
          </p>
        </div>
        <div class="col-lg-6 text-center text-lg-right">
          <a class="text-white mr-3" href="mailto:info&#64;orizzonti.tn"
            >Privacy</a
          >
          <a class="text-white" href="/other/terms.html">Terms</a>
        </div>
      </div>
    </footer>
    <a
      *ngIf="!isBackofficeArea"
      href="#top"
      class="btn btn-lg btn-primary btn-lg-square back-to-top"
      aria-label="Back to top"
    >
      <i class="fa fa-angle-double-up" aria-hidden="true"></i>
    </a>
  `,
  styles: [
    `
      .site-main {
        min-height: 55vh;
      }
    `,
  ],
})
export class AppComponent {
  title = 'Orizzonti Training & Consulting';
  isBackofficeArea = false;
  isMenuOpen = false;
  isLanguageMenuOpen = false;
  language = 'en';

  constructor(router: Router) {
    const updateArea = (url: string) => {
      this.isBackofficeArea = url === '/login' || url.startsWith('/admin');
    };
    updateArea(router.url);
    router.events
      .pipe(
        filter(
          (event): event is NavigationEnd => event instanceof NavigationEnd,
        ),
      )
      .subscribe((event) => updateArea(event.urlAfterRedirects));
  }

  setLanguage(language: string): void {
    this.language = language;
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    this.isLanguageMenuOpen = false;
  }

  closeLanguageMenu(event: FocusEvent): void {
    const menu = event.currentTarget as HTMLElement;
    if (!menu.contains(event.relatedTarget as Node | null)) {
      this.isLanguageMenuOpen = false;
    }
  }
}
