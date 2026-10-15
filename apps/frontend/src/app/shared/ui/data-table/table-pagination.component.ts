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
    <button type="button" [disabled]="page() <= 0" (click)="pageChange.emit(page() - 1)">
      Previous
    </button>
    <button
      type="button"
      [disabled]="page() + 1 >= pageCount()"
      (click)="pageChange.emit(page() + 1)"
    >
      Next
    </button>
  `,
  styles: `
    :host {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      color: #475569;
      font-size: 0.8rem;
    }
    button {
      border: 0;
      background: transparent;
      color: inherit;
      font: inherit;
      cursor: pointer;
    }
    button:not(:disabled):hover {
      color: var(--adm-primary);
    }
    button:disabled {
      opacity: 0.5;
      cursor: default;
    }
  `,
})
export class TablePaginationComponent {
  readonly page = input.required<number>();
  readonly pageSize = input.required<number>();
  readonly total = input.required<number>();
  readonly pageChange = output<number>();

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
}
