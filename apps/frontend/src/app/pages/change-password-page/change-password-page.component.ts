import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { describeHttpError } from '../../core/http/error.interceptor';
import { ToastService } from '../../core/toast/toast.service';

export const MIN_PASSWORD_LENGTH = 12;

/** The new password must be confirmed and must differ from the current one. */
export function passwordsValidator(group: AbstractControl): ValidationErrors | null {
  const { currentPassword, newPassword, confirmPassword } = group.getRawValue() as {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  };
  const errors: ValidationErrors = {};
  if (newPassword && confirmPassword && newPassword !== confirmPassword) {
    errors['mismatch'] = true;
  }
  if (newPassword && currentPassword && newPassword === currentPassword) {
    errors['unchanged'] = true;
  }
  return Object.keys(errors).length ? errors : null;
}

@Component({
  selector: 'app-change-password-page',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './change-password-page.component.html',
  styleUrl: './change-password-page.component.scss',
})
export class ChangePasswordPageComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  protected readonly minLength = MIN_PASSWORD_LENGTH;
  protected readonly saving = signal(false);
  protected readonly serverError = signal('');

  protected readonly form = new FormGroup(
    {
      currentPassword: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      newPassword: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(MIN_PASSWORD_LENGTH)],
      }),
      confirmPassword: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
    },
    { validators: passwordsValidator },
  );

  protected fieldError(name: 'currentPassword' | 'newPassword' | 'confirmPassword'): string {
    const control = this.form.controls[name];
    if (!control.invalid || !(control.touched || control.dirty)) {
      return '';
    }
    if (control.errors?.['required']) {
      return 'Required';
    }
    return control.errors?.['minlength']
      ? `Use at least ${MIN_PASSWORD_LENGTH} characters`
      : '';
  }

  protected groupError(): string {
    const touched = this.form.controls.confirmPassword.touched;
    if (this.form.errors?.['unchanged'] && touched) {
      return 'The new password must be different from the current one.';
    }
    return this.form.errors?.['mismatch'] && touched
      ? 'The two new passwords do not match.'
      : '';
  }

  protected submit(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
    const { currentPassword, newPassword } = this.form.getRawValue();
    this.saving.set(true);
    this.serverError.set('');
    this.auth.changePassword(currentPassword, newPassword).subscribe({
      next: () => {
        this.toast.success('Password changed.');
        void this.router.navigateByUrl('/admin');
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.serverError.set(
          error instanceof HttpErrorResponse
            ? describeHttpError(error)
            : 'The password could not be changed.',
        );
      },
    });
  }

  protected signOut(): void {
    this.auth.logout();
  }
}
