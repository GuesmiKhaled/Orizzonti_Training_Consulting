import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { ADMIN_NAV, filterNav } from '../nav.config';
import { AdminBreadcrumbsComponent } from './admin-breadcrumbs.component';
import { AdminSidebarComponent } from './admin-sidebar.component';
import { AdminTopbarComponent } from './admin-topbar.component';

const LEGACY_THEME_ID = 'legacy-theme';

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

  protected readonly sidebarOpen = signal(false);
  protected readonly nav = computed(() =>
    filterNav(ADMIN_NAV, (permission) => this.auth.has(permission)),
  );
  protected readonly userLabel = computed(() => {
    const profile = this.auth.profile();
    return profile ? [profile.username, profile.role].filter(Boolean).join(' · ') : '';
  });

  constructor() {
    this.auth.ensureProfile().subscribe();
    this.suspendLegacyTheme();
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

  /** The public site's Bootstrap sheet must not style the admin; restored on leave. */
  private suspendLegacyTheme(): void {
    const link = inject(DOCUMENT).getElementById(LEGACY_THEME_ID);
    link?.setAttribute('media', 'not all');
    inject(DestroyRef).onDestroy(() => link?.removeAttribute('media'));
  }
}
