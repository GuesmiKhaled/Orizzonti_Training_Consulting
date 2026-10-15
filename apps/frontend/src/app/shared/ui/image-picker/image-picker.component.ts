import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  forwardRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Observable, finalize } from 'rxjs';
import {
  IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  validateImageFile,
} from './validate-image';

/** Uploads a file and resolves to its public URL. */
export type ImageUploader = (file: File) => Observable<string>;

/**
 * Form control whose value is an image URL (or null).
 * With an `uploader` the file is sent and the returned URL becomes the value.
 * Without one, the value is a local data URL, which is only suitable for
 * previews: wire an uploader before persisting.
 */
@Component({
  selector: 'app-image-picker',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ImagePickerComponent),
      multi: true,
    },
  ],
  templateUrl: './image-picker.component.html',
  styleUrl: './image-picker.component.scss',
})
export class ImagePickerComponent implements ControlValueAccessor {
  readonly accept = input<readonly string[]>(IMAGE_TYPES);
  readonly maxBytes = input(MAX_IMAGE_BYTES);
  readonly uploader = input<ImageUploader | null>(null);
  readonly fileSelected = output<File>();

  protected readonly value = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly uploading = signal(false);
  protected readonly dragging = signal(false);
  protected readonly disabled = signal(false);

  private readonly destroyRef = inject(DestroyRef);
  private onChange: (value: string | null) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  writeValue(value: string | null): void {
    this.value.set(value ?? null);
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  protected onFilesChosen(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.handle(input.files?.[0] ?? null);
    input.value = '';
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    if (!this.disabled()) {
      this.dragging.set(true);
    }
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    if (!this.disabled()) {
      this.handle(event.dataTransfer?.files?.[0] ?? null);
    }
  }

  protected remove(): void {
    this.setValue(null);
  }

  private handle(file: File | null): void {
    if (!file) {
      return;
    }
    const problem = validateImageFile(file, this.accept(), this.maxBytes());
    this.error.set(problem);
    if (problem) {
      return;
    }
    this.fileSelected.emit(file);
    const upload = this.uploader();
    if (upload) {
      this.uploading.set(true);
      upload(file)
        .pipe(
          finalize(() => this.uploading.set(false)),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe({
          next: (url) => this.setValue(url),
          error: () => this.error.set('Upload failed. Please try again.'),
        });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => this.setValue(String(reader.result));
    reader.readAsDataURL(file);
  }

  private setValue(value: string | null): void {
    this.value.set(value);
    this.onChange(value);
    this.onTouched();
  }
}
