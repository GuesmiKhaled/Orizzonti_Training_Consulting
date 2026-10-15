import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { LanguagesService } from '../../../core/api/entities/language.services';
import { ToastService } from '../../../core/toast/toast.service';
import {
  ConfirmDialogComponent,
  ModalShellComponent,
  StepperComponent,
  StepperStep,
} from '../../../shared/ui';
import { ExamsStepComponent } from './exams-step.component';
import { LanguageStepComponent } from './language-step.component';
import { LanguageWizardSaveService } from './language-wizard-save.service';
import { LanguageWizardStore } from './language-wizard.store';
import { LevelsStepComponent } from './levels-step.component';

const STEP_LABELS = ['Language', 'Levels', 'Exams'] as const;
const LAST_STEP = STEP_LABELS.length - 1;

/** Create (3 steps, saved in one transaction) or edit (only changes are saved). */
@Component({
  selector: 'app-language-wizard',
  standalone: true,
  imports: [
    ConfirmDialogComponent,
    ExamsStepComponent,
    LanguageStepComponent,
    LevelsStepComponent,
    ModalShellComponent,
    StepperComponent,
  ],
  providers: [LanguageWizardStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './language-wizard.component.html',
  styleUrl: './language-wizard.component.scss',
})
export class LanguageWizardComponent implements OnInit {
  /** Null creates a new language. */
  readonly languageId = input<number | null>(null);
  readonly initialStep = input(0);
  /** Edit mode only: start with a fresh level card. */
  readonly addLevel = input(false);

  readonly closed = output<void>();
  readonly saved = output<void>();

  protected readonly store = inject(LanguageWizardStore);
  private readonly languages = inject(LanguagesService);
  private readonly saveService = inject(LanguageWizardSaveService);
  private readonly toast = inject(ToastService);

  protected readonly loading = signal(false);
  protected readonly loadFailed = signal(false);
  protected readonly saving = signal(false);
  protected readonly confirmingDiscard = signal(false);
  protected readonly lastStep = LAST_STEP;

  protected readonly isEdit = computed(() => this.store.mode() === 'edit');
  protected readonly title = computed(() => {
    this.store.languageChange();
    return this.isEdit()
      ? `Edit ${this.store.languageBaseline()?.name ?? 'language'}`
      : 'Add language';
  });
  protected readonly steps = computed<readonly StepperStep[]>(() =>
    STEP_LABELS.map((label, index) => ({
      label,
      changes: this.store.stepChangeCounts()[index],
    })),
  );
  protected readonly saveLabel = computed(() => {
    const total = this.store.totalChanges();
    return `Save ${total} change${total === 1 ? '' : 's'}`;
  });
  protected readonly footerText = computed(() => {
    if (!this.isEdit()) {
      return `Step ${this.store.step() + 1} of ${STEP_LABELS.length}`;
    }
    const total = this.store.totalChanges();
    if (total === 0) {
      return 'No unsaved changes';
    }
    return `${total} unsaved change${total > 1 ? 's' : ''}: ${this.store.summary()}`;
  });

  ngOnInit(): void {
    const id = this.languageId();
    if (id === null) {
      this.store.load(null);
      this.store.step.set(this.initialStep());
      return;
    }
    this.loading.set(true);
    this.languages.get(id).subscribe({
      next: (language) => {
        this.store.load(language);
        this.store.step.set(this.initialStep());
        if (this.addLevel()) {
          this.store.addLevel();
        }
        this.loading.set(false);
      },
      error: () => {
        this.loadFailed.set(true);
        this.loading.set(false);
      },
    });
  }

  protected goTo(step: number): void {
    const valid = this.store.stepValid();
    const blocked =
      !this.isEdit() && step > this.store.step() && !valid.slice(0, step).every(Boolean);
    if (blocked) {
      this.store.showErrors();
      return;
    }
    this.store.step.set(step);
  }

  protected next(): void {
    this.goTo(Math.min(this.store.step() + 1, LAST_STEP));
  }

  protected back(): void {
    this.store.step.set(Math.max(this.store.step() - 1, 0));
  }

  protected requestClose(): void {
    if (this.saving()) {
      return;
    }
    if (this.store.hasUnsaved()) {
      this.confirmingDiscard.set(true);
      return;
    }
    this.closed.emit();
  }

  protected discard(): void {
    this.confirmingDiscard.set(false);
    this.closed.emit();
  }

  protected save(): void {
    if (!this.store.canSave()) {
      this.store.showErrors();
      return;
    }
    this.saving.set(true);
    if (this.isEdit()) {
      this.saveService.saveEdit(this.store).subscribe({
        complete: () => this.finish('Changes saved.'),
        error: () => this.saving.set(false),
      });
      return;
    }
    this.saveService.create(this.store).subscribe({
      next: (language) => this.finish(`${language.name} created.`),
      error: () => this.saving.set(false),
    });
  }

  private finish(message: string): void {
    this.saving.set(false);
    this.toast.success(message);
    this.saved.emit();
    this.closed.emit();
  }
}
