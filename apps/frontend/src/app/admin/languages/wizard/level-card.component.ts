import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { CefrLevelNamePipe } from '../../../pipes/cefr-level-name.pipe';
import { ChangeBadgeComponent, FormFieldComponent } from '../../../shared/ui';
import { changedFieldNames, previousOf } from './language-wizard.diff';
import { errorOf } from './language-wizard.forms';
import { LanguageWizardStore, LevelEntry } from './language-wizard.store';
import { CEFR_LEVELS } from './language-wizard.types';

@Component({
  selector: 'app-level-card',
  standalone: true,
  imports: [ReactiveFormsModule, CefrLevelNamePipe, ChangeBadgeComponent, FormFieldComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './level-card.component.html',
  styleUrl: './wizard-card.scss',
})
export class LevelCardComponent {
  readonly entry = input.required<LevelEntry>();

  protected readonly store = inject(LanguageWizardStore);
  protected readonly levels = CEFR_LEVELS;
  private readonly toggled = signal<boolean | null>(null);

  protected readonly change = computed(
    () => this.store.levelChanges().get(this.entry().key),
  );
  protected readonly state = computed(() => this.change()?.state ?? 'unchanged');
  protected readonly changed = computed(() => {
    const change = this.change();
    return change ? changedFieldNames(change) : new Set<string>();
  });
  /** Unchanged saved cards stay collapsed until the user opens them. */
  protected readonly expanded = computed(
    () => this.toggled() ?? this.state() !== 'unchanged',
  );
  protected readonly summary = computed(() => {
    const v = this.entry().form.getRawValue();
    return [
      v.cefrLevel,
      v.courseHours ? `${v.courseHours} h` : '',
      v.price ? v.price : '',
    ]
      .filter(Boolean)
      .join(' · ');
  });
  protected readonly duplicate = computed(() =>
    this.store.duplicateLevels().has(this.entry().form.controls.cefrLevel.value),
  );

  protected was(field: string): string | null {
    return previousOf(this.change(), field);
  }

  protected error(field: 'courseHours' | 'price'): string {
    this.store.levelChanges();
    return errorOf(this.entry().form.controls[field]);
  }

  protected reset(): void {
    this.store.resetLevel(this.entry().key);
    this.toggled.set(false);
  }

  protected open(): void {
    this.toggled.set(true);
  }
}
