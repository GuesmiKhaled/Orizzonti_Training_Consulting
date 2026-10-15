/// <reference types="jasmine" />
import { changeCount, changedFieldNames, diffValues } from './language-wizard.diff';
import {
  examPatch,
  fromLocalInput,
  languagePatch,
  levelPatch,
  toLocalInput,
} from './language-wizard.mapper';
import { ExamValues, LevelValues } from './language-wizard.types';

const LEVEL: LevelValues = { cefrLevel: 'A2', courseHours: '120', price: '500', isActive: true };

describe('diffValues', () => {
  it('reports a never-saved entity as new', () => {
    expect(diffValues(null, LEVEL)).toEqual({ state: 'new', fields: [] });
  });

  it('reports identical values as unchanged', () => {
    expect(diffValues(LEVEL, { ...LEVEL }).state).toBe('unchanged');
  });

  it('lists only changed fields with their old and new values', () => {
    const change = diffValues(LEVEL, { ...LEVEL, price: '550' });
    expect(change.state).toBe('modified');
    expect(change.fields).toEqual([
      { field: 'price', label: 'price', from: '500', to: '550' },
    ]);
  });

  it('detects boolean changes', () => {
    const change = diffValues(LEVEL, { ...LEVEL, isActive: false });
    expect(change.fields.map((f) => f.field)).toEqual(['isActive']);
  });

  it('treats a value changed back to the baseline as unchanged', () => {
    const edited = { ...LEVEL, price: '999' };
    expect(diffValues(LEVEL, edited).state).toBe('modified');
    expect(diffValues(LEVEL, { ...edited, price: '500' }).state).toBe('unchanged');
  });
});

describe('changeCount / changedFieldNames', () => {
  it('counts a new entity as one and a modified one per field', () => {
    expect(changeCount({ state: 'new', fields: [] })).toBe(1);
    expect(changeCount({ state: 'unchanged', fields: [] })).toBe(0);
    const modified = diffValues(LEVEL, { ...LEVEL, price: '1', courseHours: '2' });
    expect(changeCount(modified)).toBe(2);
    expect(Array.from(changedFieldNames(modified))).toEqual(['courseHours', 'price']);
  });
});

describe('patch payloads', () => {
  it('sends only the changed fields', () => {
    const change = diffValues(LEVEL, { ...LEVEL, price: '550' });
    expect(levelPatch(change, { ...LEVEL, price: '550' })).toEqual({ price: '550' });
  });

  it('returns null when nothing changed or the entity is new', () => {
    expect(levelPatch(diffValues(LEVEL, LEVEL), LEVEL)).toBeNull();
    expect(levelPatch(diffValues(null, LEVEL), LEVEL)).toBeNull();
  });

  it('sends cleared optional text as null so it can be removed', () => {
    const cleared = { ...LEVEL, price: '  ' };
    expect(levelPatch(diffValues(LEVEL, cleared), cleared)).toEqual({ price: null });
  });

  it('never nulls the required language name', () => {
    const base = { name: 'English', code: 'ENG', nativeName: '', imageUrl: '', isActive: true };
    const next = { ...base, name: ' British English ', code: '' };
    expect(languagePatch(diffValues(base, next), next)).toEqual({
      name: 'British English',
      code: null,
    });
  });

  it('sends a chosen language image, and null when it is removed', () => {
    const base = { name: 'English', code: '', nativeName: '', imageUrl: '/img/cat-1.jpg', isActive: true };
    const changed = { ...base, imageUrl: '/img/eng/english.jpg' };
    expect(languagePatch(diffValues(base, changed), changed)).toEqual({ imageUrl: '/img/eng/english.jpg' });
    const removed = { ...base, imageUrl: '' };
    expect(languagePatch(diffValues(base, removed), removed)).toEqual({ imageUrl: null });
  });

  it('converts exam dates to ISO and places to numbers or null', () => {
    const base: ExamValues = {
      examDate: '2026-12-10T09:00',
      registrationStartDate: '2026-11-01T09:00',
      registrationDeadline: '2026-11-30T09:00',
      location: 'Tunis',
      price: '',
      courseHours: '',
      subscriptionUrl: '',
      maxParticipants: '20',
      isActive: true,
    };
    const next = { ...base, examDate: '2026-12-12T10:30', maxParticipants: '' };
    const patch = examPatch(diffValues(base, next), next);
    expect(patch).toEqual({
      examDate: new Date('2026-12-12T10:30').toISOString(),
      maxParticipants: null,
    });
  });
});

describe('local date conversion', () => {
  it('round-trips a local datetime through ISO', () => {
    const local = '2026-12-10T09:30';
    expect(toLocalInput(fromLocalInput(local))).toBe(local);
  });

  it('shows the local wall-clock time of an ISO instant', () => {
    const iso = new Date(2026, 9, 29, 8, 5).toISOString();
    expect(toLocalInput(iso)).toBe('2026-10-29T08:05');
  });

  it('returns an empty string for missing or invalid dates', () => {
    expect(toLocalInput(undefined)).toBe('');
    expect(toLocalInput('not a date')).toBe('');
  });
});
