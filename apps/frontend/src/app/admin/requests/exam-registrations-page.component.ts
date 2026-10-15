import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { ExamRegistrationsService } from '../../core/api/entities/language.services';
import { ToastService } from '../../core/toast/toast.service';
import { ExamRegistrationItem } from '../../services/orizzonti-api.service';
import {
  ConfirmDialogComponent,
  DataTableComponent,
  PageHeaderComponent,
  RowAction,
  RowActionEvent,
  TableColumn,
  Tone,
} from '../../shared/ui';
import { formatDate } from '../languages/language-format';

const TONES: Readonly<Record<ExamRegistrationItem['status'], Tone>> = {
  pending: 'warning',
  accepted: 'success',
  rejected: 'danger',
};

@Component({
  selector: 'app-exam-registrations-page',
  standalone: true,
  imports: [ConfirmDialogComponent, DataTableComponent, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header
      title="Exam registrations"
      subtitle="Accept or reject requests. Pending and accepted requests hold a place."
    />
    <app-data-table
      title="Registrations"
      searchPlaceholder="Search applicant, language or level"
      [rows]="registrations()"
      [columns]="columns"
      [actions]="actions"
      [rowId]="rowId"
      [loading]="loading()"
      emptyMessage="No registrations found."
      (actionTriggered)="onAction($event)"
    >
      <select
        table-toolbar
        class="toolbar-filter"
        aria-label="Filter by status"
        (change)="onFilter($event)"
      >
        <option value="">All statuses</option>
        <option value="pending">Pending</option>
        <option value="accepted">Accepted</option>
        <option value="rejected">Rejected</option>
      </select>
    </app-data-table>
    @if (deleting(); as registration) {
      <app-confirm-dialog
        title="Delete registration"
        [message]="'Delete the registration from ' + registration.fullName + '?'"
        confirmLabel="Delete"
        [danger]="true"
        (confirmed)="confirmDelete(registration)"
        (cancelled)="deleting.set(null)"
      />
    }
  `,
  styleUrl: '../pages/page-common.scss',
})
export class ExamRegistrationsPageComponent implements OnInit {
  private readonly registrationsApi = inject(ExamRegistrationsService);
  private readonly toast = inject(ToastService);

  protected readonly registrations = signal<readonly ExamRegistrationItem[]>([]);
  protected readonly loading = signal(true);
  protected readonly deleting = signal<ExamRegistrationItem | null>(null);
  private status = '';

  protected readonly columns: readonly TableColumn<ExamRegistrationItem>[] = [
    { key: 'fullName', header: 'Applicant', sortable: true },
    {
      key: 'contact',
      header: 'Contact',
      value: (r) => [r.email, r.phone].filter(Boolean).join(' · '),
    },
    {
      key: 'exam',
      header: 'Exam',
      value: (r) =>
        `${r.languageName ?? ''} ${r.cefrLevel ?? ''} · ${formatDate(r.examDate)}`.trim(),
      sortValue: (r) => Date.parse(r.examDate ?? ''),
      sortable: true,
    },
    {
      key: 'createdAt',
      header: 'Applied',
      sortable: true,
      value: (r) => formatDate(r.createdAt),
      sortValue: (r) => Date.parse(r.createdAt),
    },
    {
      key: 'status',
      header: 'Status',
      value: (r) => r.status,
      tag: (r) => ({ label: r.status, tone: TONES[r.status] }),
    },
  ];
  protected readonly actions: readonly RowAction[] = [
    { id: 'accepted', label: 'Accept' },
    { id: 'rejected', label: 'Reject' },
    { id: 'delete', label: 'Delete', tone: 'danger' },
  ];
  protected readonly rowId = (registration: ExamRegistrationItem): number => registration.id;

  ngOnInit(): void {
    this.load();
  }

  protected onFilter(event: Event): void {
    this.status = (event.target as HTMLSelectElement).value;
    this.load();
  }

  protected onAction(event: RowActionEvent<ExamRegistrationItem>): void {
    if (event.action === 'delete') {
      this.deleting.set(event.row);
      return;
    }
    const status = event.action as ExamRegistrationItem['status'];
    if (event.row.status === status) {
      return;
    }
    this.registrationsApi.update(event.row.id, { status }).subscribe(() => {
      this.toast.success(`Registration ${status}.`);
      this.load();
    });
  }

  protected confirmDelete(registration: ExamRegistrationItem): void {
    this.deleting.set(null);
    this.registrationsApi.remove(registration.id).subscribe(() => {
      this.toast.success('Registration deleted.');
      this.load();
    });
  }

  private load(): void {
    this.loading.set(true);
    this.registrationsApi.listByStatus(this.status).subscribe({
      next: (items) => {
        this.registrations.set(items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
