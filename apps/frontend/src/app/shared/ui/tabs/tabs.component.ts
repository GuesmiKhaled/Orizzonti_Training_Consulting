import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  contentChildren,
  input,
  signal,
} from '@angular/core';
import { TabComponent } from './tab.component';

/**
 * Accessible tabs (ARIA tablist pattern). Arrow keys move between tabs,
 * Home/End jump to first/last, and the active tab's panel is shown.
 * Usage:
 *   <app-tabs>
 *     <app-tab label="General">...</app-tab>
 *     <app-tab label="Security">...</app-tab>
 *   </app-tabs>
 */
@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tablist" role="tablist" (keydown)="onKeydown($event)">
      @for (tab of tabs(); track tab; let i = $index) {
        <button
          type="button"
          role="tab"
          class="tab"
          [id]="'tab-' + i"
          [attr.aria-selected]="i === active()"
          [attr.aria-controls]="'panel-' + i"
          [class.active]="i === active()"
          [tabindex]="i === active() ? 0 : -1"
          (click)="select(i)"
        >
          {{ tab.label() }}
        </button>
      }
    </div>
    @for (tab of tabs(); track tab; let i = $index) {
      <div
        role="tabpanel"
        [id]="'panel-' + i"
        [attr.aria-labelledby]="'tab-' + i"
        [hidden]="i !== active()"
      >
        <ng-container [ngTemplateOutlet]="tab.content() ?? null" />
      </div>
    }
  `,
  styles: `
    :host { display: block; }
    .tablist {
      display: flex;
      gap: 0.25rem;
      border-bottom: 1px solid var(--adm-border, #eef1f6);
    }
    .tab {
      padding: 0.6rem 1rem;
      border: 0;
      background: transparent;
      color: var(--adm-text-muted, #475569);
      font: inherit;
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      border-bottom: 2px solid transparent;
      transition: color 150ms ease, border-color 150ms ease;
    }
    .tab:hover { color: var(--adm-text, #1f2937); }
    .tab.active {
      color: var(--adm-primary, #0a5cbd);
      border-bottom-color: var(--adm-primary, #0a5cbd);
    }
    .tab:focus-visible {
      outline: 2px solid var(--adm-primary, #0a5cbd);
      outline-offset: -2px;
    }
  `,
})
export class TabsComponent {
  readonly tabs = contentChildren(TabComponent);
  readonly active = signal(0);
  readonly selectedIndex = input<number | null>(null);

  select(i: number): void {
    this.active.set(i);
  }

  onKeydown(event: KeyboardEvent): void {
    const count = this.tabs().length;
    if (!count) return;
    let next = this.active();
    switch (event.key) {
      case 'ArrowRight': next = (next + 1) % count; break;
      case 'ArrowLeft': next = (next - 1 + count) % count; break;
      case 'Home': next = 0; break;
      case 'End': next = count - 1; break;
      default: return;
    }
    event.preventDefault();
    this.select(next);
    const btn = document.getElementById('tab-' + next);
    btn?.focus();
  }
}
