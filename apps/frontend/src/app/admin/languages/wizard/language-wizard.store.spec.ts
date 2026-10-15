import { TestBed } from '@angular/core/testing';
import { LanguageItem } from '../../../services/orizzonti-api.service';
import { LanguageWizardStore } from './language-wizard.store';

const exam = (id: number, day: number) => ({
  id,
  examDate: new Date(2026, 11, day, 9, 0).toISOString(),
  registrationStartDate: new Date(2026, 10, 1, 9, 0).toISOString(),
  registrationDeadline: new Date(2026, 10, day, 9, 0).toISOString(),
  location: 'Tunis',
  maxParticipants: 20,
  isActive: true,
});

const LANGUAGE: LanguageItem = {
  id: 7,
  name: 'English',
  code: 'ENG',
  nativeName: 'English',
  isActive: true,
  levels: [
    { id: 12, cefrLevel: 'A2', courseHours: '120', price: '500', isActive: true, examSessions: [exam(2, 20)] },
    { id: 11, cefrLevel: 'A1', courseHours: '120', price: '500', isActive: true, examSessions: [exam(1, 10)] },
  ],
};

describe('LanguageWizardStore', () => {
  let store: LanguageWizardStore;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [LanguageWizardStore] });
    store = TestBed.inject(LanguageWizardStore);
  });

  describe('create mode', () => {
    beforeEach(() => store.load(null));

    it('starts empty, invalid and with no tracked changes', () => {
      expect(store.mode()).toBe('create');
      expect(store.stepChangeCounts()).toEqual([0, 0, 0]);
      expect(store.canSave()).toBeFalse();
    });

    it('becomes savable once the language is valid, without levels', () => {
      store.languageForm.controls.name.setValue('French');
      expect(store.canSave()).toBeTrue();
    });

    it('requires hours and price on a level', () => {
      store.languageForm.controls.name.setValue('French');
      const level = store.addLevel();
      expect(store.canSave()).toBeFalse();
      level.form.patchValue({ courseHours: '90', price: '400' });
      expect(store.canSave()).toBeTrue();
    });

    it('adds levels with the first free CEFR level and rejects duplicates', () => {
      store.languageForm.controls.name.setValue('French');
      const first = store.addLevel();
      const second = store.addLevel();
      expect(first.form.controls.cefrLevel.value).toBe('A1');
      expect(second.form.controls.cefrLevel.value).toBe('A2');

      second.form.controls.cefrLevel.setValue('A1');
      expect(store.duplicateLevels().has('A1')).toBeTrue();
      expect(store.canSave()).toBeFalse();
    });

    it('requires exam dates in the right order', () => {
      store.languageForm.controls.name.setValue('French');
      const level = store.addLevel();
      level.form.patchValue({ courseHours: '90', price: '400' });
      const exam = store.addExam(level.key);
      exam.form.patchValue({
        examDate: '2026-12-10T09:00',
        registrationStartDate: '2026-11-01T09:00',
        registrationDeadline: '2026-12-11T09:00',
      });
      expect(store.canSave()).toBeFalse();
      expect(exam.form.errors?.['deadlineAfterExam']).toBeTrue();

      exam.form.controls.registrationDeadline.setValue('2026-11-30T09:00');
      expect(store.canSave()).toBeTrue();
    });

    it('builds the transactional payload with exams nested under their level', () => {
      store.languageForm.patchValue({ name: ' French ', code: 'FRA' });
      const level = store.addLevel();
      level.form.patchValue({ courseHours: '90', price: '400' });
      store.addExam(level.key).form.patchValue({
        examDate: '2026-12-10T09:00',
        registrationStartDate: '2026-11-01T09:00',
        registrationDeadline: '2026-11-30T09:00',
        maxParticipants: '15',
      });

      const payload = store.createPayload();
      expect(payload.language).toEqual({
        name: 'French',
        code: 'FRA',
        nativeName: undefined,
        imageUrl: undefined,
        isActive: true,
      });
      expect(payload.levels.length).toBe(1);
      expect(payload.levels[0].cefrLevel).toBe('A1');
      expect(payload.levels[0].exams[0].maxParticipants).toBe(15);
      expect(payload.levels[0].exams[0].examDate).toBe(
        new Date('2026-12-10T09:00').toISOString(),
      );
    });

    it('flags unsaved work only once the user typed something', () => {
      expect(store.hasUnsaved()).toBeFalse();
      store.languageForm.controls.name.setValue('French');
      expect(store.hasUnsaved()).toBeTrue();
    });

    it('removes a new level together with its exams', () => {
      const level = store.addLevel();
      store.addExam(level.key);
      store.removeNewLevel(level.key);
      expect(store.levels().length).toBe(0);
      expect(store.exams().length).toBe(0);
    });
  });

  describe('edit mode', () => {
    beforeEach(() => store.load(LANGUAGE));

    it('loads the snapshot with levels in CEFR order and no changes', () => {
      expect(store.mode()).toBe('edit');
      expect(store.languageId()).toBe(7);
      expect(store.levels().map((l) => l.form.controls.cefrLevel.value)).toEqual(['A1', 'A2']);
      expect(store.exams().length).toBe(2);
      expect(store.totalChanges()).toBe(0);
      expect(store.canSave()).toBeFalse();
    });

    it('tracks a modified field, shows it in the summary and per-step badge', () => {
      store.levels()[1].form.controls.price.setValue('550');
      expect(store.stepChangeCounts()).toEqual([0, 1, 0]);
      expect(store.totalChanges()).toBe(1);
      expect(store.summary()).toBe('A2 price');
      expect(store.canSave()).toBeTrue();
    });

    it('matches the wireframe: A2 price edited and B1 added is 2 changes', () => {
      store.levels()[1].form.controls.price.setValue('550');
      store.addLevel('B1');
      expect(store.totalChanges()).toBe(2);
      expect(store.stepChangeCounts()).toEqual([0, 2, 0]);
      expect(store.summary()).toBe('A2 price, B1 added');
    });

    it('tracks the language image like any other field', () => {
      store.languageForm.controls.imageUrl.setValue('/img/eng/english.jpg');
      expect(store.stepChangeCounts()).toEqual([1, 0, 0]);
      expect(store.summary()).toBe('language image');
      expect(store.languagePatchPayload()).toEqual({ imageUrl: '/img/eng/english.jpg' });
      store.resetLanguage();
      expect(store.totalChanges()).toBe(0);
    });

    it('resets a modified level back to its baseline', () => {
      const entry = store.levels()[1];
      entry.form.controls.price.setValue('550');
      store.resetLevel(entry.key);
      expect(entry.form.controls.price.value).toBe('500');
      expect(store.totalChanges()).toBe(0);
    });

    it('does not allow removing saved levels or exams from the wizard', () => {
      store.removeNewLevel(store.levels()[0].key);
      store.removeNewExam(store.exams()[0].key);
      expect(store.levels().length).toBe(2);
      expect(store.exams().length).toBe(2);
    });

    it('produces patches containing only changed fields', () => {
      store.languageForm.controls.name.setValue('British English');
      store.exams()[0].form.controls.maxParticipants.setValue('25');
      expect(store.languagePatchPayload()).toEqual({ name: 'British English' });
      expect(store.examPatchPayload(store.exams()[0])).toEqual({ maxParticipants: 25 });
      expect(store.levelPatchPayload(store.levels()[0])).toBeNull();
    });

    it('treats saved items as the new baseline so a retry sends only the rest', () => {
      const entry = store.levels()[1];
      entry.form.controls.price.setValue('550');
      store.languageForm.controls.name.setValue('British English');

      store.markLevelSaved(entry.key, 12);
      expect(store.levelChanges().get(entry.key)?.state).toBe('unchanged');
      expect(store.totalChanges()).toBe(1);

      store.markLanguageSaved();
      expect(store.totalChanges()).toBe(0);
    });

    it('reveals validation messages after a failed attempt', () => {
      const added = store.addLevel('B1');
      expect(added.form.controls.price.touched).toBeFalse();
      store.showErrors();
      expect(added.form.controls.price.touched).toBeTrue();
    });

    it('records the id of a newly created level', () => {
      const added = store.addLevel('B1');
      store.markLevelSaved(added.key, 99);
      expect(store.levelIdFor(added.key)).toBe(99);
      expect(store.levelChanges().get(added.key)?.state).toBe('unchanged');
    });
  });
});
