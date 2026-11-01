import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
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

  /** Set of expanded group labels. Auto-expands the group containing the active route. */
  private readonly activeUrl = signal(this.router.url);
  readonly expandedGroups = computed<Set<string>>(() => {
    const url = this.activeUrl();
    const auto = new Set<string>();
    for (const item of this.items()) {
      if (item.children?.some((c) => c.route === url)) {
        auto.add(item.label);
      }
    }
    return auto;
  });

  /** Manually toggled groups (overrides auto-expand). */
  private readonly manualToggle = signal<Set<string>>(new Set());
  private readonly manualTouched = signal<Set<string>>(new Set());

  constructor() {
    this.router.events.subscribe(() => this.activeUrl.set(this.router.url));
  }

  protected isGroupExpanded(label: string): boolean {
    const touched = this.manualTouched();
    if (touched.has(label)) {
      return this.manualToggle().has(label);
    }
    return this.expandedGroups().has(label);
  }

  protected toggleGroup(label: string): void {
    const touched = new Set(this.manualTouched());
    const toggle = new Set(this.manualToggle());
    touched.add(label);
    if (this.isGroupExpanded(label)) {
      toggle.delete(label);
    } else {
      toggle.add(label);
    }
    this.manualTouched.set(touched);
    this.manualToggle.set(toggle);
  }

  /** Whether any child route is currently active — used for collapsed icon highlight only. */
  protected hasActiveChild(children: readonly NavItem[]): boolean {
    return children.some((child) => child.route === this.activeUrl());
  }
}
