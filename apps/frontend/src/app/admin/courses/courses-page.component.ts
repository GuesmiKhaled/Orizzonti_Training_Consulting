import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CoursesService } from '../../core/api/entities/content.services';
import { ToastService } from '../../core/toast/toast.service';
import { CourseItem } from '../../services/orizzonti-api.service';
import {
  ConfirmDialogComponent,
  DataTableComponent,
  PageHeaderComponent,
  RowAction,
  RowActionEvent,
  TableColumn,
} from '../../shared/ui';
import { CourseFormModalComponent } from './course-form-modal.component';

@Component({
  selector: 'app-courses-page',
  standalone: true,
  imports: [
    ConfirmDialogComponent,
    CourseFormModalComponent,
    DataTableComponent,
    PageHeaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header title="Courses" subtitle="Courses shown on the public site." />
    <app-data-table
      title="Courses"
      searchPlaceholder="Search courses"
      [rows]="courses()"
      [columns]="columns"
      [actions]="actions"
      [rowId]="rowId"
      [loading]="loading()"
      emptyMessage="No courses yet."
      (actionTriggered)="onAction($event)"
    >
      <button table-toolbar type="button" class="btn btn-primary" (click)="editing.set('new')">
        Add course
      </button>
    </app-data-table>
    @if (editing(); as target) {
      <app-course-form-modal
        [course]="target === 'new' ? null : target"
        (saved)="load()"
        (closed)="editing.set(null)"
      />
    }
    @if (deleting(); as course) {
      <app-confirm-dialog
        title="Delete course"
        [message]="'Delete &quot;' + course.name + '&quot;? This cannot be undone.'"
        confirmLabel="Delete"
        [danger]="true"
        (confirmed)="confirmDelete(course)"
        (cancelled)="deleting.set(null)"
      />
    }
  `,
  styleUrl: '../pages/page-common.scss',
})
export class CoursesPageComponent implements OnInit {
  private readonly coursesApi = inject(CoursesService);
  private readonly toast = inject(ToastService);

  protected readonly courses = signal<readonly CourseItem[]>([]);
  protected readonly loading = signal(true);
  protected readonly editing = signal<CourseItem | 'new' | null>(null);
  protected readonly deleting = signal<CourseItem | null>(null);

  protected readonly columns: readonly TableColumn<CourseItem>[] = [
    { key: 'name', header: 'Name', sortable: true },
    { key: 'level', header: 'Level', sortable: true },
    { key: 'price', header: 'Price' },
    { key: 'startDate', header: 'Start date', sortable: true },
  ];
  protected readonly actions: readonly RowAction[] = [
    { id: 'edit', label: 'Edit' },
    { id: 'delete', label: 'Delete', tone: 'danger' },
  ];
  protected readonly rowId = (course: CourseItem): number => course.id ?? 0;

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.coursesApi.list().subscribe({
      next: (courses) => {
        this.courses.set(courses);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  protected onAction(event: RowActionEvent<CourseItem>): void {
    (event.action === 'edit' ? this.editing : this.deleting).set(event.row);
  }

  protected confirmDelete(course: CourseItem): void {
    this.deleting.set(null);
    this.coursesApi.remove(course.id ?? 0).subscribe(() => {
      this.toast.success('Course deleted.');
      this.load();
    });
  }
}
