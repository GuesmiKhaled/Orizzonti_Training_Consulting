import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { MediaService } from '../../core/api/entities/content.services';
import { ToastService } from '../../core/toast/toast.service';
import { MediaItem } from '../../services/orizzonti-api.service';
import {
  ConfirmDialogComponent,
  PageHeaderComponent,
  StatusTagComponent,
} from '../../shared/ui';
import { MediaFormModalComponent } from './media-form-modal.component';

@Component({
  selector: 'app-media-page',
  standalone: true,
  imports: [
    ConfirmDialogComponent,
    MediaFormModalComponent,
    PageHeaderComponent,
    StatusTagComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-header title="Slider media" subtitle="Images shown in the home page slider.">
      <button actions type="button" class="btn btn-primary" (click)="editing.set('new')">
        Add image
      </button>
    </app-page-header>

    @if (loading()) {
      <p class="state">Loading images...</p>
    } @else {
      <div class="cards">
        @for (item of items(); track item.id) {
          <article class="card">
            <img [src]="item.imageUrl" [alt]="item.altText || item.title" loading="lazy" />
            <div class="body">
              <div class="row">
                <strong>{{ item.title }}</strong>
                <app-status-tag
                  [label]="item.isActive === false ? 'Hidden' : 'Visible'"
                  [tone]="item.isActive === false ? 'neutral' : 'success'"
                />
              </div>
              <div class="links">
                <button type="button" class="link" (click)="editing.set(item)">Edit</button>
                <button type="button" class="link danger" (click)="deleting.set(item)">Delete</button>
              </div>
            </div>
          </article>
        } @empty {
          <p class="state">No slider images yet.</p>
        }
      </div>
    }

    @if (editing(); as target) {
      <app-media-form-modal
        [item]="target === 'new' ? null : target"
        (saved)="load()"
        (closed)="editing.set(null)"
      />
    }
    @if (deleting(); as item) {
      <app-confirm-dialog
        title="Delete image"
        [message]="'Delete &quot;' + item.title + '&quot; from the slider?'"
        confirmLabel="Delete"
        [danger]="true"
        (confirmed)="confirmDelete(item)"
        (cancelled)="deleting.set(null)"
      />
    }
  `,
  styleUrls: ['../pages/page-common.scss', './media-page.component.scss'],
})
export class MediaPageComponent implements OnInit {
  private readonly mediaApi = inject(MediaService);
  private readonly toast = inject(ToastService);

  protected readonly items = signal<readonly MediaItem[]>([]);
  protected readonly loading = signal(true);
  protected readonly editing = signal<MediaItem | 'new' | null>(null);
  protected readonly deleting = signal<MediaItem | null>(null);

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.mediaApi.list().subscribe({
      next: (items) => {
        this.items.set(items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  protected confirmDelete(item: MediaItem): void {
    this.deleting.set(null);
    this.mediaApi.remove(item.id ?? 0).subscribe(() => {
      this.toast.success('Image deleted.');
      this.load();
    });
  }
}
