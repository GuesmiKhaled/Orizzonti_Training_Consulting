import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { CefrLevelNamePipe } from '../../../pipes/cefr-level-name.pipe';
import { ExamCardComponent } from './exam-card.component';
import { LanguageWizardStore } from './language-wizard.store';

@Component({
  selector: 'app-exams-step',
  standalone: true,
  imports: [CefrLevelNamePipe, ExamCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @for (group of groups(); track group.key) {
      <section class="group">
        <h4>{{ group.cefr || 'Level' }} · {{ group.cefr | cefrLevelName }}</h4>
        @for (exam of group.exams; track exam.key) {
          <app-exam-card [entry]="exam" />
        } @empty {
          <p class="empty">No exams scheduled for this level.</p>
        }
        <button
          type="button"
          class="btn btn-secondary add"
          [disabled]="!group.cefr"
          (click)="store.addExam(group.key)"
        >
          + Add exam
        </button>
      </section>
    } @empty {
      <p class="empty">Add at least one level before scheduling exams.</p>
      <button type="button" class="btn btn-secondary" (click)="store.step.set(1)">
        Go to levels
      </button>
    }
  `,
  styles: `
    :host {
      display: grid;
      gap: 1.25rem;
    }
    .group {
      display: grid;
      gap: 0.6rem;
    }
    h4 {
      margin: 0;
      color: var(--adm-primary);
      font-size: 0.95rem;
    }
    .empty {
      margin: 0;
      color: #64748b;
    }
    .add {
      justify-self: start;
    }
  `,
})
export class ExamsStepComponent {
  protected readonly store = inject(LanguageWizardStore);

  protected readonly groups = computed(() => {
    this.store.levelChanges();
    const exams = this.store.exams();
    return this.store.levels().map((level) => ({
      key: level.key,
      cefr: level.form.controls.cefrLevel.value,
      exams: exams.filter((e) => e.levelKey === level.key),
    }));
  });
}
