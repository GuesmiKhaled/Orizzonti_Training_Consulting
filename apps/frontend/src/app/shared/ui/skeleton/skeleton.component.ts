import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type SkeletonVariant = 'text' | 'rect' | 'circle';

/**
 * Lightweight loading placeholder. Pure CSS shimmer; respects
 * `prefers-reduced-motion` via the global guard in base.scss.
 */
@Component({
  selector: 'app-skeleton',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (variant() === 'text' && lines() > 1) {
      <span class="multiline" aria-hidden="true">
        @for (line of linesArray(); track $index) {
          <span class="line" [style.width]="lineWidth($index)"></span>
        }
      </span>
    } @else {
      <span
        class="bone"
        [class.text]="variant() === 'text'"
        [class.circle]="variant() === 'circle'"
        [style.width]="width()"
        [style.height]="height()"
        aria-hidden="true"
      ></span>
    }
  `,
  styles: `
    :host {
      display: inline-block;
    }
    .bone,
    .line {
      display: block;
      background: linear-gradient(
        90deg,
        var(--adm-surface-muted, #f8fafc) 25%,
        var(--adm-surface-hover, #f1f5f9) 37%,
        var(--adm-surface-muted, #f8fafc) 63%
      );
      background-size: 400% 100%;
      animation: shimmer 1.4s ease-in-out infinite;
      border-radius: var(--adm-radius-card, 6px);
    }
    .bone.circle {
      border-radius: 50%;
    }
    .multiline {
      display: grid;
      gap: 0.5rem;
      width: 100%;
    }
    .line {
      height: 0.85rem;
    }
    @keyframes shimmer {
      0% { background-position: 100% 50%; }
      100% { background-position: 0 50%; }
    }
  `,
})
export class SkeletonComponent {
  readonly variant = input<SkeletonVariant>('text');
  readonly width = input<string>('100%');
  readonly height = input<string>('1rem');
  readonly lines = input(1);

  protected linesArray(): number[] {
    return Array.from({ length: this.lines() }, (_, i) => i);
  }

  protected lineWidth(index: number): string {
    // Last line shorter to mimic natural paragraph shape.
    return index === this.lines() - 1 ? '80%' : '100%';
  }
}
