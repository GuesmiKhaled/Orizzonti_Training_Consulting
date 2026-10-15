import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Open modals, last = topmost; only the topmost reacts to Esc. */
const openModals: ModalShellComponent[] = [];
let nextId = 1;

@Component({
  selector: 'app-modal-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'onEscape()' },
  templateUrl: './modal-shell.component.html',
  styleUrl: './modal-shell.component.scss',
})
export class ModalShellComponent {
  readonly title = input.required<string>();
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly closeOnBackdrop = input(true);
  readonly closed = output<void>();

  protected readonly titleId = `app-modal-title-${nextId++}`;
  private readonly dialog = viewChild.required<ElementRef<HTMLElement>>('dialog');
  private readonly document = inject(DOCUMENT);
  private readonly previouslyFocused = this.document.activeElement;

  constructor() {
    openModals.push(this);
    afterNextRender(() => this.focusFirst());
    inject(DestroyRef).onDestroy(() => {
      openModals.splice(openModals.indexOf(this), 1);
      if (this.previouslyFocused instanceof HTMLElement) {
        this.previouslyFocused.focus();
      }
    });
  }

  protected close(): void {
    this.closed.emit();
  }

  protected onEscape(): void {
    if (openModals[openModals.length - 1] === this) {
      this.close();
    }
  }

  protected onBackdropClick(event: MouseEvent): void {
    if (this.closeOnBackdrop() && event.target === event.currentTarget) {
      this.close();
    }
  }

  protected trapTab(event: KeyboardEvent): void {
    if (event.key !== 'Tab') {
      return;
    }
    const focusable = this.focusableElements();
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!first || !last) {
      event.preventDefault();
      return;
    }
    const active = this.document.activeElement;
    const inside = this.dialog().nativeElement.contains(active);
    if (event.shiftKey && (active === first || !inside)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (active === last || !inside)) {
      event.preventDefault();
      first.focus();
    }
  }

  private focusFirst(): void {
    const target = this.focusableElements().find(
      (el) => !el.classList.contains('close'),
    );
    (target ?? this.dialog().nativeElement).focus();
  }

  private focusableElements(): HTMLElement[] {
    return Array.from(
      this.dialog().nativeElement.querySelectorAll<HTMLElement>(FOCUSABLE),
    );
  }
}
