import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

export interface BreadcrumbItem {
  readonly label: string;
  readonly url?: string;
}

/**
 * Accessible breadcrumb trail. The last item is the current page
 * (`aria-current="page"`); earlier items with a `url` render as links.
 */
@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav aria-label="Breadcrumb">
      <ol>
        @for (item of items(); track item.label; let last = $last) {
          <li>
            @if (last || !item.url) {
              <span [attr.aria-current]="last ? 'page' : null">{{ item.label }}</span>
            } @else {
              <a [routerLink]="item.url">{{ item.label }}</a>
            }
            @if (!last) {
              <span class="sep" aria-hidden="true">/</span>
            }
          </li>
        }
      </ol>
    </nav>
  `,
  styles: `
    :host { display: block; }
    nav { font-size: 0.85rem; }
    ol {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.25rem;
      margin: 0;
      padding: 0;
      list-style: none;
    }
    li { display: inline-flex; align-items: center; gap: 0.25rem; }
    a { color: var(--adm-primary, #0a5cbd); text-decoration: none; }
    a:hover { text-decoration: underline; }
    span { color: var(--adm-text-muted, #475569); }
    .sep { color: var(--adm-text-subtle, #94a3b8); }
  `,
})
export class BreadcrumbComponent {
  readonly items = input.required<readonly BreadcrumbItem[]>();
}
