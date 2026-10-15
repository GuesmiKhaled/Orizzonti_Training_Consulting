import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { ModalShellComponent } from '../modal-shell/modal-shell.component';

/** Render with `@if` where needed; it closes itself via the two outputs. */
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [ModalShellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-modal-shell [title]="title()" size="sm" (closed)="cancelled.emit()">
      <p>{{ message() }}</p>
      <ng-container modal-footer>
        <button type="button" class="btn btn-secondary" (click)="cancelled.emit()">
          {{ cancelLabel() }}
        </button>
        <button
          type="button"
          class="btn"
          [class.btn-danger]="danger()"
          [class.btn-primary]="!danger()"
          (click)="confirmed.emit()"
        >
          {{ confirmLabel() }}
        </button>
      </ng-container>
    </app-modal-shell>
  `,
  styles: `
    p {
      margin: 0;
      color: #475569;
    }
  `,
})
export class ConfirmDialogComponent {
  readonly title = input('Please confirm');
  readonly message = input.required<string>();
  readonly confirmLabel = input('Confirm');
  readonly cancelLabel = input('Cancel');
  readonly danger = input(false);
  readonly confirmed = output<void>();
  readonly cancelled = output<void>();
}
