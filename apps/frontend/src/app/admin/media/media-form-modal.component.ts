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
  Validators,
} from '@angular/forms';
import { MediaService } from '../../core/api/entities/content.services';
import { UploadService } from '../../core/api/entities/site.services';
import { ToastService } from '../../core/toast/toast.service';
import { MediaItem } from '../../services/orizzonti-api.service';
import {
  FormFieldComponent,
  ImagePickerComponent,
  ImageUploader,
  ModalShellComponent,
} from '../../shared/ui';
import { errorOf } from '../languages/wizard/language-wizard.forms';

@Component({
  selector: 'app-media-form-modal',
  standalone: true,
  imports: [ReactiveFormsModule, FormFieldComponent, ImagePickerComponent, ModalShellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './media-form-modal.component.html',
  styleUrl: '../pages/page-common.scss',
})
export class MediaFormModalComponent implements OnInit {
  /** Null adds a new slider image. */
  readonly item = input<MediaItem | null>(null);
  readonly saved = output<void>();
  readonly closed = output<void>();

  private readonly mediaApi = inject(MediaService);
  private readonly uploads = inject(UploadService);
  private readonly toast = inject(ToastService);

  protected readonly saving = signal(false);
  protected readonly uploader: ImageUploader = (file) => this.uploads.uploadImage(file);
  protected readonly form = new FormGroup({
    title: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(255)],
    }),
    imageUrl: new FormControl<string | null>(null, [Validators.required]),
    altText: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(255)],
    }),
    isActive: new FormControl(true, { nonNullable: true }),
  });

  ngOnInit(): void {
    const item = this.item();
    if (item) {
      this.form.patchValue({
        title: item.title,
        imageUrl: item.imageUrl,
        altText: item.altText ?? '',
        isActive: item.isActive !== false,
      });
    }
  }

  protected titleError(): string {
    return errorOf(this.form.controls.title);
  }

  protected imageError(): string {
    return errorOf(this.form.controls.imageUrl) && 'Choose an image';
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const body: Partial<MediaItem> = {
      title: v.title.trim(),
      imageUrl: v.imageUrl as string,
      altText: v.altText.trim(),
      isActive: v.isActive,
    };
    const current = this.item();
    this.saving.set(true);
    const request = current?.id
      ? this.mediaApi.update(current.id, body)
      : this.mediaApi.create(body);
    request.subscribe({
      next: () => {
        this.toast.success(current ? 'Image updated.' : 'Image added.');
        this.saved.emit();
        this.closed.emit();
      },
      error: () => this.saving.set(false),
    });
  }
}
