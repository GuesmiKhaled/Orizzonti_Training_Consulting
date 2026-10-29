import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';

@Component({
  selector: 'app-table-pagination',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="range">{{ range() }}</span>
    <div class="pages" role="navigation" aria-label="Pagination">
      <button
        type="button"
        class="nav-btn"
        [disabled]="page() <= 0"
        (click)="pageChange.emit(page() - 1)"
      >
        Previous
      </button>
      @for (p of pageNumbers(); track p) {
        @if (p === -1) {
          <span class="ellipsis" aria-hidden="true">…</span>
        } @else {
          <button
            type="button"
            class="page-btn"
            [class.active]="p === page()"
            [attr.aria-current]="p === page() ? 'page' : null"
            [attr.aria-label]="'Page ' + (p + 1)"
            (click)="pageChange.emit(p)"
          >
            {{ p + 1 }}
          </button>
        }
      }
      <button
        type="button"
        class="nav-btn"
        [disabled]="page() + 1 >= pageCount()"
        (click)="pageChange.emit(page() + 1)"
      >
        Next
      </button>
    </div>
    <label class="size">
      <span class="sr-only">Rows per page</span>
      <select [value]="pageSize()" (change)="onPageSizeChange($event)">
        @for (size of pageSizeOptions(); track size) {
          <option [value]="size">{{ size }}</option>
        }
      </select>
    </label>
  `,
  styles: `
    :host {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      color: var(--adm-text-muted, #475569);
      font-size: 0.8rem;
      flex-wrap: wrap;
    }
    .range {
      margin-right: auto;
    }
    .pages {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }
    button {
      border: 1px solid transparent;
      background: transparent;
      color: inherit;
      font: inherit;
      cursor: pointer;
      min-width: 28px;
      height: 28px;
      padding: 0 0.4rem;
      border-radius: var(--adm-radius-card, 6px);
      transition: background 150ms ease, color 150ms ease;
    }
    button:not(:disabled):hover {
      background: var(--adm-surface-hover, #f1f5f9);
      color: var(--adm-text, #1f2937);
    }
    button:disabled {
      opacity: 0.5;
      cursor: default;
    }
    .page-btn.active {
      background: var(--adm-primary, #0a5cbd);
      color: var(--adm-text-on-primary, #fff);
      border-color: var(--adm-primary, #0a5cbd);
    }
    .page-btn:focus-visible,
    .nav-btn:focus-visible {
      outline: 2px solid var(--adm-primary, #0a5cbd);
      outline-offset: 1px;
    }
    .ellipsis {
      padding: 0 0.25rem;
      color: var(--adm-text-subtle, #94a3b8);
    }
    .size select {
      padding: 0.25rem 0.5rem;
      border: 1px solid var(--adm-border-strong, #cbd5e1);
      border-radius: var(--adm-radius-card, 6px);
      background: var(--adm-surface, #fff);
      color: var(--adm-text, #1f2937);
      font: inherit;
      font-size: 0.8rem;
      cursor: pointer;
    }
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
  `,
})
export class TablePaginationComponent {
  readonly page = input.required<number>();
  readonly pageSize = input.required<number>();
  readonly total = input.required<number>();
  readonly pageSizeOptions = input<readonly number[]>([5, 10, 25, 50]);
  readonly pageChange = output<number>();
  readonly pageSizeChange = output<number>();

  protected readonly pageCount = computed(() =>
    Math.max(1, Math.ceil(this.total() / this.pageSize())),
  );

  protected readonly range = computed(() => {
    const total = this.total();
    if (total === 0) {
      return '0 of 0';
    }
    const start = this.page() * this.pageSize() + 1;
    const end = Math.min(total, start + this.pageSize() - 1);
    return `${start}-${end} of ${total}`;
  });

  /** Compact page list with ellipsis (-1) for large counts. */
  protected readonly pageNumbers = computed<number[]>(() => {
    const current = this.page();
    const count = this.pageCount();
    if (count <= 7) {
      return Array.from({ length: count }, (_, i) => i);
    }
    const pages = new Set<number>([0, current - 1, current, current + 1, count - 1]);
    const result: number[] = [];
    for (let i = 0; i < count; i++) {
      if (pages.has(i)) {
        result.push(i);
      } else if (result[result.length - 1] !== -1) {
        result.push(-1);
      }
    }
    return result;
  });

  protected onPageSizeChange(event: Event): void {
    this.pageSizeChange.emit(Number((event.target as HTMLSelectElement).value));
  }
}
