import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { LevelCardComponent } from './level-card.component';
import { LanguageWizardStore } from './language-wizard.store';
import { CEFR_LEVELS } from './language-wizard.types';

@Component({
  selector: 'app-levels-step',
  standalone: true,
  imports: [LevelCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="stack">
      @for (entry of store.levels(); track entry.key) {
        <app-level-card [entry]="entry" />
      } @empty {
        <p class="empty">No levels yet. Add the CEFR levels you teach.</p>
      }
      <button
        type="button"
        class="btn btn-secondary add"
        [disabled]="!canAdd()"
        (click)="store.addLevel()"
      >
        + Add level
      </button>
    </div>
  `,
  styles: `
    .stack {
      display: grid;
      gap: 0.75rem;
    }
    .empty {
      margin: 0;
      color: #475569;
    }
    .add {
      justify-self: start;
    }
  `,
})
export class LevelsStepComponent {
  protected readonly store = inject(LanguageWizardStore);
  protected readonly canAdd = computed(
    () => this.store.levels().length < CEFR_LEVELS.length,
  );
}
