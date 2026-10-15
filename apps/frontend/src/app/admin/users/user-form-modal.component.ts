import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import {
  CreateUserDto,
  UpdateUserDto,
  UsersService,
} from '../../core/api/entities/access.services';
import { ToastService } from '../../core/toast/toast.service';
import { AdminRole, AuthUser } from '../../services/orizzonti-api.service';
import { FormFieldComponent, ModalShellComponent } from '../../shared/ui';
import { errorOf } from '../languages/wizard/language-wizard.forms';

interface UserFormValue {
  username: string;
  fullName: string;
  email: string;
  phone: string;
  password: string;
  roleId: number | null;
  isActive: boolean;
}

const text = (validators: ValidatorFn[] = []) =>
  new FormControl('', { nonNullable: true, validators });

@Component({
  selector: 'app-user-form-modal',
  standalone: true,
  imports: [ReactiveFormsModule, FormFieldComponent, ModalShellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './user-form-modal.component.html',
  styleUrl: '../pages/page-common.scss',
})
export class UserFormModalComponent implements OnInit {
  /** Null creates a new user. */
  readonly user = input<AuthUser | null>(null);
  readonly roles = input.required<readonly AdminRole[]>();
  readonly saved = output<void>();
  readonly closed = output<void>();

  private readonly usersApi = inject(UsersService);
  private readonly toast = inject(ToastService);

  protected readonly saving = signal(false);
  protected readonly form = new FormGroup({
    username: text([Validators.required, Validators.minLength(3), Validators.maxLength(80)]),
    fullName: text([Validators.maxLength(200)]),
    email: text([Validators.email, Validators.maxLength(200)]),
    phone: text([Validators.pattern(/^[+\d\s().-]*$/), Validators.maxLength(100)]),
    password: text([Validators.minLength(8)]),
    roleId: new FormControl<number | null>(null, [Validators.required]),
    isActive: new FormControl(true, { nonNullable: true }),
  });

  ngOnInit(): void {
    const user = this.user();
    if (!user) {
      this.form.controls.password.addValidators(Validators.required);
      return;
    }
    this.form.patchValue({
      username: user.username,
      fullName: user.fullName ?? '',
      email: user.email ?? '',
      phone: user.phone ?? '',
      roleId: user.roleId ?? null,
      isActive: user.isActive !== false,
    });
  }

  protected error(field: 'username' | 'email' | 'phone' | 'password' | 'roleId'): string {
    const control = this.form.controls[field];
    if (field === 'email' && control.errors?.['email']) {
      return control.touched ? 'Enter a valid email address' : '';
    }
    if (field === 'password' && control.errors?.['minlength']) {
      return control.touched ? 'At least 8 characters' : '';
    }
    return errorOf(control);
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const roleId = v.roleId as number;
    const current = this.user();
    this.saving.set(true);
    const request = current
      ? this.usersApi.update(current.id, this.updateDto(v, roleId))
      : this.usersApi.create(this.createDto(v, roleId));
    request.subscribe({
      next: () => {
        this.toast.success(current ? 'User updated.' : 'User created.');
        this.saved.emit();
        this.closed.emit();
      },
      error: () => this.saving.set(false),
    });
  }

  private createDto(v: UserFormValue, roleId: number): CreateUserDto {
    const blank = (value: string) => value.trim() || undefined;
    return {
      username: v.username.trim(),
      password: v.password,
      roleId,
      isActive: v.isActive,
      fullName: blank(v.fullName),
      email: blank(v.email),
      phone: blank(v.phone),
    };
  }

  private updateDto(v: UserFormValue, roleId: number): UpdateUserDto {
    const clearable = (value: string) => value.trim() || null;
    return {
      username: v.username.trim(),
      roleId,
      isActive: v.isActive,
      fullName: clearable(v.fullName),
      email: clearable(v.email),
      phone: clearable(v.phone),
      ...(v.password ? { password: v.password } : {}),
    };
  }
}
