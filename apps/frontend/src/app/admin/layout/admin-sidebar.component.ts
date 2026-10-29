import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
} from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { NavItem } from '../nav.config';
import { NavIconComponent } from './nav-icon.component';

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NavIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-sidebar.component.html',
  styleUrl: './admin-sidebar.component.scss',
})
export class AdminSidebarComponent {
  readonly items = input.required<readonly NavItem[]>();
  readonly collapsed = input(false);
  readonly navigated = output<void>();

  private readonly router = inject(Router);

  /** Whether any child route is currently active — used to highlight the group icon. */
  protected hasActiveChild(children: readonly NavItem[]): boolean {
    const url = this.router.url;
    return children.some((child) => child.route === url);
  }
}
