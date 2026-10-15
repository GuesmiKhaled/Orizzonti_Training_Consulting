import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { OrizzontiApiService } from '../../services/orizzonti-api.service';

@Component({
  selector: 'app-admin-login-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <section class="login-shell">
      <div class="login-card">
        <h1>Admin login</h1>
        <div class="status" *ngIf="message" [class.error]="isError">
          {{ message }}
        </div>
        <form [formGroup]="form" (ngSubmit)="submit()">
          <label>
            <span>Username</span>
            <input formControlName="username" />
          </label>
          <label>
            <span>Password</span>
            <input formControlName="password" type="password" />
          </label>
          <button type="submit" [disabled]="form.invalid || isSubmitting">
            {{ isSubmitting ? 'Signing in...' : 'Login' }}
          </button>
        </form>
      </div>
    </section>
  `,
  styles: [
    `
      .login-shell {
        min-height: 70vh;
        display: grid;
        place-items: center;
        background: #f2f1f8;
        padding: 2rem;
      }
      .login-card {
        background: white;
        border-top: 4px solid #ff6600;
        border-radius: 4px;
        padding: 2rem;
        width: min(420px, 100%);
        box-shadow: 0 8px 24px rgba(68, 66, 90, 0.12);
      }
      h1 {
        margin-top: 0;
      }
      .status {
        padding: 0.8rem 1rem;
        border-radius: 10px;
        background: #eaf7ee;
        color: #1f6f42;
        margin-bottom: 1rem;
      }
      .status.error {
        background: #fdecec;
        color: #9f1c1c;
      }
      form {
        display: grid;
        gap: 1rem;
      }
      label {
        display: grid;
        gap: 0.45rem;
        font-weight: 600;
      }
      input {
        padding: 0.85rem 1rem;
        border: 1px solid #d8dbe2;
        border-radius: 10px;
      }
      button {
        background: #44425a;
        color: white;
        border: none;
        border-radius: 4px;
        padding: 0.9rem 1.3rem;
        font-weight: 700;
      }
      button[disabled] {
        opacity: 0.6;
        cursor: not-allowed;
      }
    `,
  ],
})
export class AdminLoginPageComponent {
  readonly form: FormGroup;
  isSubmitting = false;
  message = '';
  isError = false;

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

    this.apiService.loginAdmin(this.form.value).subscribe({
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
