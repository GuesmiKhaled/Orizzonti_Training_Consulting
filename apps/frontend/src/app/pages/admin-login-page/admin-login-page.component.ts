import { Component, AfterViewInit, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
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
          <img
            src="/img/log_orizzonti.png"
            alt="Orizzonti Training & Consulting"
          />
        </div>
        <h1>Admin login</h1>
        <p class="subtitle">Sign in to the backoffice.</p>

        @if (message) {
          <div
            class="status"
            [class.error]="isError"
            [attr.role]="isError ? 'alert' : 'status'"
          >
            {{ message }}
          </div>
        }

        @if (!otpStep) {
          <form [formGroup]="form" (ngSubmit)="submit()">
            <label class="field">
              <span class="label">Username</span>
              <input
                formControlName="username"
                autocomplete="username"
                [attr.aria-invalid]="
                  form.get('username')?.touched && form.get('username')?.invalid
                "
              />
              @if (
                form.get('username')?.touched && form.get('username')?.invalid
              ) {
                <span class="error" role="alert">Username is required.</span>
              }
            </label>

            <label class="field">
              <span class="label">Password</span>
              <input
                formControlName="password"
                type="password"
                autocomplete="current-password"
                [attr.aria-invalid]="
                  form.get('password')?.touched && form.get('password')?.invalid
                "
              />
              @if (
                form.get('password')?.touched && form.get('password')?.invalid
              ) {
                <span class="error" role="alert">
                  {{
                    form.get('password')?.errors?.['minlength']
                      ? 'At least 6 characters.'
                      : 'Password is required.'
                  }}
                </span>
              }
            </label>

            <button
              type="submit"
              class="login-btn"
              [disabled]="form.invalid || isSubmitting"
            >
              <span class="btn-label">{{
                isSubmitting ? 'Signing in...' : 'Login'
              }}</span>
              @if (isSubmitting) {
                <span class="spinner" aria-hidden="true"></span>
              }
            </button>
          </form>
        } @else {
          <form [formGroup]="otpForm" (ngSubmit)="submitOtp()" class="otp-form">
            @if (!isVerified) {
              <div class="otp-header">
                <div class="otp-icon" [class.shake]="otpError">
                  <svg
                    class="otp-icon-svg"
                    xmlns="http://www.w3.org/2000/svg"
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="16"></line>
                    <line x1="12" y1="18" x2="12.01" y2="18"></line>
                  </svg>
                </div>
                <h2 class="otp-title">Verify your identity</h2>
                <p class="otp-hint">
                  We sent a verification code to your email. Enter it below to
                  complete sign-in.
                </p>
              </div>

              <div class="otp-inputs" [class.shake]="otpError" [class.error]="otpError">
                @for (digit of otpDigits; track $index; let i = $index) {
                  <input
                    #otpInput
                    class="otp-input"
                    type="text"
                    inputmode="numeric"
                    autocomplete="one-time-code"
                    maxlength="1"
                    [value]="otpDigits[i]"
                    [attr.aria-label]="'Verification code digit ' + (i + 1)"
                    [attr.aria-invalid]="
                      otpError || (otpForm.get('code')?.touched && otpForm.get('code')?.invalid)
                    "
                    [disabled]="isSubmitting"
                    (input)="onOtpInput($event, i)"
                    (keydown)="onOtpKeydown($event, i)"
                    (paste)="onOtpPaste($event, i)"
                    (focus)="onOtpFocus(i)"
                  />
                }
              </div>

              @if (otpError) {
                <span class="otp-error" role="alert">
                  Invalid verification code. Please try again.
                </span>
              }

              <button
                type="submit"
                class="login-btn otp-verify-btn"
                [disabled]="otpForm.invalid || isSubmitting"
              >
                @if (isSubmitting) {
                  <span class="spinner" aria-hidden="true"></span>
                }
                <span class="btn-label">{{
                  isSubmitting ? 'Verifying...' : 'Verify'
                }}</span>
              </button>

              <button
                type="button"
                class="back-btn"
                (click)="cancelOtp()"
                [disabled]="isSubmitting"
              >
                Back to login
              </button>
            } @else {
              <div class="otp-success">
                <div class="checkmark-wrapper">
                  <svg class="checkmark" xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <p class="otp-success-message">Verified successfully!</p>
              </div>
            }
          </form>
        }
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
      transition:
        border-color 150ms ease,
        box-shadow 150ms ease;
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
      transition:
        background 150ms ease,
        transform 100ms ease;
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
    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
    .otp-hint {
      margin: 0 0 1rem;
      font-size: 0.85rem;
      color: var(--adm-text-muted, #475569);
      line-height: 1.4;
    }
    .back-btn {
      margin-top: 0.5rem;
      background: none;
      border: none;
      color: var(--adm-text-muted, #475569);
      font: inherit;
      font-size: 0.85rem;
      cursor: pointer;
      text-decoration: underline;
      padding: 0.5rem 0;
    }
    .back-btn:hover:not(:disabled) {
      color: var(--adm-text, #1f2937);
    }
    .back-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    /* ===== OTP verification styles ===== */
    .otp-form {
      display: grid;
      gap: 1rem;
      animation: otpFadeIn 0.5s ease-out;
    }

    @keyframes otpFadeIn {
      from {
        opacity: 0;
        transform: translateY(8px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .otp-header {
      display: grid;
      place-items: center;
      gap: 0.75rem;
      margin-bottom: 0.25rem;
    }

    .otp-icon {
      width: 56px;
      height: 56px;
      display: grid;
      place-items: center;
      background: var(--adm-primary-bg, #d7efe4);
      color: var(--adm-primary-dark, #0a4a44);
      border-radius: 50%;
      animation: otpIconScale 0.5s ease-out;
    }

    @keyframes otpIconScale {
      from {
        opacity: 0;
        transform: scale(0.8);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }

    .otp-inputs {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 0.5rem;
      margin: 0.25rem 0;
      transition: transform 0.2s ease;
    }

    .otp-inputs.shake {
      animation: otpShake 0.4s ease-in-out;
    }

    @keyframes otpShake {
      0%, 100% { transform: translateX(0); }
      20%, 60% { transform: translateX(-4px); }
      40%, 80% { transform: translateX(4px); }
    }

    .otp-inputs.error {
      color: var(--adm-danger, #cf4429);
    }

    .otp-inputs input {
      width: 100%;
      height: 56px;
      border: 1px solid var(--adm-input-border, #10231f29);
      border-radius: var(--adm-radius-tile, 12px);
      background: var(--adm-input-bg, #ffffff);
      color: var(--adm-text, #10231f);
      font-size: 1.5rem;
      font-weight: 600;
      text-align: center;
      text-transform: uppercase;
      letter-spacing: 0.5ch;
      transition:
        border-color 0.2s ease,
        box-shadow 0.2s ease,
        background-color 0.2s ease;
    }

    .otp-inputs input:focus-visible {
      outline: none;
      border-color: var(--adm-primary, #0d5c55);
      box-shadow: 0 0 0 4px var(--adm-focus-ring, rgba(13, 92, 85, 0.25));
    }

    .otp-inputs input:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .otp-inputs.error input {
      border-color: var(--adm-danger, #cf4429);
    }

    .otp-inputs.error input:focus-visible {
      border-color: var(--adm-danger, #cf4429);
      box-shadow: 0 0 0 4px rgba(207, 68, 41, 0.25);
    }

    .otp-error {
      margin-top: 0.25rem;
      font-size: 0.8rem;
      color: var(--adm-danger, #cf4429);
      animation: otpErrorFade 0.25s ease-out;
    }

    @keyframes otpErrorFade {
      from { opacity: 0; transform: translateY(4px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .otp-verify-btn {
      height: 48px;
      border: 0;
      border-radius: var(--adm-radius-pill, 999px);
      background: var(--adm-primary, #0d5c55);
      color: var(--adm-text-on-primary, #f1fbf7);
      font: inherit;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      transition:
        background 0.2s ease,
        transform 0.1s ease;
    }

    .otp-verify-btn:hover:not(:disabled) {
      background: var(--adm-primary-dark, #0a4a44);
    }

    .otp-verify-btn:active:not(:disabled) {
      transform: scale(0.98);
    }

    .otp-verify-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .otp-verify-btn:focus-visible {
      outline: 2px solid var(--adm-primary, #0d5c55);
      outline-offset: 2px;
    }

    .otp-success {
      display: grid;
      place-items: center;
      gap: 1rem;
      padding: 2rem 0;
      animation: otpSuccessFade 0.4s ease-out;
    }

    @keyframes otpSuccessFade {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .checkmark-wrapper {
      width: 64px;
      height: 64px;
      display: grid;
      place-items: center;
      background: var(--adm-success-light, #dcfce7);
      color: var(--adm-success-dark, #15803d);
      border-radius: 50%;
      animation: otpCheckmarkPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    @keyframes otpCheckmarkPop {
      0% { transform: scale(0); opacity: 0; }
      70% { transform: scale(1.15); }
      100% { transform: scale(1); opacity: 1; }
    }

    .checkmark {
      width: 32px;
      height: 32px;
      animation: otpCheckmarkDraw 0.6s ease-out;
    }

    @keyframes otpCheckmarkDraw {
      0% { stroke-dashoffset: 50; }
      100% { stroke-dashoffset: 0; }
    }

    .otp-success-message {
      margin: 0;
      font-size: 1rem;
      color: var(--adm-text, #10231f);
      font-weight: 500;
    }

    .back-btn {
      margin-top: 0.5rem;
      background: none;
      border: none;
      color: var(--adm-text-muted, #586a65);
      font: inherit;
      font-size: 0.85rem;
      cursor: pointer;
      text-decoration: underline;
      padding: 0.5rem 0;
    }

    .back-btn:hover:not(:disabled) {
      color: var(--adm-text, #10231f);
    }

    .back-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    [data-theme='dark'] .otp-title {
      color: var(--adm-text, #e5efec);
    }

    @media (prefers-reduced-motion: reduce) {
      .spinner {
        animation: none;
      }
      .login-btn {
        transition: none;
      }
      .otp-form {
        animation: none;
      }
      .otp-icon {
        animation: none;
      }
      .otp-inputs.shake {
        animation: none;
      }
      .otp-error {
        animation: none;
      }
      .otp-success {
        animation: none;
      }
      .checkmark-wrapper {
        animation: none;
      }
      .checkmark {
        animation: none;
      }
    }
  `,
})
export class AdminLoginPageComponent implements AfterViewInit {
  isSubmitting = false;
  message = '';
  isError = false;
  otpStep = false;
  isVerified = false;
  otpError = false;
  private challengeId = '';
  readonly form: ReturnType<FormBuilder['group']>;
  readonly otpForm: ReturnType<FormBuilder['group']>;

  /** Six individual digit values for the visual OTP inputs. Single source of truth remains `code` form control. */
  otpDigits: string[] = Array(6).fill('');

  @ViewChildren('otpInput', { read: ElementRef })
  otpInputs!: QueryList<ElementRef<HTMLInputElement>>;

  constructor(
    private readonly fb: FormBuilder,
    private readonly apiService: OrizzontiApiService,
    private readonly router: Router,
  ) {
    this.form = this.fb.group({
      username: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
    this.otpForm = this.fb.group({
      code: [
        '',
        [
          Validators.required,
          Validators.minLength(6),
          Validators.maxLength(6),
          Validators.pattern(/^\d{6}$/),
        ],
      ],
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.focusInput(0), 0);
  }

  submit() {
    if (this.form.invalid || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    this.message = '';
    this.isError = false;

    const value = this.form.getRawValue() as {
      username: string;
      password: string;
    };
    this.apiService.loginAdmin(value).subscribe({
      next: (response) => {
        if ('challengeRequired' in response && response.challengeRequired) {
          this.challengeId = response.challengeId;
          this.otpStep = true;
          this.isSubmitting = false;
          setTimeout(() => this.focusInput(0), 0);
          this.message = response.email
            ? `A verification code was sent to ${this.maskEmail(response.email)}.`
            : 'A verification code was sent to your email.';
          this.isError = false;
          return;
        }
        this.handleAuthSuccess(response);
      },
      error: () => {
        this.isError = true;
        this.message = 'Invalid username or password.';
        this.isSubmitting = false;
      },
    });
  }

  submitOtp() {
    if (this.otpForm.invalid || this.isSubmitting) {
      return;
    }
    this.isSubmitting = true;
    this.message = '';
    this.isError = false;
    this.otpError = false;

    const code = (this.otpForm.get('code')?.value ?? '') as string;
    this.apiService
      .completeOtpVerification({ challengeId: this.challengeId, code })
      .subscribe({
        next: (response) => {
          this.isVerified = true;
          this.handleAuthSuccess(response);
        },
        error: () => {
          this.isError = true;
          this.message = 'Invalid or expired verification code.';
          this.isSubmitting = false;
          this.otpError = true;
          setTimeout(() => {
            this.otpError = false;
          }, 400);
        },
      });
  }

  cancelOtp() {
    this.otpStep = false;
    this.isVerified = false;
    this.otpError = false;
    this.challengeId = '';
    this.otpForm.reset();
    this.otpDigits = Array(6).fill('');
    this.message = '';
    this.isError = false;
  }

  private handleAuthSuccess(response: {
    user: { mustChangePassword?: boolean };
  }) {
    this.message = 'Login successful.';
    this.isError = false;
    this.router
      .navigateByUrl(
        response.user.mustChangePassword ? '/change-password' : '/admin',
      )
      .then((navigated) => {
        if (!navigated) {
          this.isSubmitting = false;
          this.isError = true;
          this.message =
            'Login succeeded but navigation failed. Please reload.';
        }
      })
      .catch(() => {
        this.isSubmitting = false;
        this.isError = true;
        this.message = 'Login succeeded but navigation failed. Please reload.';
      });
  }

  private maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (!domain || !local) return email;
    const visible = local.slice(0, 2);
    return `${visible}${'•'.repeat(Math.max(local.length - 2, 1))}@${domain}`;
  }

  /* ========================================================================
     OTP digit input management
     ======================================================================== */

  /** Synchronise the visual digit array with the single `code` form control. */
  private syncFormControl(): void {
    const code = this.otpDigits.join('');
    const control = this.otpForm.get('code');
    if (control) {
      control.setValue(code);
    }
  }

  /** Focus the OTP input at the given index. */
  private focusInput(index: number): void {
    const inputs = this.otpInputs?.toArray();
    if (inputs && inputs.length > index) {
      inputs[index].nativeElement.focus();
    }
  }

  onOtpInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '');

    if (value.length > 1) {
      value = value[0];
    }

    if (value.length === 1) {
      this.otpDigits[index] = value;
      input.value = value;
      this.syncFormControl();
      if (index < 5) {
        this.focusInput(index + 1);
      }
    } else {
      this.otpDigits[index] = '';
      input.value = '';
      this.syncFormControl();
    }
  }

  onOtpKeydown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace') {
      event.preventDefault();
      const inputs = this.otpInputs?.toArray();
      const input = inputs?.[index]?.nativeElement as HTMLInputElement;
      if (this.otpDigits[index]) {
        this.otpDigits[index] = '';
        input.value = '';
        this.syncFormControl();
      } else if (index > 0) {
        this.focusInput(index - 1);
        this.otpDigits[index - 1] = '';
        (inputs[index - 1].nativeElement as HTMLInputElement).value = '';
        this.syncFormControl();
      }
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      if (index > 0) {
        this.focusInput(index - 1);
      }
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      if (index < 5) {
        this.focusInput(index + 1);
      }
    }
  }

  onOtpPaste(event: ClipboardEvent, index: number): void {
    event.preventDefault();
    const clipboardData = event.clipboardData;
    if (!clipboardData) return;

    const pasted = clipboardData.getData('text');
    const digits = pasted.replace(/\D/g, '').slice(0, 6);
    if (digits.length === 0) return;

    let pos = index;
    for (const digit of digits) {
      if (pos > 5) break;
      this.otpDigits[pos] = digit;
      const inputs = this.otpInputs?.toArray();
      const el = inputs?.[pos]?.nativeElement as HTMLInputElement;
      if (el) el.value = digit;
      pos++;
    }

    this.syncFormControl();
    const focusPos = Math.min(pos - 1, 5);
    this.focusInput(focusPos);
  }

  onOtpFocus(index: number): void {
    // Visual focus styling is handled by CSS :focus-visible on the input.
  }
}
