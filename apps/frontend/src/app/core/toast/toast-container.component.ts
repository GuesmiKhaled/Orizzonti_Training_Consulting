import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toast-stack" aria-live="polite" aria-atomic="false">
      @for (toast of toasts.toasts(); track toast.id) {
        <div class="toast" [class]="'toast toast-' + toast.kind" role="status">
          <span>{{ toast.message }}</span>
          <button
            type="button"
            aria-label="Dismiss notification"
            (click)="toasts.dismiss(toast.id)"
          >
            &times;
          </button>
        </div>
      }
    </div>
  `,
  styles: `
    .toast-stack {
      position: fixed;
      z-index: 2000;
      top: 1rem;
      right: 1rem;
      display: grid;
      gap: 0.5rem;
      max-width: min(420px, calc(100vw - 2rem));
    }
    .toast {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      border-radius: var(--adm-radius-card, 6px);
      color: #fff;
      background: #1f2937;
      box-shadow: 0 6px 18px rgba(0, 0, 0, 0.2);
    }
    .toast-error {
      background: var(--adm-danger, #dc2626);
    }
    .toast-success {
      background: var(--adm-success, #16a34a);
    }
    .toast-info {
      background: var(--adm-primary, #0a5cbd);
    }
    .toast button {
      border: 0;
      background: transparent;
      color: inherit;
      font-size: 1.25rem;
      line-height: 1;
      cursor: pointer;
    }
  `,
})
export class ToastContainerComponent {
  protected readonly toasts = inject(ToastService);
}
