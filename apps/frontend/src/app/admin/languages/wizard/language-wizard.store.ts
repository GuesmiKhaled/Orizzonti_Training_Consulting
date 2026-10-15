import { Injectable, computed, signal } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { LanguageItem } from '../../../services/orizzonti-api.service';
import { changeCount, diffValues } from './language-wizard.diff';
import {
  EMPTY_EXAM,
  EMPTY_LANGUAGE,
  EMPTY_LEVEL,
  ExamForm,
  LevelForm,
  createExamForm,
  createLanguageForm,
  createLevelForm,
} from './language-wizard.forms';
import {
  ExamPayload,
  LevelPayload,
  examCreatePayload,
  examPatch,
  examToValues,
  languageCreatePayload,
  languagePatch,
  languageToValues,
  levelCreatePayload,
  levelPatch,
  levelToValues,
} from './language-wizard.mapper';
import {
  CEFR_LEVELS,
  EntityChange,
  ExamValues,
  LanguageValues,
  LevelValues,
  WizardMode,
} from './language-wizard.types';

export interface LevelEntry {
  readonly key: string;
  readonly id: number | null;
  readonly form: LevelForm;
  /** Last saved values; null while the level has never been saved. */
  readonly baseline: LevelValues | null;
}

export interface ExamEntry {
  readonly key: string;
  readonly id: number | null;
  readonly levelKey: string;
  readonly form: ExamForm;
  readonly baseline: ExamValues | null;
}

export interface LanguageTreePayload {
  language: ReturnType<typeof languageCreatePayload>;
  levels: (LevelPayload & { exams: ExamPayload[] })[];
}

const NO_CHANGE: EntityChange = { state: 'unchanged', fields: [] };

/** One instance per open wizard; provide it in the wizard component. */
@Injectable()
export class LanguageWizardStore {
  readonly mode = signal<WizardMode>('create');
  readonly languageId = signal<number | null>(null);
  readonly step = signal(0);

  readonly languageForm = createLanguageForm();
  readonly languageBaseline = signal<LanguageValues | null>(null);
  readonly levels = signal<readonly LevelEntry[]>([]);
  readonly exams = signal<readonly ExamEntry[]>([]);

  private readonly revision = signal(0);
  private sequence = 0;

  constructor() {
    this.watch(this.languageForm);
  }

  /* ---------------------------------------------------------------- loading */

  load(language: LanguageItem | null): void {
    this.step.set(0);
    if (!language) {
      this.mode.set('create');
      this.languageId.set(null);
      this.languageBaseline.set(null);
      this.languageForm.reset(EMPTY_LANGUAGE);
      this.levels.set([]);
      this.exams.set([]);
      this.touch();
      return;
    }
    const values = languageToValues(language);
    this.mode.set('edit');
    this.languageId.set(language.id ?? null);
    this.languageBaseline.set(values);
    this.languageForm.reset(values);

    const order: readonly string[] = CEFR_LEVELS;
    const sorted = [...(language.levels ?? [])].sort(
      (a, b) => order.indexOf(a.cefrLevel) - order.indexOf(b.cefrLevel),
    );
    const levels: LevelEntry[] = [];
    const exams: ExamEntry[] = [];
    for (const level of sorted) {
      const entry = this.newLevelEntry(level.id ?? null, levelToValues(level), true);
      levels.push(entry);
      const sessions = [...(level.examSessions ?? [])].sort(
        (a, b) => Date.parse(a.examDate) - Date.parse(b.examDate),
      );
      for (const session of sessions) {
        exams.push(
          this.newExamEntry(session.id ?? null, entry.key, examToValues(session), true),
        );
      }
    }
    this.levels.set(levels);
    this.exams.set(exams);
    this.touch();
  }

  /* --------------------------------------------------------------- mutation */

  addLevel(cefrLevel?: string): LevelEntry {
    const entry = this.newLevelEntry(
      null,
      { ...EMPTY_LEVEL, cefrLevel: cefrLevel ?? this.firstFreeCefr() },
      false,
    );
    this.levels.update((list) => [...list, entry]);
    this.touch();
    return entry;
  }

