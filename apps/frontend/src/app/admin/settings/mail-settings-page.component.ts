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
  Validators,
} from '@angular/forms';
import { MailSettingsService } from '../../core/api/entities/access.services';
import { ToastService } from '../../core/toast/toast.service';
import { MailSettings } from '../../services/orizzonti-api.service';
import { FormFieldComponent, PageHeaderComponent } from '../../shared/ui';
import { errorOf } from '../languages/wizard/language-wizard.forms';

@Component({
  selector: 'app-mail-settings-page',
  standalone: true,
  imports: [FormFieldComponent, PageHeaderComponent, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './mail-settings-page.component.html',
  styleUrl: '../pages/page-common.scss',
})
export class MailSettingsPageComponent implements OnInit {
  private readonly mailApi = inject(MailSettingsService);
  private readonly toast = inject(ToastService);

  protected readonly loading = signal(true);
  protected readonly failed = signal(false);
  protected readonly saving = signal(false);
  protected readonly passwordConfigured = signal(false);

  protected readonly form = new FormGroup({
    host: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(255)] }),
    port: new FormControl('587', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^\d{1,5}$/)],
    }),
    username: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(255)] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(500)] }),
    fromAddress: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(255)] }),
    secure: new FormControl(true, { nonNullable: true }),
  });

  ngOnInit(): void {
    this.mailApi.get().subscribe({
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

  protected error(field: 'host' | 'port' | 'fromAddress'): string {
    const control = this.form.controls[field];
    if (field === 'port' && control.errors?.['pattern'] && control.touched) {
      return 'Enter a port number';
    }
    return errorOf(control);
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.saving.set(true);
    this.mailApi
      .save({
        host: v.host.trim(),
        port: Number(v.port),
        username: v.username.trim(),
        fromAddress: v.fromAddress.trim(),
        secure: v.secure,
        ...(v.password ? { password: v.password } : {}),
      })
      .subscribe({
        next: (settings) => {
          this.apply(settings);
          this.toast.success('Mail settings saved.');
          this.saving.set(false);
        },
        error: () => this.saving.set(false),
      });
  }

  private apply(settings: MailSettings): void {
    this.passwordConfigured.set(settings.passwordConfigured === true);
    this.form.reset({
      host: settings.host,
      port: String(settings.port),
      username: settings.username,
      password: '',
      fromAddress: settings.fromAddress,
      secure: settings.secure,
    });
  }
}
