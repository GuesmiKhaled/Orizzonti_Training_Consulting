import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CefrLevelNamePipe } from '../../pipes/cefr-level-name.pipe';
import {
  OrizzontiApiService,
  LanguageItem,
  LanguageLevel,
  ExamSession,
} from '../../services/orizzonti-api.service';

@Component({
  selector: 'app-language-detail-page',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, CefrLevelNamePipe],
  templateUrl: './language-detail-page.component.html',
  styleUrls: ['./language-detail-page.component.css'],
})
export class LanguageDetailPageComponent implements OnInit {
  language: LanguageItem | null = null;
  levels: LanguageLevel[] = [];
  loading = true;
  error: string | null = null;

  registering: { level: LanguageLevel; session: ExamSession } | null = null;
  registerForm: FormGroup;
  isSubmitting = false;
  registerError: string | null = null;
  registerSuccess: string | null = null;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly apiService: OrizzontiApiService,
    fb: FormBuilder,
  ) {
    this.registerForm = fb.group({
      fullName: ['', [Validators.required, Validators.maxLength(200)]],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      message: [''],
    });
  }

  ngOnInit() {
    this.route.params.subscribe((params) => {
      const languageId = Number(params['id']);
      if (languageId) {
        this.loadLanguageDetails(languageId);
      }
    });
  }

  private loadLanguageDetails(languageId: number) {
    this.loading = true;
    this.error = null;

    this.apiService.getLanguages().subscribe({
      next: (languages) => {
        this.language = languages.find((l) => l.id === languageId) || null;

        if (!this.language) {
          this.error = 'Language not found';
          this.loading = false;
          return;
        }

        this.loadLanguageLevels(languageId);
      },
      error: () => {
        this.error = 'Failed to load language';
        this.loading = false;
      },
    });
  }

  private loadLanguageLevels(languageId: number) {
    this.apiService.getLanguageLevels(languageId).subscribe({
      next: (levels) => {
        this.levels = levels.sort((a, b) => {
          const cefrOrder = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
          return (
            cefrOrder.indexOf(a.cefrLevel) - cefrOrder.indexOf(b.cefrLevel)
          );
        });
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load language levels';
        this.loading = false;
      },
    });
  }

  getAvailableLevels(language: LanguageItem): string {
    if (!language.levels || language.levels.length === 0) {
      return 'No levels configured';
    }
    return language.levels.map((l) => l.cefrLevel).join(', ');
  }

  openRegistration(level: LanguageLevel, session: ExamSession) {
    if (!session.isBookable) {
      return;
    }
    this.registering = { level, session };
    this.registerError = null;
    this.registerSuccess = null;
    this.registerForm.reset({ fullName: '', email: '', phone: '', message: '' });
  }

  closeRegistration() {
    this.registering = null;
  }

  submitRegistration() {
    if (!this.registering || !this.language || this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }
    const { level, session } = this.registering;
    const { fullName, email, phone, message } = this.registerForm.value;
    this.isSubmitting = true;
    this.registerError = null;
    this.apiService
      .registerForExam(this.language.id!, level.id!, session.id!, {
        fullName,
        email,
        phone: phone || undefined,
        message: message || undefined,
      })
      .subscribe({
        next: (result) => {
          this.registerSuccess = result.message;
          this.isSubmitting = false;
          this.loadLanguageLevels(this.language!.id!);
        },
        error: (error) => {
          const detail = error?.error?.message;
          this.registerError = Array.isArray(detail)
            ? detail.join(', ')
            : (detail ?? 'Unable to send your registration. Please try again.');
          this.isSubmitting = false;
        },
      });
  }
}
