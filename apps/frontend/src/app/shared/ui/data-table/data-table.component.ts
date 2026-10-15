import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  input,
  output,
  signal,
} from '@angular/core';
import { DataTableCellDirective } from './data-table-cell.directive';
import {
  CellValue,
  RowAction,
  RowActionEvent,
  SortDirection,
  TableColumn,
  TableQuery,
  compareCells,
  readCell,
} from './data-table.types';
import { TablePaginationComponent } from './table-pagination.component';
import { StatusTagComponent } from '../status-tag/status-tag.component';

/**
 * `client` mode searches, sorts and pages `rows` itself.
 * `server` mode shows `rows` as given (one page), uses `total`, and relies on
 * the parent to react to `queryChange`.
 */
@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [NgTemplateOutlet, StatusTagComponent, TablePaginationComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './data-table.component.html',
  styleUrl: './data-table.component.scss',
})
export class DataTableComponent<T extends object> {
  readonly rows = input.required<readonly T[]>();
  readonly columns = input.required<readonly TableColumn<T>[]>();
  readonly actions = input<readonly RowAction[]>([]);
  readonly title = input('');
  readonly mode = input<'client' | 'server'>('client');
  readonly total = input<number | null>(null);
  readonly pageSize = input(10);
  readonly loading = input(false);
  readonly searchable = input(true);
  readonly searchPlaceholder = input('Search');
  readonly emptyMessage = input('No results found.');
  readonly rowId = input<(row: T) => string | number>();

  readonly queryChange = output<TableQuery>();
  readonly actionTriggered = output<RowActionEvent<T>>();

  protected readonly cells = contentChildren(DataTableCellDirective);

  protected readonly search = signal('');
  protected readonly sortKey = signal<string | null>(null);
  protected readonly sortDirection = signal<SortDirection>('asc');
  private readonly requestedPage = signal(0);

  protected readonly matched = computed<readonly T[]>(() => {
    if (this.mode() === 'server') {
      return this.rows();
    }
    const term = this.search().trim().toLowerCase();
    const columns = this.columns();
    const filtered = term
      ? this.rows().filter((row) =>
          columns.some((column) =>
            String(readCell(row, column) ?? '')
              .toLowerCase()
              .includes(term),
          ),
        )
      : this.rows();
    const column = columns.find((c) => c.key === this.sortKey());
    if (!column) {
      return filtered;
    }
    const factor = this.sortDirection() === 'asc' ? 1 : -1;
    return [...filtered].sort(
      (a, b) => factor * compareCells(readCell(a, column), readCell(b, column)),
    );
  });

  protected readonly totalCount = computed(() =>
    this.mode() === 'server'
      ? (this.total() ?? this.rows().length)
      : this.matched().length,
  );

  protected readonly page = computed(() => {
    const last = Math.max(
      0,
      Math.ceil(this.totalCount() / this.pageSize()) - 1,
    );
    return Math.min(this.requestedPage(), last);
  });

  protected readonly visibleRows = computed<readonly T[]>(() => {
    if (this.mode() === 'server') {
      return this.matched();
    }
    const start = this.page() * this.pageSize();
    return this.matched().slice(start, start + this.pageSize());
  });

  protected valueOf(row: T, column: TableColumn<T>): CellValue {
    return readCell(row, column);
  }

  protected templateFor(key: string) {
    return this.cells().find((cell) => cell.key() === key)?.template ?? null;
  }

  protected idOf(row: T, index: number): string | number {
    return this.rowId()?.(row) ?? index;
  }

  protected ariaSort(column: TableColumn<T>): 'ascending' | 'descending' | 'none' {
    if (this.sortKey() !== column.key) {
      return 'none';
    }
    return this.sortDirection() === 'asc' ? 'ascending' : 'descending';
  }

  protected onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
    this.requestedPage.set(0);
    this.emitQuery();
  }

  protected toggleSort(column: TableColumn<T>): void {
    if (!column.sortable) {
      return;
    }
    if (this.sortKey() === column.key) {
      this.sortDirection.update((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      this.sortKey.set(column.key);
      this.sortDirection.set('asc');
    }
    this.requestedPage.set(0);
    this.emitQuery();
  }

  protected goToPage(page: number): void {
    this.requestedPage.set(page);
    this.emitQuery();
  }

  private emitQuery(): void {
    this.queryChange.emit({
      search: this.search(),
      sortKey: this.sortKey(),
      sortDirection: this.sortDirection(),
      page: this.page(),
      pageSize: this.pageSize(),
    });
  }
}
