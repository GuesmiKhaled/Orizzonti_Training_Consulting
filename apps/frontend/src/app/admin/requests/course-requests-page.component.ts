import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CourseRequestsService } from '../../core/api/entities/content.services';
import { ToastService } from '../../core/toast/toast.service';
import { CourseRequestItem } from '../../services/orizzonti-api.service';
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

type Status = NonNullable<CourseRequestItem['status']>;

const TONES: Readonly<Record<Status, Tone>> = {
  new: 'info',
  reviewed: 'warning',
  accepted: 'success',
  rejected: 'danger',
};

const ACTION_STATUS: Readonly<Record<string, Status>> = {
  review: 'reviewed',
  accept: 'accepted',
  reject: 'rejected',
};

@Component({
  selector: 'app-course-requests-page',
  standalone: true,
  imports: [ConfirmDialogComponent, DataTableComponent, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header
      title="Course requests"
      subtitle="Enquiries sent from the public course request form."
    />
    <app-data-table
      title="Requests"
      searchPlaceholder="Search name, email or course"
      [rows]="visible()"
      [columns]="columns"
      [actions]="actions"
      [rowId]="rowId"
      [loading]="loading()"
      emptyMessage="No requests found."
      (actionTriggered)="onAction($event)"
    >
      <select
        table-toolbar
        class="toolbar-filter"
        aria-label="Filter by status"
        (change)="onFilter($event)"
      >
        <option value="">All statuses</option>
        <option value="new">New</option>
        <option value="reviewed">Reviewed</option>
        <option value="accepted">Accepted</option>
        <option value="rejected">Rejected</option>
      </select>
    </app-data-table>
    @if (deleting(); as request) {
      <app-confirm-dialog
        title="Delete request"
        [message]="'Delete the request from ' + request.fullName + '?'"
        confirmLabel="Delete"
        [danger]="true"
        (confirmed)="confirmDelete(request)"
        (cancelled)="deleting.set(null)"
      />
    }
  `,
  styleUrl: '../pages/page-common.scss',
})
export class CourseRequestsPageComponent implements OnInit {
  private readonly requestsApi = inject(CourseRequestsService);
  private readonly toast = inject(ToastService);

  private readonly requests = signal<readonly CourseRequestItem[]>([]);
  protected readonly filter = signal('');
  protected readonly loading = signal(true);
  protected readonly deleting = signal<CourseRequestItem | null>(null);
  protected readonly visible = computed(() =>
    this.filter()
      ? this.requests().filter((r) => (r.status ?? 'new') === this.filter())
      : this.requests(),
  );

  protected readonly columns: readonly TableColumn<CourseRequestItem>[] = [
    { key: 'fullName', header: 'Applicant', sortable: true },
    { key: 'email', header: 'Email' },
    { key: 'phone', header: 'Phone', value: (r) => r.phone ?? '—' },
    { key: 'courseName', header: 'Course', sortable: true },
    {
      key: 'message',
      header: 'Message',
      value: (r) => (r.message ?? '').slice(0, 60),
    },
    {
      key: 'createdAt',
      header: 'Received',
      sortable: true,
      value: (r) => formatDate(r.createdAt),
      sortValue: (r) => Date.parse(r.createdAt ?? ''),
    },
    {
      key: 'status',
      header: 'Status',
      value: (r) => r.status ?? 'new',
      tag: (r) => ({
        label: r.status ?? 'new',
        tone: TONES[r.status ?? 'new'],
      }),
    },
  ];
  protected readonly actions: readonly RowAction[] = [
    { id: 'review', label: 'Review' },
    { id: 'accept', label: 'Accept' },
    { id: 'reject', label: 'Reject' },
    { id: 'delete', label: 'Delete', tone: 'danger' },
  ];
  protected readonly rowId = (request: CourseRequestItem): number => request.id ?? 0;

  ngOnInit(): void {
    this.load();
  }

  protected onFilter(event: Event): void {
    this.filter.set((event.target as HTMLSelectElement).value);
  }

  protected onAction(event: RowActionEvent<CourseRequestItem>): void {
    const status = ACTION_STATUS[event.action];
    if (status) {
      this.requestsApi.update(event.row.id ?? 0, { status }).subscribe(() => {
        this.toast.success(`Request ${status}.`);
        this.load();
      });
      return;
    }
    this.deleting.set(event.row);
  }

  protected confirmDelete(request: CourseRequestItem): void {
    this.deleting.set(null);
    this.requestsApi.remove(request.id ?? 0).subscribe(() => {
      this.toast.success('Request deleted.');
      this.load();
    });
  }

  private load(): void {
    this.loading.set(true);
    this.requestsApi.list().subscribe({
      next: (requests) => {
        this.requests.set(requests);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
