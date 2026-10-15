import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Accent } from '../ui.types';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="card" [attr.data-accent]="accent()">
      <span class="label">{{ label() }}</span>
      <strong class="value">{{ value() }}</strong>
    </article>
  `,
  styles: `
    .card {
      display: grid;
      gap: 0.2rem;
      padding: 0.75rem 1rem;
      border-left: 4px solid var(--accent);
      border-radius: var(--adm-radius-card);
      background: #fff;
      box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
    }
    [data-accent='primary'] {
      --accent: var(--adm-primary);
    }
    [data-accent='success'] {
      --accent: var(--adm-success);
    }
    [data-accent='danger'] {
      --accent: var(--adm-danger);
    }
    [data-accent='warning'] {
      --accent: var(--adm-warning);
    }
    [data-accent='dark'] {
      --accent: #374151;
    }
    .label {
      color: #1f2937;
      font-size: 0.85rem;
    }
    .value {
      font-size: 1.6rem;
      line-height: 1.2;
    }
  `,
})
export class StatCardComponent {
  readonly label = input.required<string>();
  readonly value = input.required<string | number>();
  readonly accent = input<Accent>('primary');
}
