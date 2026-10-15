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
import { CoursesService } from '../../core/api/entities/content.services';
import { UploadService } from '../../core/api/entities/site.services';
import { ToastService } from '../../core/toast/toast.service';
import { CourseItem } from '../../services/orizzonti-api.service';
import {
  FormFieldComponent,
  ImagePickerComponent,
  ImageUploader,
  ModalShellComponent,
} from '../../shared/ui';
import { errorOf } from '../languages/wizard/language-wizard.forms';

const optionalText = (max: number) =>
  new FormControl('', { nonNullable: true, validators: [Validators.maxLength(max)] });

@Component({
  selector: 'app-course-form-modal',
  standalone: true,
  imports: [ReactiveFormsModule, FormFieldComponent, ImagePickerComponent, ModalShellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './course-form-modal.component.html',
  styleUrl: '../pages/page-common.scss',
})
export class CourseFormModalComponent implements OnInit {
  /** Null creates a new course. */
  readonly course = input<CourseItem | null>(null);
  readonly saved = output<void>();
  readonly closed = output<void>();

  private readonly coursesApi = inject(CoursesService);
  private readonly uploads = inject(UploadService);
  private readonly toast = inject(ToastService);

  protected readonly saving = signal(false);
  protected readonly uploader: ImageUploader = (file) => this.uploads.uploadImage(file);
  protected readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2), Validators.maxLength(200)],
    }),
    description: optionalText(2000),
    level: optionalText(100),
    price: optionalText(100),
    startDate: optionalText(100),
    slug: optionalText(255),
    imageUrl: new FormControl<string | null>(null),
  });

  ngOnInit(): void {
    const course = this.course();
    if (!course) {
      return;
    }
    this.form.patchValue({
      name: course.name,
      description: course.description ?? '',
      level: course.level ?? '',
      price: course.price ?? '',
      startDate: course.startDate ?? '',
      slug: course.slug ?? '',
      imageUrl: course.imageUrl ?? null,
    });
  }

  protected nameError(): string {
    return errorOf(this.form.controls.name);
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const current = this.course();
    const v = this.form.getRawValue();
    const text = (value: string): string | undefined => value.trim() || undefined;
    const body: Partial<CourseItem> = {
      name: v.name.trim(),
      description: current ? v.description.trim() : text(v.description),
      level: current ? v.level.trim() : text(v.level),
      price: current ? v.price.trim() : text(v.price),
      startDate: current ? v.startDate.trim() : text(v.startDate),
      imageUrl: current ? v.imageUrl : (v.imageUrl ?? undefined),
      ...(text(v.slug) ? { slug: text(v.slug) } : {}),
    };
    this.saving.set(true);
    const request = current?.id
      ? this.coursesApi.update(current.id, body)
      : this.coursesApi.create(body);
    request.subscribe({
      next: () => {
        this.toast.success(current ? 'Course updated.' : 'Course created.');
        this.saved.emit();
        this.closed.emit();
      },
      error: () => this.saving.set(false),
    });
  }
}
