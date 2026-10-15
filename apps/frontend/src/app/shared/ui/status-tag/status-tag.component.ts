import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Tone } from '../ui.types';

@Component({
  selector: 'app-status-tag',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="tag" [attr.data-tone]="tone()">{{ label() }}</span>`,
  styles: `
    .tag {
      display: inline-block;
      padding: 0.15rem 0.6rem;
      border-radius: var(--adm-radius-pill);
      font-size: 0.75rem;
      font-weight: 500;
      line-height: 1.4;
      white-space: nowrap;
    }
    [data-tone='success'] {
      background: var(--adm-success-light);
      color: var(--adm-success-dark);
    }
    [data-tone='warning'] {
      background: var(--adm-warning-light);
      color: #b45309;
    }
    [data-tone='danger'] {
      background: var(--adm-danger-light);
      color: var(--adm-danger-dark);
    }
    [data-tone='info'] {
      background: var(--adm-primary-bg);
      color: var(--adm-primary-dark);
    }
    [data-tone='neutral'] {
      background: #e5e7eb;
      color: #4b5563;
    }
  `,
})
export class StatusTagComponent {
  readonly label = input.required<string>();
  readonly tone = input<Tone>('neutral');
}
