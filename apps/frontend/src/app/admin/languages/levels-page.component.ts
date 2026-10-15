import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  LanguageLevelsService,
  LanguagesService,
} from '../../core/api/entities/language.services';
import { ToastService } from '../../core/toast/toast.service';
import { LanguageItem } from '../../services/orizzonti-api.service';
import {
  ConfirmDialogComponent,
  DataTableComponent,
  PageHeaderComponent,
  RowAction,
  RowActionEvent,
  TableColumn,
} from '../../shared/ui';
import { LevelRow, toLevelRows } from './language-format';
import { LanguageWizardComponent } from './wizard/language-wizard.component';

@Component({
  selector: 'app-levels-page',
  standalone: true,
  imports: [
    ConfirmDialogComponent,
    DataTableComponent,
    LanguageWizardComponent,
    PageHeaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header title="Levels" subtitle="Every CEFR level across all languages." />
    <app-data-table
      title="Levels"
      searchPlaceholder="Search language or level"
      [rows]="rows()"
      [columns]="columns"
      [actions]="actions"
      [rowId]="rowId"
      [loading]="loading()"
      emptyMessage="No levels yet. Add them from the Languages dashboard."
      (actionTriggered)="onAction($event)"
    />
    @if (editing(); as row) {
      <app-language-wizard
        [languageId]="row.languageId"
        [initialStep]="1"
        (saved)="load()"
        (closed)="editing.set(null)"
      />
    }
    @if (deleting(); as row) {
      <app-confirm-dialog
        title="Delete level"
        [message]="'Delete ' + row.cefrLevel + ' (' + row.languageName + ') and all its exams?'"
        confirmLabel="Delete"
        [danger]="true"
        (confirmed)="confirmDelete(row)"
        (cancelled)="deleting.set(null)"
      />
    }
  `,
  styles: `
    :host {
      display: grid;
      gap: 1rem;
    }
  `,
})
export class LevelsPageComponent implements OnInit {
  private readonly languagesApi = inject(LanguagesService);
  private readonly levelsApi = inject(LanguageLevelsService);
  private readonly toast = inject(ToastService);

  private readonly languages = signal<readonly LanguageItem[]>([]);
  protected readonly rows = computed(() => toLevelRows(this.languages()));
  protected readonly loading = signal(true);
  protected readonly editing = signal<LevelRow | null>(null);
  protected readonly deleting = signal<LevelRow | null>(null);

  protected readonly columns: readonly TableColumn<LevelRow>[] = [
    { key: 'languageName', header: 'Language', sortable: true },
    { key: 'cefrLevel', header: 'Level', sortable: true },
    { key: 'courseHours', header: 'Hours' },
    { key: 'price', header: 'Price' },
    { key: 'examsCount', header: 'Exams', sortable: true },
    {
      key: 'active',
      header: 'Status',
      value: (r) => (r.active ? 'Active' : 'Inactive'),
      tag: (r) => ({
        label: r.active ? 'Active' : 'Inactive',
        tone: r.active ? 'success' : 'neutral',
      }),
    },
  ];
  protected readonly actions: readonly RowAction[] = [
    { id: 'edit', label: 'Edit' },
    { id: 'delete', label: 'Delete', tone: 'danger' },
  ];
  protected readonly rowId = (row: LevelRow): number => row.id;

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.languagesApi.list().subscribe({
      next: (languages) => {
        this.languages.set(languages);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  protected onAction(event: RowActionEvent<LevelRow>): void {
    (event.action === 'edit' ? this.editing : this.deleting).set(event.row);
  }

  protected confirmDelete(row: LevelRow): void {
    this.deleting.set(null);
    this.levelsApi.remove(row.id, [row.languageId]).subscribe(() => {
      this.toast.success(`${row.cefrLevel} deleted.`);
      this.load();
    });
  }
}
