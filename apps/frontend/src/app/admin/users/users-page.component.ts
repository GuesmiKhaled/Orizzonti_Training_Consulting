import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, catchError, debounceTime, of, switchMap, tap } from 'rxjs';
import {
  RolesService,
  UsersService,
} from '../../core/api/entities/access.services';
import { ToastService } from '../../core/toast/toast.service';
import {
  AdminRole,
  AdminUserPage,
  AuthUser,
} from '../../services/orizzonti-api.service';
import {
  ConfirmDialogComponent,
  DataTableComponent,
  PageHeaderComponent,
  RowAction,
  RowActionEvent,
  TableColumn,
  TableQuery,
} from '../../shared/ui';
import { displayName, maskPhone } from './user-format';
import { UserFormModalComponent } from './user-form-modal.component';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-users-page',
  standalone: true,
  imports: [
    ConfirmDialogComponent,
    DataTableComponent,
    PageHeaderComponent,
    UserFormModalComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './users-page.component.html',
  styleUrl: '../pages/page-common.scss',
})
export class UsersPageComponent implements OnInit {
  private readonly usersApi = inject(UsersService);
  private readonly rolesApi = inject(RolesService);
  private readonly toast = inject(ToastService);

  protected readonly users = signal<readonly AuthUser[]>([]);
  protected readonly total = signal(0);
  protected readonly loading = signal(true);
  protected readonly roles = signal<readonly AdminRole[]>([]);
  protected readonly roleFilter = signal<number | null>(null);
  protected readonly editing = signal<AuthUser | 'new' | null>(null);
  protected readonly deleting = signal<AuthUser | null>(null);
  protected readonly pageSize = PAGE_SIZE;

  private query: Pick<TableQuery, 'search' | 'page'> = { search: '', page: 0 };
  private readonly reload = new Subject<void>();

  protected readonly columns: readonly TableColumn<AuthUser>[] = [
    { key: 'name', header: 'Name', value: (u) => displayName(u) },
    { key: 'username', header: 'Username' },
    { key: 'role', header: 'Role', value: (u) => u.role ?? 'No role' },
    { key: 'email', header: 'Email', value: (u) => u.email ?? '—' },
    { key: 'phone', header: 'Phone', value: (u) => maskPhone(u.phone) },
    {
      key: 'status',
      header: 'Status',
      tag: (u) => ({
        label: u.isActive ? 'Active' : 'Inactive',
        tone: u.isActive ? 'success' : 'neutral',
      }),
    },
  ];
  protected readonly actions: readonly RowAction[] = [
    { id: 'edit', label: 'Edit' },
    { id: 'delete', label: 'Delete', tone: 'danger' },
  ];
  protected readonly rowId = (user: AuthUser): number => user.id;

  constructor() {
    this.reload
      .pipe(
        debounceTime(250),
        tap(() => this.loading.set(true)),
        switchMap(() =>
          this.usersApi
            .listPage(this.query.page, PAGE_SIZE, this.query.search, this.roleFilter())
            .pipe(catchError(() => of(null))),
        ),
        takeUntilDestroyed(inject(DestroyRef)),
      )
      .subscribe((result) => this.show(result));
  }

  ngOnInit(): void {
    this.rolesApi.list().subscribe((roles) => this.roles.set(roles));
    this.reload.next();
  }

  protected onQuery(query: TableQuery): void {
    this.query = { search: query.search, page: query.page };
    this.reload.next();
  }

  protected onRoleFilter(event: Event): void {
    const value = Number((event.target as HTMLSelectElement).value);
    this.roleFilter.set(value || null);
    this.query = { ...this.query, page: 0 };
    this.reload.next();
  }

  protected onAction(event: RowActionEvent<AuthUser>): void {
    (event.action === 'edit' ? this.editing : this.deleting).set(event.row);
  }

  protected refresh(): void {
    this.reload.next();
  }

  protected confirmDelete(user: AuthUser): void {
    this.deleting.set(null);
    this.usersApi.remove(user.id).subscribe(() => {
      this.toast.success(`${user.username} deleted.`);
      this.refresh();
    });
  }

  private show(result: AdminUserPage | null): void {
    if (result) {
      this.users.set(result.items);
      this.total.set(result.total);
    }
    this.loading.set(false);
  }
}
