import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { OrizzontiApiService } from '../../services/orizzonti-api.service';

@Component({
  selector: 'app-contact-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="page-hero">
      <div class="container">
        <h1>Contact</h1>
        <nav class="breadcrumb" aria-label="Breadcrumb">
          <a routerLink="/">Home</a>
          <span class="sep" aria-hidden="true">/</span>
          <span aria-current="page">Contact</span>
        </nav>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="section-header">
          <p class="section-kicker">Get In Touch</p>
          <h2 class="section-title">Contact Us</h2>
        </div>
        <div class="form-wrap">
          @if (message()) {
            <div
              class="alert"
              [class.alert-success]="!isError()"
              [class.alert-error]="isError()"
              [attr.role]="isError() ? 'alert' : 'status'"
            >
              {{ message() }}
            </div>
          }
          <form [formGroup]="form" (ngSubmit)="submit()" class="contact-form" novalidate>
            <div class="form-field">
              <label for="contactName">Name</label>
              <input id="contactName" formControlName="name" autocomplete="name" />
              @if (form.controls.name.touched && form.controls.name.invalid) {
                <small class="field-error">Name is required.</small>
              }
            </div>
            <div class="form-field">
              <label for="contactEmail">Email</label>
              <input id="contactEmail" formControlName="email" type="email" autocomplete="email" />
              @if (form.controls.email.touched && form.controls.email.invalid) {
                <small class="field-error">A valid email is required.</small>
              }
            </div>
            <div class="form-field">
              <label for="contactSubject">Subject</label>
              <input id="contactSubject" formControlName="subject" />
              @if (form.controls.subject.touched && form.controls.subject.invalid) {
                <small class="field-error">Subject is required.</small>
              }
            </div>
            <div class="form-field">
              <label for="contactMessage">Message</label>
              <textarea id="contactMessage" formControlName="message" rows="5"></textarea>
              @if (form.controls.message.touched && form.controls.message.invalid) {
                <small class="field-error">Message must be at least 10 characters.</small>
              }
            </div>
            <button
              type="submit"
              class="btn-primary"
              [disabled]="form.invalid || isSubmitting()"
            >
              @if (isSubmitting()) {
                <span class="spinner" aria-hidden="true"></span> Sending...
              } @else {
                Send message
              }
            </button>
          </form>
        </div>
      </div>
    </section>
  `,
  styles: `
    :host { display: block; }
    .container { max-width: 1140px; margin: 0 auto; padding: 0 1.5rem; }
    .section { padding: 3.5rem 0; background: var(--adm-surface, #fff); }

    .page-hero {
      background: linear-gradient(135deg, var(--adm-primary, #0a5cbd), var(--adm-primary-dark, #084a99));
      padding: 4rem 0;
    }
    .page-hero h1 { color: #fff; font-size: clamp(2rem, 4vw, 2.5rem); margin: 0 0 0.5rem; }
    .breadcrumb { display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; }
    .breadcrumb a { color: rgba(255,255,255,0.85); text-decoration: none; }
    .breadcrumb a:hover { color: #fff; text-decoration: underline; }
    .breadcrumb .sep { color: rgba(255,255,255,0.6); }
    .breadcrumb span[aria-current] { color: #fff; }

    .section-header { text-align: center; margin-bottom: 2.5rem; }
    .section-kicker {
      letter-spacing: 4px; font-size: 0.9rem; font-weight: 600;
      color: var(--adm-primary, #0a5cbd); text-transform: uppercase;
      margin: 0 0 0.5rem;
    }
    .section-title {
      font-size: clamp(1.5rem, 3vw, 2.25rem); font-weight: 600;
      margin: 0; color: var(--adm-text, #1f2937);
    }

    .form-wrap { max-width: 760px; margin: 0 auto; }
    .alert {
      padding: 1rem 1.25rem; border-radius: var(--adm-radius-card, 6px);
      margin-bottom: 1.25rem; font-size: 0.95rem;
    }
    .alert-success { background: var(--adm-success-bg, #dcfce7); color: var(--adm-success-dark, #166534); }
    .alert-error { background: var(--adm-danger-bg, #fee2e2); color: var(--adm-danger-dark, #b91c1c); }

    .contact-form { display: grid; gap: 1.25rem; }
    .form-field { display: grid; gap: 0.4rem; }
    .form-field label { font-size: 0.9rem; font-weight: 600; color: var(--adm-text, #1f2937); }
    .form-field input, .form-field textarea {
      width: 100%; padding: 0.65rem 0.85rem;
      border: 1px solid var(--adm-border-strong, #cbd5e1);
      border-radius: var(--adm-radius-card, 6px);
      background: var(--adm-surface, #fff);
      color: var(--adm-text, #1f2937);
      font: inherit; font-size: 0.95rem;
      transition: border-color 150ms ease, box-shadow 150ms ease;
    }
    .form-field input:focus, .form-field textarea:focus {
      outline: none;
      border-color: var(--adm-primary, #0a5cbd);
      box-shadow: 0 0 0 3px var(--adm-focus-ring, rgba(10,92,189,0.2));
    }
    .form-field input:focus-visible, .form-field textarea:focus-visible {
      outline: 2px solid var(--adm-primary, #0a5cbd); outline-offset: 2px;
      box-shadow: none;
    }
    .field-error { color: var(--adm-danger-dark, #b91c1c); font-size: 0.8rem; }

    .btn-primary {
      display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem;
      padding: 0.7rem 1.5rem; border: 0;
      border-radius: var(--adm-radius-card, 6px);
      background: var(--adm-primary, #0a5cbd);
      color: var(--adm-text-on-primary, #fff);
      font: inherit; font-size: 0.95rem; font-weight: 600;
      cursor: pointer;
      transition: background 150ms ease, transform 100ms ease;
    }
    .btn-primary:hover:not(:disabled) { background: var(--adm-primary-dark, #084a99); }
    .btn-primary:active:not(:disabled) { transform: scale(0.98); }
    .btn-primary:focus-visible { outline: 2px solid var(--adm-primary, #0a5cbd); outline-offset: 2px; }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

    .spinner {
      width: 16px; height: 16px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    @media (prefers-reduced-motion: reduce) {
      .spinner { animation: none; }
      .btn-primary, .form-field input, .form-field textarea { transition: none; }
    }
  `,
})
export class ContactPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly apiService = inject(OrizzontiApiService);

  protected readonly isSubmitting = signal(false);
  protected readonly message = signal('');
  protected readonly isError = signal(false);

  readonly form = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    subject: ['', Validators.required],
    message: ['', [Validators.required, Validators.minLength(10)]],
  });

  protected submit(): void {
    if (this.form.invalid || this.isSubmitting()) return;
    this.isSubmitting.set(true);
    this.message.set('');
    this.isError.set(false);

    const value = this.form.getRawValue();
    this.apiService.submitContact({
      name: value.name ?? '',
      email: value.email ?? '',
      subject: value.subject ?? '',
      message: value.message ?? '',
    }).subscribe({
      next: (response) => {
        this.message.set(response.message ?? 'Message sent successfully.');
        this.form.reset();
        this.isSubmitting.set(false);
      },
      error: () => {
        this.isError.set(true);
        this.message.set('Unable to send the message right now. Please try again later.');
        this.isSubmitting.set(false);
      },
    });
  }
}
