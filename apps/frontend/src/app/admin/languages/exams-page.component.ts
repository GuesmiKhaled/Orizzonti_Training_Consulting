import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  ExamSessionsService,
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
import { ExamRow, formatDate, toExamRows } from './language-format';
import { LanguageWizardComponent } from './wizard/language-wizard.component';

@Component({
  selector: 'app-exams-page',
  standalone: true,
  imports: [
    ConfirmDialogComponent,
    DataTableComponent,
    LanguageWizardComponent,
    PageHeaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header title="Exams" subtitle="Every exam session across all languages." />
    <app-data-table
      title="Exam sessions"
      searchPlaceholder="Search language, level or status"
      [rows]="rows()"
      [columns]="columns"
      [actions]="actions"
      [rowId]="rowId"
      [loading]="loading()"
      emptyMessage="No exams scheduled yet."
      (actionTriggered)="onAction($event)"
    />
    @if (editing(); as row) {
      <app-language-wizard
        [languageId]="row.languageId"
        [initialStep]="2"
        (saved)="load()"
        (closed)="editing.set(null)"
      />
    }
    @if (deleting(); as row) {
      <app-confirm-dialog
        title="Delete exam"
        [message]="'Delete the ' + row.cefrLevel + ' exam on ' + date(row.examDate) + '? Registrations for it are removed too.'"
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
      grid-template-columns: minmax(0, 1fr);
      gap: 1rem;
    }
  `,
})
export class ExamsPageComponent implements OnInit {
  private readonly languagesApi = inject(LanguagesService);
  private readonly examsApi = inject(ExamSessionsService);
  private readonly toast = inject(ToastService);

  private readonly languages = signal<readonly LanguageItem[]>([]);
  protected readonly rows = computed(() => toExamRows(this.languages()));
  protected readonly loading = signal(true);
  protected readonly editing = signal<ExamRow | null>(null);
  protected readonly deleting = signal<ExamRow | null>(null);
  protected readonly date = formatDate;

  protected readonly columns: readonly TableColumn<ExamRow>[] = [
    { key: 'languageName', header: 'Language', sortable: true },
    { key: 'cefrLevel', header: 'Level', sortable: true },
    {
      key: 'examDate',
      header: 'Exam date',
      sortable: true,
      value: (r) => formatDate(r.examDate),
      sortValue: (r) => Date.parse(r.examDate),
    },
    {
      key: 'registration',
      header: 'Registration',
      value: (r) =>
        `${formatDate(r.registrationStart)} - ${formatDate(r.registrationDeadline)}`,
    },
    { key: 'places', header: 'Places' },
    {
      key: 'status',
      header: 'Status',
      tag: (r) => ({ label: r.status || 'Unknown', tone: r.open ? 'success' : 'neutral' }),
    },
  ];
  protected readonly actions: readonly RowAction[] = [
    { id: 'edit', label: 'Edit' },
    { id: 'delete', label: 'Delete', tone: 'danger' },
  ];
  protected readonly rowId = (row: ExamRow): number => row.id;

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

  protected onAction(event: RowActionEvent<ExamRow>): void {
    (event.action === 'edit' ? this.editing : this.deleting).set(event.row);
  }

  protected confirmDelete(row: ExamRow): void {
    this.deleting.set(null);
    this.examsApi.remove(row.id, [row.languageId, row.levelId]).subscribe(() => {
      this.toast.success('Exam deleted.');
      this.load();
    });
  }
}
