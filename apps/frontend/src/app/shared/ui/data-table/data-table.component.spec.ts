import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DataTableCellDirective } from './data-table-cell.directive';
import { DataTableComponent } from './data-table.component';
import {
  RowAction,
  RowActionEvent,
  TableColumn,
  TableQuery,
} from './data-table.types';

interface Row {
  readonly id: number;
  readonly name: string;
  readonly role: string;
  readonly active: boolean;
}

const ROWS: readonly Row[] = [
  { id: 1, name: 'Carla', role: 'Editor', active: true },
  { id: 2, name: 'Amel', role: 'Secretary', active: false },
  { id: 3, name: 'Sami', role: 'Editor', active: true },
  { id: 4, name: 'Bilel', role: 'Admin', active: true },
];

const COLUMNS: readonly TableColumn<Row>[] = [
  { key: 'name', header: 'Name', sortable: true },
  { key: 'role', header: 'Role' },
  {
    key: 'status',
    header: 'Status',
    value: (r) => (r.active ? 'Active' : 'Inactive'),
    tag: (r) => ({
      label: r.active ? 'Active' : 'Inactive',
      tone: r.active ? 'success' : 'neutral',
    }),
  },
];

const ACTIONS: readonly RowAction[] = [
  { id: 'edit', label: 'Edit' },
  { id: 'delete', label: 'Delete', tone: 'danger' },
];