  addExam(levelKey: string): ExamEntry {
    const entry = this.newExamEntry(null, levelKey, EMPTY_EXAM, false);
    this.exams.update((list) => [...list, entry]);
    this.touch();
    return entry;
  }

  /** Only never-saved levels can be removed here; saved ones are deleted from the Levels page. */
  removeNewLevel(key: string): void {
    const entry = this.levels().find((e) => e.key === key);
    if (!entry || entry.baseline) {
      return;
    }
    this.levels.update((list) => list.filter((e) => e.key !== key));
    this.exams.update((list) => list.filter((e) => e.levelKey !== key));
    this.touch();
  }

  removeNewExam(key: string): void {
    const entry = this.exams().find((e) => e.key === key);
    if (!entry || entry.baseline) {
      return;
    }
    this.exams.update((list) => list.filter((e) => e.key !== key));
    this.touch();
  }

  resetLanguage(): void {
    this.languageForm.reset(this.languageBaseline() ?? EMPTY_LANGUAGE);
  }

  resetLevel(key: string): void {
    const entry = this.levels().find((e) => e.key === key);
    if (entry?.baseline) {
      entry.form.reset(entry.baseline);
    }
  }

  resetExam(key: string): void {
    const entry = this.exams().find((e) => e.key === key);
    if (entry?.baseline) {
      entry.form.reset(entry.baseline);
    }
  }

  /* ---------------------------------------------------------- save progress */

  markLanguageSaved(id?: number): void {
    if (id !== undefined) {
      this.languageId.set(id);
    }
    this.languageBaseline.set(this.languageForm.getRawValue());
    this.touch();
  }

  markLevelSaved(key: string, id: number): void {
    this.levels.update((list) =>
      list.map((e) =>
        e.key === key ? { ...e, id, baseline: e.form.getRawValue() } : e,
      ),
    );
    this.touch();
  }

  markExamSaved(key: string, id: number): void {
    this.exams.update((list) =>
      list.map((e) =>
        e.key === key ? { ...e, id, baseline: e.form.getRawValue() } : e,
      ),
    );
    this.touch();
  }

  /* ----------------------------------------------------------------- state */

  readonly languageChange = computed<EntityChange>(() => {
    this.revision();
    return diffValues(this.languageBaseline(), this.languageForm.getRawValue());
  });

  readonly levelChanges = computed(() => {
    this.revision();
    return new Map(
      this.levels().map((e) => [e.key, diffValues(e.baseline, e.form.getRawValue())]),
    );
  });

  readonly examChanges = computed(() => {
    this.revision();
    return new Map(
      this.exams().map((e) => [e.key, diffValues(e.baseline, e.form.getRawValue())]),
    );
  });

  /** Unsaved changes per step; always zero while creating. */
  readonly stepChangeCounts = computed<readonly [number, number, number]>(() => {
    if (this.mode() === 'create') {
      return [0, 0, 0];
    }
    const sum = (changes: Iterable<EntityChange>): number =>
      Array.from(changes).reduce((total, c) => total + changeCount(c), 0);
    return [
      changeCount(this.languageChange()),
      sum(this.levelChanges().values()),
      sum(this.examChanges().values()),
    ];
  });

  readonly totalChanges = computed(() =>
    this.stepChangeCounts().reduce((a, b) => a + b, 0),
  );

  readonly summary = computed(() => {
    const parts: string[] = [];
    const language = this.languageChange();
    if (language.state === 'modified') {
      parts.push(`language ${language.fields.map((f) => f.label).join('/')}`);
    }
    for (const entry of this.levels()) {
      const change = this.levelChanges().get(entry.key) ?? NO_CHANGE;
      const name = entry.form.controls.cefrLevel.value || 'level';
      if (change.state === 'new') {
        parts.push(`${name} added`);
      } else if (change.state === 'modified') {
        parts.push(`${name} ${change.fields.map((f) => f.label).join('/')}`);
      }
    }
    const examChanges = this.examChanges();
    const newExams = this.exams().filter((e) => examChanges.get(e.key)?.state === 'new');
    const modifiedExams = this.exams().filter(
      (e) => examChanges.get(e.key)?.state === 'modified',
    );
    if (newExams.length) {
      parts.push(`${newExams.length} exam${newExams.length > 1 ? 's' : ''} added`);
    }
    if (modifiedExams.length) {
      parts.push(`${modifiedExams.length} exam${modifiedExams.length > 1 ? 's' : ''} edited`);
    }
    return parts.length > 3 ? `${parts.slice(0, 3).join(', ')}, ...` : parts.join(', ');
  });

