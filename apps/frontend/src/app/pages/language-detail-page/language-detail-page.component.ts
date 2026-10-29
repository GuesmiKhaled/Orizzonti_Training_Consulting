import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CefrLevelNamePipe } from '../../pipes/cefr-level-name.pipe';
import { ModalShellComponent } from '../../shared/ui';
import {
  OrizzontiApiService,
  LanguageItem,
  LanguageLevel,
  ExamSession,
} from '../../services/orizzonti-api.service';

interface RegistrationTarget {
  readonly level: LanguageLevel;
  readonly session: ExamSession;
}

@Component({
  selector: 'app-language-detail-page',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    CefrLevelNamePipe,
    ModalShellComponent,
    DatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="page-hero">
      <div class="container">
        @if (language()) {
          <h1>{{ language()!.name }} - Examination Calendar</h1>
        } @else if (!loading()) {
          <h1>Language Not Found</h1>
        }
        <nav class="breadcrumb" aria-label="Breadcrumb">
          <a routerLink="/">Home</a>
          <span class="sep" aria-hidden="true">/</span>
          <a routerLink="/courses">Languages</a>
          <span class="sep" aria-hidden="true">/</span>
          @if (language()) { <span aria-current="page">{{ language()!.name }}</span> }
        </nav>
      </div>
    </section>

    <section class="section">
      <div class="container">
        @if (loading()) {
          <p class="state-text">Loading language details...</p>
        } @else if (error()) {
          <div class="alert-error" role="alert">{{ error() }}</div>
        } @else if (language()) {
          <div class="language-info">
            <h2 class="language-name">{{ language()!.name }}</h2>
            @if (language()!.nativeName) {
              <p class="language-native">{{ language()!.nativeName }}</p>
            }
          </div>

          @if (levels().length === 0) {
            <div class="empty-state">No levels configured for this language yet.</div>
          } @else {
            @for (level of levels(); track level.id) {
              <div class="level-card">
                <h3 class="level-title">{{ level.cefrLevel }} - {{ level.cefrLevel | cefrLevelName }}</h3>
                <div class="table-scroll">
                  <table class="exam-table">
                    <thead>
                      <tr>
                        <th>Exam Date and Location</th>
                        <th>Period</th>
                        <th>Price</th>
                        <th>Online Subscription</th>
                      </tr>
                    </thead>
                    <tbody>
                      @if (!level.examSessions || level.examSessions.length === 0) {
                        <tr><td colspan="4" class="no-exams">No examinations scheduled for this level.</td></tr>
                      } @else {
                        @for (session of level.examSessions; track session.id) {
                          <tr class="exam-date-row">
                            <td colspan="4" class="exam-date-header">
                              <h5>
                                <span class="exam-date-label">Exam date</span>
                                {{ session.examDate | date: 'dd.MM.yyyy' }}
                              </h5>
                            </td>
                          </tr>
                          <tr class="exam-details-row" [class.not-bookable]="!session.isBookable">
                            <td class="cell-location">{{ session.location || 'TBD' }}</td>
                            <td class="cell-period">
                              {{ session.registrationStartDate | date: 'dd.MM.yyyy' }} -<br />
                              {{ session.registrationDeadline | date: 'dd.MM.yyyy' }}
                            </td>
                            <td class="cell-price">
                              {{ session.price || level.price || 'TBD' }}
                              @if (session.courseHours || level.courseHours) {
                                <span class="course-hours">{{ session.courseHours || level.courseHours }}</span>
                              }
                            </td>
                            <td class="cell-subscription">
                              @if (session.isBookable) {
                                <button type="button" class="btn-primary btn-sm" (click)="openRegistration(level, session)">Subscribe</button>
                                @if (session.placesLeft !== null && session.placesLeft !== undefined) {
                                  <small class="places-left">{{ session.placesLeft }} {{ session.placesLeft === 1 ? 'place' : 'places' }} left</small>
                                }
                              } @else {
                                <span class="expired-text">{{ session.bookingStatus || 'Not Available' }}</span>
                              }
                            </td>
                          </tr>
                        }
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            }
          }
        }
      </div>
    </section>

    @if (registering(); as target) {
      <app-modal-shell [title]="'Exam registration - ' + target.level.cefrLevel" (closed)="closeRegistration()">
        <p class="modal-meta">
          Exam date: {{ target.session.examDate | date: 'dd.MM.yyyy' }}
          @if (target.session.location) { <span> - {{ target.session.location }}</span> }
        </p>

        @if (registerSuccess()) {
          <div class="alert-success" role="status">{{ registerSuccess() }}</div>
        } @else {
          <form id="registrationForm" [formGroup]="registerForm" (ngSubmit)="submitRegistration()">
            <div class="form-field">
              <label for="regName">Full name *</label>
              <input id="regName" formControlName="fullName" />
            </div>
            <div class="form-field">
              <label for="regEmail">Email *</label>
              <input id="regEmail" type="email" formControlName="email" />
              @if (registerForm.controls.email.touched && registerForm.controls.email.invalid) {
                <small class="field-error" role="alert">Enter a valid email address.</small>
              }
            </div>
            <div class="form-field">
              <label for="regPhone">Phone</label>
              <input id="regPhone" formControlName="phone" />
            </div>
            <div class="form-field">
              <label for="regMessage">Message</label>
              <textarea id="regMessage" rows="3" formControlName="message"></textarea>
            </div>
            @if (registerError()) {
              <div class="alert-error" role="alert">{{ registerError() }}</div>
            }
            <p class="form-hint">Your request will be reviewed by our team before it is confirmed.</p>
          </form>
        }

        <ng-container modal-footer>
          @if (registerSuccess()) {
            <button type="button" class="btn-primary" (click)="closeRegistration()">Close</button>
          } @else {
            <button type="button" class="btn-secondary" (click)="closeRegistration()">Cancel</button>
            <button type="submit" form="registrationForm" class="btn-primary" [disabled]="registerForm.invalid || isSubmitting()">
              {{ isSubmitting() ? 'Sending...' : 'Send request' }}
            </button>
          }
        </ng-container>
      </app-modal-shell>
    }
  `,
  styles: `
    :host { display: block; }
    .container { max-width: 1140px; margin: 0 auto; padding: 0 1.5rem; }
    .section { padding: 3.5rem 0; background: var(--adm-surface-muted, #f8f9fa); }

    .page-hero {
      background: linear-gradient(135deg, var(--adm-primary, #0a5cbd), var(--adm-primary-dark, #084a99));
      padding: 4rem 0;
    }
    .page-hero h1 { color: #fff; font-size: clamp(1.5rem, 3vw, 2.5rem); margin: 0 0 0.5rem; }
    .breadcrumb { display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; flex-wrap: wrap; }
    .breadcrumb a { color: rgba(255,255,255,0.85); text-decoration: none; }
    .breadcrumb a:hover { color: #fff; text-decoration: underline; }
    .breadcrumb .sep { color: rgba(255,255,255,0.6); }
    .breadcrumb span[aria-current] { color: #fff; }

    .state-text { text-align: center; padding: 2rem; color: var(--adm-text-muted, #475569); }
    .alert-error {
      padding: 1rem 1.25rem; border-radius: var(--adm-radius-card, 6px);
      background: var(--adm-danger-bg, #fee2e2); color: var(--adm-danger-dark, #b91c1c);
    }
    .alert-success {
      padding: 1rem 1.25rem; border-radius: var(--adm-radius-card, 6px);
      background: var(--adm-success-bg, #dcfce7); color: var(--adm-success-dark, #166534);
    }

    .language-info { text-align: center; padding: 2rem 0; }
    .language-name { font-size: clamp(1.5rem, 3vw, 2.5rem); color: var(--adm-text, #44425a); margin: 0 0 0.5rem; }
    .language-native { font-size: 1.1rem; color: var(--adm-text-muted, #666); font-style: italic; margin: 0; }

    .empty-state {
      background: var(--adm-surface, #fff); padding: 3rem 2rem;
      border-radius: var(--adm-radius-card, 6px);
      box-shadow: 0 2px 8px var(--adm-shadow-color, rgba(15,23,42,0.08));
      text-align: center; color: var(--adm-text-muted, #999);
    }

    .level-card {
      background: var(--adm-surface, #fff); padding: 2rem;
      border-radius: var(--adm-radius-card, 6px);
      box-shadow: 0 2px 8px var(--adm-shadow-color, rgba(15,23,42,0.08));
      margin-bottom: 1.5rem;
    }
    .level-title {
      font-size: 1.5rem; color: var(--adm-primary, #0a5cbd);
      margin: 0 0 1.5rem; padding-bottom: 1rem;
      border-bottom: 2px solid var(--adm-primary, #0a5cbd);
    }

    .table-scroll { overflow-x: auto; }
    .exam-table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
    .exam-table thead { background: var(--adm-surface-muted, #f8f9fa); }
    .exam-table th {
      padding: 1rem; text-align: left; font-weight: 600;
      color: var(--adm-text, #44425a);
      border-bottom: 2px solid var(--adm-border, #dee2e6);
    }
    .exam-table td { padding: 1rem; border-bottom: 1px solid var(--adm-border, #dee2e6); }

    .exam-date-row .exam-date-header {
      background: var(--adm-surface-muted, #f0f0f0); padding: 1rem; text-align: center;
    }
    .exam-date-header h5 { font-size: 1.1rem; color: var(--adm-text, #44425a); font-weight: 600; margin: 0; }
    .exam-date-label {
      display: inline-block; margin-right: 0.6rem; padding: 0.15rem 0.6rem;
      border-radius: 999px; background: var(--adm-text, #44425a); color: #fff;
      font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;
      vertical-align: middle;
    }

    .exam-details-row { background: var(--adm-surface, #fff); }
    .exam-details-row.not-bookable { background: var(--adm-surface-muted, #f9f9f9); opacity: 0.8; }
    .cell-location { font-weight: 500; color: var(--adm-text, #44425a); }
    .cell-period { color: var(--adm-text-muted, #666); font-size: 0.95rem; }
    .cell-price { color: var(--adm-primary, #0a5cbd); font-weight: 500; }
    .course-hours { font-size: 0.85rem; color: var(--adm-text-muted, #999); display: block; margin-top: 0.25rem; }
    .cell-subscription { text-align: center; }
    .places-left { margin-top: 0.35rem; color: var(--adm-success-dark, #26713b); font-weight: 500; display: block; }
    .expired-text {
      color: var(--adm-danger-dark, #dc3545); font-weight: 500;
      display: block; padding: 0.5rem; text-align: center; font-size: 0.9rem;
    }
    .no-exams { background: var(--adm-surface-muted, #f9f9fa); color: var(--adm-text-muted, #999); font-style: italic; text-align: center; }

    /* Modal form */
    .modal-meta { color: var(--adm-text-muted, #475569); margin: 0 0 1rem; }
    .form-field { display: grid; gap: 0.4rem; margin-bottom: 1rem; }
    .form-field label { font-size: 0.9rem; font-weight: 600; color: var(--adm-text, #1f2937); }
    .form-field input, .form-field textarea {
      width: 100%; padding: 0.65rem 0.85rem;
      border: 1px solid var(--adm-border-strong, #cbd5e1);
      border-radius: var(--adm-radius-card, 6px);
      background: var(--adm-surface, #fff); color: var(--adm-text, #1f2937);
      font: inherit; font-size: 0.95rem;
    }
    .form-field input:focus, .form-field textarea:focus {
      outline: none; border-color: var(--adm-primary, #0a5cbd);
      box-shadow: 0 0 0 3px var(--adm-focus-ring, rgba(10,92,189,0.2));
    }
    .field-error { color: var(--adm-danger-dark, #b91c1c); font-size: 0.8rem; }
    .form-hint { color: var(--adm-text-muted, #475569); font-size: 0.85rem; margin: 0.5rem 0 0; }

    .btn-primary, .btn-secondary {
      display: inline-flex; align-items: center; justify-content: center;
      padding: 0.6rem 1.25rem; border: 0;
      border-radius: var(--adm-radius-card, 6px);
      font: inherit; font-size: 0.9rem; font-weight: 600;
      cursor: pointer; text-decoration: none;
      transition: background 150ms ease, transform 100ms ease;
    }
    .btn-primary { background: var(--adm-primary, #0a5cbd); color: var(--adm-text-on-primary, #fff); }
    .btn-primary:hover:not(:disabled) { background: var(--adm-primary-dark, #084a99); }
    .btn-primary:active:not(:disabled) { transform: scale(0.98); }
    .btn-primary:focus-visible { outline: 2px solid var(--adm-primary, #0a5cbd); outline-offset: 2px; }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-secondary { background: var(--adm-surface-muted, #e2e8f0); color: var(--adm-text, #1f2937); }
    .btn-secondary:hover { background: var(--adm-border-strong, #cbd5e1); }
    .btn-sm { padding: 0.4rem 0.85rem; font-size: 0.85rem; white-space: nowrap; }

    @media (max-width: 768px) {
      .level-card { padding: 1.5rem; }
      .level-title { font-size: 1.2rem; }
      .exam-table { font-size: 0.9rem; }
      .exam-table th, .exam-table td { padding: 0.75rem; }
    }
    @media (max-width: 576px) {
      .level-card { padding: 1rem; }
      .level-title { font-size: 1rem; }
      .exam-table { font-size: 0.8rem; }
      .exam-table th, .exam-table td { padding: 0.5rem; }
    }
    @media (prefers-reduced-motion: reduce) {
      .btn-primary, .btn-secondary { transition: none; }
    }
  `,
})
export class LanguageDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly apiService = inject(OrizzontiApiService);
  private readonly fb = inject(FormBuilder);

  protected readonly language = signal<LanguageItem | null>(null);
  protected readonly levels = signal<LanguageLevel[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly registering = signal<RegistrationTarget | null>(null);
  protected readonly isSubmitting = signal(false);
  protected readonly registerError = signal<string | null>(null);
  protected readonly registerSuccess = signal<string | null>(null);

  readonly registerForm = this.fb.group({
    fullName: ['', [Validators.required, Validators.maxLength(200)]],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    message: [''],
  });

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      const languageId = Number(params['id']);
      if (languageId) this.loadLanguageDetails(languageId);
    });
  }

  protected openRegistration(level: LanguageLevel, session: ExamSession): void {
    if (!session.isBookable) return;
    this.registering.set({ level, session });
    this.registerError.set(null);
    this.registerSuccess.set(null);
    this.registerForm.reset({ fullName: '', email: '', phone: '', message: '' });
  }

  protected closeRegistration(): void {
    this.registering.set(null);
  }

  protected submitRegistration(): void {
    const target = this.registering();
    const lang = this.language();
    if (!target || !lang || this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }
    const { fullName, email, phone, message } = this.registerForm.getRawValue();
    this.isSubmitting.set(true);
    this.registerError.set(null);
    this.apiService
      .registerForExam(lang.id!, target.level.id!, target.session.id!, {
        fullName: fullName ?? '',
        email: email ?? '',
        phone: phone || undefined,
        message: message || undefined,
      })
      .subscribe({
        next: (result) => {
          this.registerSuccess.set(result.message);
          this.isSubmitting.set(false);
          this.loadLanguageLevels(lang.id!);
        },
        error: (error) => {
          const detail = error?.error?.message;
          this.registerError.set(
            Array.isArray(detail) ? detail.join(', ') : (detail ?? 'Unable to send your registration. Please try again.'),
          );
          this.isSubmitting.set(false);
        },
      });
  }

  private loadLanguageDetails(languageId: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.apiService.getLanguages().subscribe({
      next: (languages) => {
        const found = languages.find((l) => l.id === languageId) || null;
        this.language.set(found);
        if (!found) {
          this.error.set('Language not found');
          this.loading.set(false);
          return;
        }
        this.loadLanguageLevels(languageId);
      },
      error: () => {
        this.error.set('Failed to load language');
        this.loading.set(false);
      },
    });
  }

  private loadLanguageLevels(languageId: number): void {
    this.apiService.getLanguageLevels(languageId).subscribe({
      next: (levels) => {
        const cefrOrder = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
        this.levels.set(
          [...levels].sort((a, b) => cefrOrder.indexOf(a.cefrLevel) - cefrOrder.indexOf(b.cefrLevel)),
        );
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load language levels');
        this.loading.set(false);
      },
    });
  }
}
