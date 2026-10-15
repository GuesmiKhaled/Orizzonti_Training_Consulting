import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { BlogsService } from '../../core/api/entities/content.services';
import { ToastService } from '../../core/toast/toast.service';
import { BlogItem } from '../../services/orizzonti-api.service';
import {
  ConfirmDialogComponent,
  DataTableComponent,
  PageHeaderComponent,
  RowAction,
  RowActionEvent,
  TableColumn,
} from '../../shared/ui';
import { formatDate } from '../languages/language-format';

@Component({
  selector: 'app-blogs-page',
  standalone: true,
  imports: [ConfirmDialogComponent, DataTableComponent, PageHeaderComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header title="Blogs" subtitle="News posts shown on the public site." />
    <app-data-table
      title="Posts"
      searchPlaceholder="Search title or slug"
      [rows]="posts()"
      [columns]="columns"
      [actions]="actions"
      [rowId]="rowId"
      [loading]="loading()"
      emptyMessage="No posts yet."
      (actionTriggered)="onAction($event)"
    >
      <a table-toolbar class="btn btn-primary" routerLink="new">New post</a>
    </app-data-table>
    @if (deleting(); as post) {
      <app-confirm-dialog
        title="Delete post"
        [message]="'Delete &quot;' + post.title + '&quot;? This cannot be undone.'"
        confirmLabel="Delete"
        [danger]="true"
        (confirmed)="confirmDelete(post)"
        (cancelled)="deleting.set(null)"
      />
    }
  `,
  styleUrl: '../pages/page-common.scss',
})
export class BlogsPageComponent implements OnInit {
  private readonly blogsApi = inject(BlogsService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  protected readonly posts = signal<readonly BlogItem[]>([]);
  protected readonly loading = signal(true);
  protected readonly deleting = signal<BlogItem | null>(null);

  protected readonly columns: readonly TableColumn<BlogItem>[] = [
    { key: 'title', header: 'Title', sortable: true },
    { key: 'slug', header: 'Slug' },
    {
      key: 'status',
      header: 'Status',
      value: (p) => (p.isPublished === false ? 'Draft' : 'Published'),
      tag: (p) => ({
        label: p.isPublished === false ? 'Draft' : 'Published',
        tone: p.isPublished === false ? 'neutral' : 'success',
      }),
    },
    {
      key: 'createdAt',
      header: 'Created',
      sortable: true,
      value: (p) => formatDate(p.createdAt),
      sortValue: (p) => Date.parse(p.createdAt ?? ''),
    },
  ];
  protected readonly actions: readonly RowAction[] = [
    { id: 'edit', label: 'Edit' },
    { id: 'delete', label: 'Delete', tone: 'danger' },
  ];
  protected readonly rowId = (post: BlogItem): number => post.id ?? 0;

  ngOnInit(): void {
    this.load();
  }

  protected onAction(event: RowActionEvent<BlogItem>): void {
    if (event.action === 'edit') {
      void this.router.navigate(['/admin/blogs', event.row.id]);
    } else {
      this.deleting.set(event.row);
    }
  }

  protected confirmDelete(post: BlogItem): void {
    this.deleting.set(null);
    this.blogsApi.remove(post.id ?? 0).subscribe(() => {
      this.toast.success('Post deleted.');
      this.load();
    });
  }

  private load(): void {
    this.loading.set(true);
    this.blogsApi.list().subscribe({
      next: (posts) => {
        this.posts.set(posts);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
