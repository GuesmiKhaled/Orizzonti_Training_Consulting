import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  ActivatedRouteSnapshot,
  NavigationEnd,
  Router,
  RouterLink,
} from '@angular/router';
import { filter, map, startWith } from 'rxjs';

export interface Crumb {
  readonly label: string;
  readonly url: string;
}

/** Collects `data.breadcrumb` from the routes that own it, building cumulative URLs. */
export function buildCrumbs(root: ActivatedRouteSnapshot): Crumb[] {
  const crumbs: Crumb[] = [{ label: 'Home', url: '/admin' }];
  let url = '';
  for (
    let route: ActivatedRouteSnapshot | null = root.firstChild;
    route;
    route = route.firstChild
  ) {
    const segment = route.url.map((part) => part.path).join('/');
    if (segment) {
      url += `/${segment}`;
    }
    const label: unknown = route.routeConfig?.data?.['breadcrumb'];
    if (typeof label === 'string') {
      crumbs.push({ label, url: url || '/admin' });
    }
  }
  return crumbs;
}

@Component({
  selector: 'app-admin-breadcrumbs',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav aria-label="Breadcrumb">
      @for (crumb of crumbs(); track $index; let last = $last) {
        @if (last) {
          <span aria-current="page">{{ crumb.label }}</span>
        } @else {
          <a [routerLink]="crumb.url">{{ crumb.label }}</a>
          <span class="sep" aria-hidden="true">/</span>
        }
      }
    </nav>
  `,
  styles: `
    nav {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
      font-size: 0.8rem;
    }
    a {
      color: var(--adm-primary);
      text-decoration: none;
    }
    .sep {
      color: #94a3b8;
    }
  `,
})
export class AdminBreadcrumbsComponent {
  private readonly router = inject(Router);

  protected readonly crumbs = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      startWith(null),
      map(() => buildCrumbs(this.router.routerState.snapshot.root)),
    ),
    { initialValue: [] as Crumb[] },
  );
}
