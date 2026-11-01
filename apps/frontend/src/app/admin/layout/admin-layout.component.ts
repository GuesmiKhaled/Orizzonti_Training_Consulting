import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  NavigationEnd,
  NavigationStart,
  Router,
  RouterOutlet,
} from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { ADMIN_NAV, filterNav } from '../nav.config';
import { AdminBreadcrumbsComponent } from './admin-breadcrumbs.component';
import { AdminSidebarComponent } from './admin-sidebar.component';
import { AdminTopbarComponent } from './admin-topbar.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    AdminSidebarComponent,
    AdminTopbarComponent,
    AdminBreadcrumbsComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'admin-theme' },
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss',
})
export class AdminLayoutComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly sidebarOpen = signal(
    typeof window !== 'undefined' && window.innerWidth >= 861,
  );
  protected readonly routeTransitioning = signal(false);
  protected readonly nav = computed(() =>
    filterNav(ADMIN_NAV, (permission) => this.auth.has(permission)),
  );
  protected readonly userLabel = computed(() => {
    const profile = this.auth.profile();
    return profile ? [profile.username, profile.role].filter(Boolean).join(' · ') : '';
  });

  constructor() {
    this.auth.ensureProfile().subscribe();
    this.setupRouteTransition();
  }

  protected toggleSidebar(): void {
    this.sidebarOpen.update((open) => !open);
  }

  protected closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  protected logout(): void {
    this.auth.logout();
  }

  private setupRouteTransition(): void {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationStart))
      .subscribe(() => this.routeTransitioning.set(true));
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        setTimeout(() => this.routeTransitioning.set(false), 250);
      });
  }
}
