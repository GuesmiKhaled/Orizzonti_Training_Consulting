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
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { UploadService } from '../../core/api/entities/site.services';
import { BlogsService } from '../../core/api/entities/content.services';
import { ToastService } from '../../core/toast/toast.service';
import { BlogItem } from '../../services/orizzonti-api.service';
import {
  FormFieldComponent,
  ImagePickerComponent,
  ImageUploader,
  PageHeaderComponent,
} from '../../shared/ui';
import { errorOf } from '../languages/wizard/language-wizard.forms';

@Component({
  selector: 'app-blog-editor-page',
  standalone: true,
  imports: [
    FormFieldComponent,
    ImagePickerComponent,
    PageHeaderComponent,
    ReactiveFormsModule,
    RouterLink,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './blog-editor-page.component.html',
  styleUrls: ['../pages/page-common.scss', './blog-editor-page.component.scss'],
})
export class BlogEditorPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly blogsApi = inject(BlogsService);
  private readonly uploads = inject(UploadService);
  private readonly toast = inject(ToastService);

  protected readonly postId = signal<number | null>(null);
  protected readonly loading = signal(false);
  protected readonly failed = signal(false);
  protected readonly saving = signal(false);

  protected readonly uploader: ImageUploader = (file) => this.uploads.uploadImage(file);
  protected readonly form = new FormGroup({
    title: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3), Validators.maxLength(200)],
    }),
    slug: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(255)] }),
    excerpt: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(10), Validators.maxLength(500)],
    }),
    content: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(20)],
    }),
    imageUrl: new FormControl<string | null>(null),
    isPublished: new FormControl(true, { nonNullable: true }),
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      return;
    }
    this.postId.set(id);
    this.loading.set(true);
    this.blogsApi.get(id).subscribe({
      next: (post) => {
        this.form.patchValue({
          title: post.title,
          slug: post.slug ?? '',
          excerpt: post.excerpt ?? '',
          content: post.content ?? '',
          imageUrl: post.imageUrl ?? null,
          isPublished: post.isPublished !== false,
        });
        this.loading.set(false);
      },
      error: () => {
        this.failed.set(true);
        this.loading.set(false);
      },
    });
  }

  protected error(field: 'title' | 'excerpt' | 'content'): string {
    const control = this.form.controls[field];
    if (control.errors?.['minlength'] && (control.touched || control.dirty)) {
      return `At least ${control.errors['minlength'].requiredLength} characters`;
    }
    return errorOf(control);
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const id = this.postId();
    const v = this.form.getRawValue();
    const slug = v.slug.trim();
    const body: Partial<BlogItem> = {
      title: v.title.trim(),
      excerpt: v.excerpt.trim(),
      content: v.content.trim(),
      isPublished: v.isPublished,
      ...(slug ? { slug } : {}),
    };
    this.saving.set(true);
    const request =
      id === null
        ? this.blogsApi.create({ ...body, ...(v.imageUrl ? { imageUrl: v.imageUrl } : {}) })
        : this.blogsApi.update(id, { ...body, imageUrl: v.imageUrl });
    request.subscribe({
      next: () => {
        this.toast.success(id === null ? 'Post created.' : 'Post updated.');
        void this.router.navigateByUrl('/admin/blogs');
      },
      error: () => this.saving.set(false),
    });
  }
}
