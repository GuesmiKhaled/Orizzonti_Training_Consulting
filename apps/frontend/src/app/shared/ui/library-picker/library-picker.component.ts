import {
  ChangeDetectionStrategy,
  Component,
  computed,
  model,
  signal,
} from '@angular/core';
import { IMAGE_LIBRARY } from '../../image-library/image-library.generated';
import { ModalShellComponent } from '../modal-shell/modal-shell.component';

/**
 * Chooses one picture from the site's image library (the img/ folder).
 * `value` is the site-relative path, or an empty string for "no image".
 */
@Component({
  selector: 'app-library-picker',
  standalone: true,
  imports: [ModalShellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './library-picker.component.html',
  styleUrl: './library-picker.component.scss',
})
export class LibraryPickerComponent {
  readonly value = model('');

  protected readonly opened = signal(false);
  protected readonly search = signal('');
  protected readonly folder = signal('');

  protected readonly folders = Array.from(
    new Set(IMAGE_LIBRARY.map((image) => image.folder).filter(Boolean)),
  ).sort();

  protected readonly visible = computed(() => {
    const term = this.search().trim().toLowerCase();
    const folder = this.folder();
    return IMAGE_LIBRARY.filter(
      (image) =>
        (!folder || image.folder === folder) &&
        (!term || image.name.toLowerCase().includes(term)),
    );
  });

  protected open(): void {
    this.search.set('');
    this.opened.set(true);
  }

  protected choose(path: string): void {
    this.value.set(path);
    this.opened.set(false);
  }

  protected clear(): void {
    this.value.set('');
  }

  protected onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  protected onFolder(event: Event): void {
    this.folder.set((event.target as HTMLSelectElement).value);
  }
}
