import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ThemeService } from '../../../core/theme/theme.service';

/**
 * Accessible three-state theme toggle (light → dark → system).
 * Uses `aria-pressed` for the binary on/off affordance and an `aria-label`
 * that describes the *next* action. Pure CSS icons (no icon library).
 */
@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="toggle"
      [attr.aria-pressed]="mode() === 'dark'"
      [attr.aria-label]="label()"
      [title]="label()"
      (click)="theme.cycle()"
    >
      @switch (mode()) {
        @case ('light') {
          <svg viewBox="0 0 24 24" class="icon" aria-hidden="true" focusable="false">
            <circle cx="12" cy="12" r="5" fill="currentColor" />
            <g stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <line x1="12" y1="2" x2="12" y2="4" />
              <line x1="12" y1="20" x2="12" y2="22" />
              <line x1="2" y1="12" x2="4" y2="12" />
              <line x1="20" y1="12" x2="22" y2="12" />
              <line x1="4.9" y1="4.9" x2="6.3" y2="6.3" />
              <line x1="17.7" y1="17.7" x2="19.1" y2="19.1" />
              <line x1="4.9" y1="19.1" x2="6.3" y2="17.7" />
              <line x1="17.7" y1="6.3" x2="19.1" y2="4.9" />
            </g>
          </svg>
        }
        @case ('dark') {
          <svg viewBox="0 0 24 24" class="icon" aria-hidden="true" focusable="false">
            <path
              fill="currentColor"
              d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"
            />
          </svg>
        }
        @case ('system') {
          <svg viewBox="0 0 24 24" class="icon" aria-hidden="true" focusable="false">
            <rect
              x="3" y="4" width="18" height="13" rx="2"
              fill="none" stroke="currentColor" stroke-width="2"
            />
            <line x1="8" y1="21" x2="16" y2="21" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            <line x1="12" y1="17" x2="12" y2="21" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          </svg>
        }
      }
    </button>
  `,
  styles: `
    :host {
      display: inline-flex;
    }
    .toggle {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      padding: 0;
      border: 1px solid var(--adm-border, #eef1f6);
      border-radius: var(--adm-radius-card, 6px);
      background: var(--adm-surface, #fff);
      color: var(--adm-text-muted, #475569);
      cursor: pointer;
      transition: background 150ms ease, color 150ms ease, border-color 150ms ease;
    }
    .toggle:hover {
      background: var(--adm-surface-hover, #f1f5f9);
      color: var(--adm-text, #1f2937);
    }
    .toggle:focus-visible {
      outline: 2px solid var(--adm-primary, #0a5cbd);
      outline-offset: 2px;
    }
    .icon {
      width: 18px;
      height: 18px;
      display: block;
    }
  `,
})
export class ThemeToggleComponent {
  protected readonly theme = inject(ThemeService);
  protected readonly mode = this.theme.modeSignal;
  protected readonly label = computed(() => {
    switch (this.mode()) {
      case 'light':
        return 'Light theme (switch to dark)';
      case 'dark':
        return 'Dark theme (switch to system)';
      default:
        return 'System theme (switch to light)';
    }
  });
}
