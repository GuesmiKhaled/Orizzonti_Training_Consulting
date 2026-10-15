import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { SiteSettingsService } from '../../core/api/entities/site.services';
import { ToastService } from '../../core/toast/toast.service';
import { SiteSettings } from '../../services/orizzonti-api.service';
import { FormFieldComponent, PageHeaderComponent } from '../../shared/ui';
import { errorOf } from '../languages/wizard/language-wizard.forms';
import { fromLocalInput, toLocalInput } from '../languages/wizard/language-wizard.mapper';

const text = (...validators: ValidatorFn[]) =>
  new FormControl('', { nonNullable: true, validators });
const count = () => text(Validators.pattern(/^\d{0,7}$/));
const URL_PATTERN = Validators.pattern(/^(https?:\/\/\S+)?$/);

/** '' -> null so a cleared field is removed on the server. */
export const orNull = (value: string): string | null => value.trim() || null;
export const toCount = (value: string): number | null => (value.trim() ? Number(value) : null);

export function toSiteSettingsBody(v: {
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  facebookUrl: string;
  instagramUrl: string;
  aboutText: string;
  studentsCount: string;
  coursesCount: string;
  yearsOfExperience: string;
  nextSessionDate: string;
}): SiteSettings {
  return {
    contactEmail: orNull(v.contactEmail),
    contactPhone: orNull(v.contactPhone),
    contactAddress: orNull(v.contactAddress),
    facebookUrl: orNull(v.facebookUrl),
    instagramUrl: orNull(v.instagramUrl),
    aboutText: orNull(v.aboutText),
    studentsCount: toCount(v.studentsCount),
    coursesCount: toCount(v.coursesCount),
    yearsOfExperience: toCount(v.yearsOfExperience),
    nextSessionDate: v.nextSessionDate ? fromLocalInput(v.nextSessionDate) : null,
  };
}

@Component({
  selector: 'app-site-settings-page',
  standalone: true,
  imports: [FormFieldComponent, PageHeaderComponent, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './site-settings-page.component.html',
  styleUrl: '../pages/page-common.scss',
})
export class SiteSettingsPageComponent implements OnInit {
  private readonly siteApi = inject(SiteSettingsService);
  private readonly toast = inject(ToastService);

  protected readonly loading = signal(true);
  protected readonly failed = signal(false);
  protected readonly saving = signal(false);

  protected readonly form = new FormGroup({
    contactEmail: text(Validators.email, Validators.maxLength(200)),
    contactPhone: text(Validators.pattern(/^[+\d\s().-]*$/), Validators.maxLength(100)),
    contactAddress: text(Validators.maxLength(300)),
    facebookUrl: text(URL_PATTERN, Validators.maxLength(300)),
    instagramUrl: text(URL_PATTERN, Validators.maxLength(300)),
    aboutText: text(Validators.maxLength(5000)),
    studentsCount: count(),
    coursesCount: count(),
    yearsOfExperience: count(),
    nextSessionDate: text(),
  });

  ngOnInit(): void {
    this.siteApi.get().subscribe({
      next: (settings) => {
        this.apply(settings);
        this.loading.set(false);
      },
      error: () => {
        this.failed.set(true);
        this.loading.set(false);
      },
    });
  }

  protected error(
    field: 'contactEmail' | 'contactPhone' | 'facebookUrl' | 'instagramUrl',
  ): string {
    const control = this.form.controls[field];
    if (!control.touched || !control.invalid) {
      return '';
    }
    return control.errors?.['email'] || control.errors?.['pattern']
      ? 'Enter a valid value'
      : errorOf(control);
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.siteApi.save(toSiteSettingsBody(this.form.getRawValue())).subscribe({
      next: (settings) => {
        this.apply(settings);
        this.toast.success('Site settings saved.');
        this.saving.set(false);
      },
      error: () => this.saving.set(false),
    });
  }

  private apply(s: SiteSettings): void {
    const num = (value: number | null): string => (value === null ? '' : String(value));
    this.form.reset({
      contactEmail: s.contactEmail ?? '',
      contactPhone: s.contactPhone ?? '',
      contactAddress: s.contactAddress ?? '',
      facebookUrl: s.facebookUrl ?? '',
      instagramUrl: s.instagramUrl ?? '',
      aboutText: s.aboutText ?? '',
      studentsCount: num(s.studentsCount),
      coursesCount: num(s.coursesCount),
      yearsOfExperience: num(s.yearsOfExperience),
      nextSessionDate: toLocalInput(s.nextSessionDate),
    });
  }
}