  readonly duplicateLevels = computed<ReadonlySet<string>>(() => {
    this.revision();
    const seen = new Set<string>();
    const duplicates = new Set<string>();
    for (const entry of this.levels()) {
      const value = entry.form.controls.cefrLevel.value;
      if (value && seen.has(value)) {
        duplicates.add(value);
      }
      seen.add(value);
    }
    return duplicates;
  });

  readonly stepValid = computed<readonly [boolean, boolean, boolean]>(() => {
    this.revision();
    const valid = (c: AbstractControl): boolean => c.valid;
    return [
      valid(this.languageForm),
      this.levels().every((e) => valid(e.form)) && this.duplicateLevels().size === 0,
      this.exams().every((e) => valid(e.form)),
    ];
  });

  readonly canSave = computed(
    () =>
      this.stepValid().every(Boolean) &&
      (this.mode() === 'create' || this.totalChanges() > 0),
  );

  /** True when closing would lose work the user typed. */
  readonly hasUnsaved = computed(() => {
    if (this.mode() === 'edit') {
      return this.totalChanges() > 0;
    }
    return (
      this.languageChange().state === 'new' &&
      (this.languageForm.getRawValue().name.trim() !== '' ||
        this.levels().length > 0)
    );
  });

  /** Reveals validation messages on every form, e.g. after a failed save attempt. */
  showErrors(): void {
    this.languageForm.markAllAsTouched();
    this.levels().forEach((e) => e.form.markAllAsTouched());
    this.exams().forEach((e) => e.form.markAllAsTouched());
    this.touch();
  }

  levelIdFor(levelKey: string): number | null {
    return this.levels().find((e) => e.key === levelKey)?.id ?? null;
  }

  /* -------------------------------------------------------------- payloads */

  createPayload(): LanguageTreePayload {
    const examsByLevel = (levelKey: string): ExamPayload[] =>
      this.exams()
        .filter((e) => e.levelKey === levelKey)
        .map((e) => examCreatePayload(e.form.getRawValue()));
    return {
      language: languageCreatePayload(this.languageForm.getRawValue()),
      levels: this.levels().map((l) => ({
        ...levelCreatePayload(l.form.getRawValue()),
        exams: examsByLevel(l.key),
      })),
    };
  }

  languagePatchPayload() {
    return languagePatch(this.languageChange(), this.languageForm.getRawValue());
  }

  levelPatchPayload(entry: LevelEntry) {
    const change = this.levelChanges().get(entry.key) ?? NO_CHANGE;
    return levelPatch(change, entry.form.getRawValue());
  }

  examPatchPayload(entry: ExamEntry) {
    const change = this.examChanges().get(entry.key) ?? NO_CHANGE;
    return examPatch(change, entry.form.getRawValue());
  }

  /* --------------------------------------------------------------- helpers */

  private firstFreeCefr(): string {
    const used = new Set(this.levels().map((e) => e.form.controls.cefrLevel.value));
    return CEFR_LEVELS.find((level) => !used.has(level)) ?? '';
  }

  private newLevelEntry(id: number | null, values: LevelValues, saved: boolean): LevelEntry {
    const form = createLevelForm(values);
    this.watch(form);
    return {
      key: `level-${++this.sequence}`,
      id,
      form,
      baseline: saved ? values : null,
    };
  }

  private newExamEntry(
    id: number | null,
    levelKey: string,
    values: ExamValues,
    saved: boolean,
  ): ExamEntry {
    const form = createExamForm(values);
    this.watch(form);
    return {
      key: `exam-${++this.sequence}`,
      id,
      levelKey,
      form,
      baseline: saved ? values : null,
    };
  }

  private watch(form: AbstractControl): void {
    form.valueChanges.subscribe(() => this.touch());
    form.statusChanges.subscribe(() => this.touch());
  }

  private touch(): void {
    this.revision.update((v) => v + 1);
  }
}
