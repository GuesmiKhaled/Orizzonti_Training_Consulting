import { Tone } from '../ui.types';

export type CellValue = string | number | null | undefined;

export interface TagCell {
  readonly label: string;
  readonly tone: Tone;
}

export interface TableColumn<T> {
  /** Unique id; also the property read from the row when `value` is omitted. */
  readonly key: string;
  readonly header: string;
  readonly sortable?: boolean;
  readonly value?: (row: T) => CellValue;
  /** Value used for sorting when it differs from what is displayed (e.g. a timestamp). */
  readonly sortValue?: (row: T) => CellValue;
  /** Renders the cell as a status pill (typed alternative to a custom template). */
  readonly tag?: (row: T) => TagCell;
}

export interface RowAction {
  readonly id: string;
  readonly label: string;
  readonly tone?: 'default' | 'danger';
}

export interface RowActionEvent<T> {
  readonly action: string;
  readonly row: T;
}

export type SortDirection = 'asc' | 'desc';

export interface TableQuery {
  readonly search: string;
  readonly sortKey: string | null;
  readonly sortDirection: SortDirection;
  /** Zero-based. */
  readonly page: number;
  readonly pageSize: number;
}

export function readCell<T extends object>(
  row: T,
  column: TableColumn<T>,
): CellValue {
  if (column.value) {
    return column.value(row);
  }
  const raw: unknown = (row as Record<string, unknown>)[column.key];
  if (raw === null || raw === undefined) {
    return raw;
  }
  return typeof raw === 'string' || typeof raw === 'number' ? raw : String(raw);
}

export function sortCell<T extends object>(
  row: T,
  column: TableColumn<T>,
): CellValue {
  return column.sortValue ? column.sortValue(row) : readCell(row, column);
}

export function compareCells(a: CellValue, b: CellValue): number {
  if (a == null && b == null) {
    return 0;
  }
  if (a == null) {
    return 1;
  }
  if (b == null) {
    return -1;
  }
  if (typeof a === 'number' && typeof b === 'number') {
    return a - b;
  }
  return String(a).localeCompare(String(b), undefined, { numeric: true });
}
