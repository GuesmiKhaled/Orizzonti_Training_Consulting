import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { forkJoin } from 'rxjs';
import {
  PermissionsService,
  RolesService,
} from '../../../core/api/entities/access.services';
import { ToastService } from '../../../core/toast/toast.service';
import { AdminPermission, AdminRole } from '../../../services/orizzonti-api.service';
import {
  ConfirmDialogComponent,
  FormFieldComponent,
  PageHeaderComponent,
  StatusTagComponent,
} from '../../../shared/ui';
import { errorOf } from '../../languages/wizard/language-wizard.forms';
import { groupPermissions, permissionLabel } from './permission-groups';

const LOCKED_ROLE = 'super-admin';

@Component({
  selector: 'app-roles-page',
  standalone: true,
  imports: [
    ConfirmDialogComponent,
    FormFieldComponent,
    PageHeaderComponent,
    ReactiveFormsModule,
    StatusTagComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './roles-page.component.html',
  styleUrls: ['../../pages/page-common.scss', './roles-page.component.scss'],
})
export class RolesPageComponent implements OnInit {
  private readonly rolesApi = inject(RolesService);
  private readonly permissionsApi = inject(PermissionsService);
  private readonly toast = inject(ToastService);

  protected readonly roles = signal<readonly AdminRole[]>([]);
  protected readonly permissions = signal<readonly AdminPermission[]>([]);
  protected readonly selected = signal<AdminRole | null>(null);
  protected readonly creating = signal(false);
  protected readonly checked = signal<ReadonlySet<number>>(new Set());
  protected readonly saving = signal(false);
  protected readonly deleting = signal<AdminRole | null>(null);
  protected readonly loading = signal(true);

  protected readonly groups = computed(() => groupPermissions(this.permissions()));
  protected readonly locked = computed(() => this.selected()?.name === LOCKED_ROLE);
  protected readonly label = permissionLabel;
  protected readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2), Validators.maxLength(80)],
    }),
    description: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(500)],
    }),
  });

  ngOnInit(): void {
    this.load();
  }

  protected nameError(): string {
    return errorOf(this.form.controls.name);
  }

  protected select(role: AdminRole): void {
    this.selected.set(role);
    this.creating.set(false);
    this.form.reset({ name: role.name, description: role.description ?? '' });
    this.checked.set(new Set(role.permissions.map((p) => p.id)));
    this.applyLock(role.name === LOCKED_ROLE);
  }

  protected startNew(): void {
    this.selected.set(null);
    this.creating.set(true);
    this.form.reset({ name: '', description: '' });
    this.checked.set(new Set());
    this.applyLock(false);
  }

  protected toggle(id: number, event: Event): void {
    const on = (event.target as HTMLInputElement).checked;
    this.checked.update((current) => {
      const next = new Set(current);
      if (on) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { name, description } = this.form.getRawValue();
    const body = {
      name: name.trim(),
      description: description.trim(),
      permissionIds: [...this.checked()],
    };
    const current = this.selected();
    this.saving.set(true);
    const request = current
      ? this.rolesApi.update(current.id, body)
      : this.rolesApi.create(body);
    request.subscribe({
      next: (role) => {
        this.toast.success(current ? 'Role updated.' : 'Role created.');
        this.saving.set(false);
        this.load(role.id);
      },
      error: () => this.saving.set(false),
    });
  }

  protected confirmDelete(role: AdminRole): void {
    this.deleting.set(null);
    this.rolesApi.remove(role.id).subscribe(() => {
      this.toast.success(`${role.name} deleted.`);
      this.load();
    });
  }

  private load(selectId?: number): void {
    forkJoin([this.rolesApi.list(), this.permissionsApi.list()]).subscribe({
      next: ([roles, permissions]) => {
        this.roles.set(roles);
        this.permissions.set(permissions);
        this.loading.set(false);
        const target = roles.find((r) => r.id === selectId) ?? roles[0];
        if (target) {
          this.select(target);
        } else {
          this.startNew();
        }
      },
      error: () => this.loading.set(false),
    });
  }

  private applyLock(locked: boolean): void {
    if (locked) {
      this.form.disable({ emitEvent: false });
    } else {
      this.form.enable({ emitEvent: false });
    }
  }
}
