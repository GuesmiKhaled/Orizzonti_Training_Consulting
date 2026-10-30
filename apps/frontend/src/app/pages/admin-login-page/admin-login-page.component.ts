import { Component } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { OrizzontiApiService } from '../../services/orizzonti-api.service';
import { ThemeToggleComponent } from '../../shared/ui';

@Component({
  selector: 'app-admin-login-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule, ThemeToggleComponent],
  template: `
    <section class="login-shell admin-theme">
      <div class="theme-corner"><app-theme-toggle /></div>
      <div class="login-card">
        <div class="brand">
          <img src="/img/log_orizzonti.png" alt="Orizzonti Training & Consulting" />
        </div>
        <h1>Admin login</h1>
        <p class="subtitle">Sign in to the backoffice.</p>

        @if (message) {
          <div class="status" [class.error]="isError" [attr.role]="isError ? 'alert' : 'status'">
            {{ message }}
          </div>
        }

        <form [formGroup]="form" (ngSubmit)="submit()">
          <label class="field">
            <span class="label">Username</span>
            <input
              formControlName="username"
              autocomplete="username"
              [attr.aria-invalid]="form.get('username')?.touched && form.get('username')?.invalid"
            />
            @if (form.get('username')?.touched && form.get('username')?.invalid) {
              <span class="error" role="alert">Username is required.</span>
            }
          </label>

          <label class="field">
            <span class="label">Password</span>
            <input
              formControlName="password"
              type="password"
              autocomplete="current-password"
              [attr.aria-invalid]="form.get('password')?.touched && form.get('password')?.invalid"
            />
            @if (form.get('password')?.touched && form.get('password')?.invalid) {
              <span class="error" role="alert">
                {{ form.get('password')?.errors?.['minlength'] ? 'At least 6 characters.' : 'Password is required.' }}
              </span>
            }
          </label>

          <button type="submit" class="login-btn" [disabled]="form.invalid || isSubmitting">
            <span class="btn-label">{{ isSubmitting ? 'Signing in...' : 'Login' }}</span>
            @if (isSubmitting) {
              <span class="spinner" aria-hidden="true"></span>
            }
          </button>
        </form>
      </div>
    </section>
  `,
  styles: `
    .login-shell {
      position: relative;
      min-height: 100dvh;
      display: grid;
      place-items: center;
      background: var(--adm-bg, #f1f4f9);
      padding: 2rem;
    }
    .theme-corner {
      position: absolute;
      top: 1rem;
      right: 1rem;
    }
    .login-card {
      width: min(420px, 100%);
      padding: 2.25rem 2rem;
      background: var(--adm-surface, #fff);
      border: 1px solid var(--adm-border, #eef1f6);
      border-radius: var(--adm-radius-card, 6px);
      box-shadow: 0 8px 24px var(--adm-shadow-color, rgba(15, 23, 42, 0.12));
    }
    .brand {
      display: grid;
      place-items: center;
      margin-bottom: 1.25rem;
    }
    .brand img {
      max-height: 48px;
      width: auto;
    }
    h1 {
      margin: 0 0 0.25rem;
      font-size: 1.5rem;
      color: var(--adm-text, #1f2937);
    }
    .subtitle {
      margin: 0 0 1.5rem;
      color: var(--adm-text-muted, #475569);
      font-size: 0.9rem;
    }
    .status {
      padding: 0.75rem 1rem;
      border-radius: var(--adm-radius-card, 6px);
      background: var(--adm-success-light, #dcfce7);
      color: var(--adm-success-dark, #15803d);
      font-size: 0.85rem;
      margin-bottom: 1rem;
    }
    .status.error {
      background: var(--adm-danger-light, #fee2e2);
      color: var(--adm-danger-dark, #b91c1c);
    }
    form {
      display: grid;
      gap: 1rem;
    }
    .field {
      display: grid;
      gap: 0.4rem;
    }
    .label {
      font-size: 0.85rem;
      font-weight: 500;
      color: var(--adm-text, #1f2937);
    }
    input {
      padding: 0.7rem 0.85rem;
      border: 1px solid var(--adm-input-border, #cbd5e1);
      border-radius: var(--adm-radius-card, 6px);
      background: var(--adm-input-bg, #fff);
      color: var(--adm-text, #1f2937);
      font: inherit;
      font-size: 0.9rem;
      transition: border-color 150ms ease, box-shadow 150ms ease;
    }
    input:focus {
      outline: none;
      border-color: var(--adm-primary, #0a5cbd);
      box-shadow: 0 0 0 3px var(--adm-focus-ring, rgba(10, 92, 189, 0.35));
    }
    .error {
      font-size: 0.75rem;
      color: var(--adm-danger, #dc2626);
    }
    .login-btn {
      height: 44px;
      border: 0;
      border-radius: var(--adm-radius-card, 6px);
      background: var(--adm-primary, #0a5cbd);
      color: var(--adm-text-on-primary, #fff);
      font: inherit;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      transition: background 150ms ease, transform 100ms ease;
    }
    .login-btn:hover:not(:disabled) {
      background: var(--adm-primary-dark, #084a99);
    }
    .login-btn:active:not(:disabled) {
      transform: scale(0.98);
    }
    .login-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .login-btn:focus-visible {
      outline: 2px solid var(--adm-primary, #0a5cbd);
      outline-offset: 2px;
    }
    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    @media (prefers-reduced-motion: reduce) {
      .spinner { animation: none; }
      .login-btn { transition: none; }
    }
  `,
})
export class AdminLoginPageComponent {
  isSubmitting = false;
  message = '';
  isError = false;
  readonly form: ReturnType<FormBuilder['group']>;

  constructor(
    private readonly fb: FormBuilder,
    private readonly apiService: OrizzontiApiService,
    private readonly router: Router,
  ) {
    this.form = this.fb.group({
      username: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  submit() {
    if (this.form.invalid || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    this.message = '';
    this.isError = false;

    const value = this.form.getRawValue() as { username: string; password: string };
    this.apiService.loginAdmin(value).subscribe({
      next: (response) => {
        this.message = 'Login successful.';
        this.isSubmitting = false;
        this.router.navigateByUrl(
          response.user.mustChangePassword ? '/change-password' : '/admin',
        );
      },
      error: () => {
        this.isError = true;
        this.message = 'Invalid username or password.';
        this.isSubmitting = false;
      },
    });
  }
}