describe('DataTableComponent', () => {
  let fixture: ComponentFixture<DataTableComponent<Row>>;
  let root: HTMLElement;
  let queries: TableQuery[];
  let actions: RowActionEvent<Row>[];

  const setup = (inputs: Record<string, unknown> = {}): void => {
    fixture = TestBed.createComponent<DataTableComponent<Row>>(DataTableComponent);
    fixture.componentRef.setInput('rows', ROWS);
    fixture.componentRef.setInput('columns', COLUMNS);
    for (const [name, value] of Object.entries(inputs)) {
      fixture.componentRef.setInput(name, value);
    }
    queries = [];
    actions = [];
    fixture.componentInstance.queryChange.subscribe((q) => queries.push(q));
    fixture.componentInstance.actionTriggered.subscribe((a) => actions.push(a));
    root = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  };

  const names = (): (string | undefined)[] =>
    Array.from(root.querySelectorAll('tbody tr')).map((tr) =>
      tr.querySelector('td')?.textContent?.trim(),
    );

  const typeSearch = (value: string): void => {
    const input = root.querySelector<HTMLInputElement>('input.search');
    if (input) {
      input.value = value;
      input.dispatchEvent(new Event('input'));
    }
    fixture.detectChanges();
  };

  const header = (text: string): HTMLButtonElement | undefined =>
    Array.from(root.querySelectorAll<HTMLButtonElement>('th .sort')).find((b) =>
      b.textContent?.includes(text),
    );

  describe('client mode', () => {
    it('renders headers, rows and the status tag column', () => {
      setup({ title: 'Users' });
      expect(root.querySelector('.panel-header')?.textContent).toContain('Users');
      expect(names()).toEqual(['Carla', 'Amel', 'Sami', 'Bilel']);
      expect(root.querySelectorAll('tbody app-status-tag').length).toBe(4);
    });

    it('filters rows by the search term across columns', () => {
      setup();
      typeSearch('editor');
      expect(names()).toEqual(['Carla', 'Sami']);
      typeSearch('inactive');
      expect(names()).toEqual(['Amel']);
    });

    it('sorts ascending, then descending, and reports aria-sort', () => {
      setup();
      header('Name')?.click();
      fixture.detectChanges();
      expect(names()).toEqual(['Amel', 'Bilel', 'Carla', 'Sami']);
      expect(root.querySelector('th')?.getAttribute('aria-sort')).toBe('ascending');

      header('Name')?.click();
      fixture.detectChanges();
      expect(names()).toEqual(['Sami', 'Carla', 'Bilel', 'Amel']);
      expect(root.querySelector('th')?.getAttribute('aria-sort')).toBe('descending');
    });

    it('sorts by sortValue when it differs from the displayed value', () => {
      const byAge: TableColumn<Row> = {
        key: 'label',
        header: 'Label',
        sortable: true,
        value: (r) => `#${r.id}`,
        sortValue: (r) => -r.id,
      };
      setup({ columns: [byAge] });
      header('Label')?.click();
      fixture.detectChanges();
      expect(names()).toEqual(['#4', '#3', '#2', '#1']);
    });

    it('does not offer sorting on non-sortable columns', () => {
      setup();
      expect(header('Role')).toBeUndefined();
    });

    it('paginates and shows the range', () => {
      setup({ pageSize: 3 });
      expect(names().length).toBe(3);
      expect(root.querySelector('app-table-pagination')?.textContent).toContain('1-3 of 4');

      const next = Array.from(root.querySelectorAll<HTMLButtonElement>('app-table-pagination button')).find(
        (b) => b.textContent?.includes('Next'),
      );
      next?.click();
      fixture.detectChanges();
      expect(names()).toEqual(['Bilel']);
      expect(root.querySelector('app-table-pagination')?.textContent).toContain('4-4 of 4');
      expect(next?.disabled).toBeTrue();
    });

    it('returns to the first page when searching', () => {
      setup({ pageSize: 2 });
      const next = Array.from(root.querySelectorAll<HTMLButtonElement>('app-table-pagination button')).find(
        (b) => b.textContent?.includes('Next'),
      );
      next?.click();
      fixture.detectChanges();
      typeSearch('a');
      expect(root.querySelector('app-table-pagination')?.textContent).toContain('1-');
    });

    it('shows the empty message when nothing matches', () => {
      setup({ emptyMessage: 'Nobody here.' });
      typeSearch('zzz');
      expect(root.querySelector('.state')?.textContent).toContain('Nobody here.');
      expect(root.querySelector('app-table-pagination')?.textContent).toContain('0 of 0');
    });

    it('shows a loading state instead of the empty message', () => {
      setup({ rows: [], loading: true });
      expect(root.querySelector('.state')?.textContent).toContain('Loading');
    });

    it('emits row actions with the row', () => {
      setup({ actions: ACTIONS, rowId: (r: Row) => r.id });
      const buttons = root.querySelectorAll<HTMLButtonElement>('tbody tr:nth-child(2) .row-actions button');
      buttons[1].click();
      expect(actions).toEqual([{ action: 'delete', row: ROWS[1] }]);
      expect(buttons[1].classList).toContain('danger');
    });

    it('hides the search box when not searchable', () => {
      setup({ searchable: false });
      expect(root.querySelector('input.search')).toBeNull();
    });

    it('emits the query when search, sort or page change', () => {
      setup({ pageSize: 2 });
      typeSearch('a');
      header('Name')?.click();
      expect(queries.map((q) => [q.search, q.sortKey, q.sortDirection, q.page])).toEqual([
        ['a', null, 'asc', 0],
        ['a', 'name', 'asc', 0],
      ]);
    });
  });

  describe('server mode', () => {
    it('shows rows as given, uses the total and does not filter locally', () => {
      setup({ mode: 'server', rows: ROWS.slice(0, 2), total: 37, pageSize: 2 });
      typeSearch('zzz');
      expect(names()).toEqual(['Carla', 'Amel']);
      expect(root.querySelector('app-table-pagination')?.textContent).toContain('1-2 of 37');
      expect(queries[queries.length - 1]).toEqual(
        jasmine.objectContaining({ search: 'zzz', page: 0, pageSize: 2 }),
      );
    });

    it('requests the next page', () => {
      setup({ mode: 'server', rows: ROWS.slice(0, 2), total: 5, pageSize: 2 });
      const next = Array.from(root.querySelectorAll<HTMLButtonElement>('app-table-pagination button')).find(
        (b) => b.textContent?.includes('Next'),
      );
      next?.click();
      expect(queries[queries.length - 1].page).toBe(1);
    });
  });
});

describe('DataTableComponent custom cells', () => {
  @Component({
    standalone: true,
    imports: [DataTableComponent, DataTableCellDirective],
    template: `
      <app-data-table [rows]="rows" [columns]="columns">
        <ng-template appCell="name" let-row>
          <strong class="custom">{{ label(row) }}</strong>
        </ng-template>
        <button table-toolbar type="button" class="add">Add</button>
      </app-data-table>
    `,
  })
  class HostComponent {
    readonly rows = ROWS;
    readonly columns = COLUMNS;

    label(row: unknown): string {
      return `#${(row as Row).name}`;
    }
  }

  it('renders a custom template for the matching column key', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const first = (fixture.nativeElement as HTMLElement).querySelector('tbody .custom');
    expect(first?.textContent).toBe('#Carla');
  });

  it('projects toolbar content', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('.toolbar-slot .add')).not.toBeNull();
  });
});
