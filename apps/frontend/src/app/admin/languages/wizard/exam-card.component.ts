import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { ChangeBadgeComponent, FormFieldComponent } from '../../../shared/ui';
import { changedFieldNames, previousOf } from './language-wizard.diff';
import { errorOf, groupErrorOf } from './language-wizard.forms';
import { ExamEntry, LanguageWizardStore } from './language-wizard.store';

type TextField =
  | 'examDate'
  | 'registrationStartDate'
  | 'registrationDeadline'
  | 'maxParticipants'
  | 'subscriptionUrl';

@Component({
  selector: 'app-exam-card',
  standalone: true,
  imports: [DatePipe, ReactiveFormsModule, ChangeBadgeComponent, FormFieldComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './exam-card.component.html',
  styleUrl: './wizard-card.scss',
})
export class ExamCardComponent {
  readonly entry = input.required<ExamEntry>();

  protected readonly store = inject(LanguageWizardStore);
  private readonly toggled = signal<boolean | null>(null);

  protected readonly change = computed(
    () => this.store.examChanges().get(this.entry().key),
  );
  protected readonly state = computed(() => this.change()?.state ?? 'unchanged');
  protected readonly changed = computed(() => {
    const change = this.change();
    return change ? changedFieldNames(change) : new Set<string>();
  });
  protected readonly expanded = computed(
    () => this.toggled() ?? this.state() !== 'unchanged',
  );
  protected readonly summary = computed(() => {
    this.store.examChanges();
    const v = this.entry().form.getRawValue();
    const date = v.examDate ? new Date(v.examDate) : null;
    return { date, location: v.location, places: v.maxParticipants };
  });

  protected was(field: string): string | null {
    return previousOf(this.change(), field);
  }

  protected error(field: TextField): string {
    this.store.examChanges();
    return errorOf(this.entry().form.controls[field]);
  }

  protected groupError(): string {
    this.store.examChanges();
    return groupErrorOf(this.entry().form);
  }

  protected reset(): void {
    this.store.resetExam(this.entry().key);
    this.toggled.set(false);
  }

  protected open(): void {
    this.toggled.set(true);
  }
}
