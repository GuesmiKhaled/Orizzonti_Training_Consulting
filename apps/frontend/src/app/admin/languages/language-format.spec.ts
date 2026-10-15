import { LanguageItem } from '../../services/orizzonti-api.service';
import {
  formatDate,
  placesLabel,
  summarize,
  toExamRows,
  toLevelRows,
} from './language-format';

const NOW = new Date('2026-10-15T12:00:00Z');

const exam = (id: number, iso: string, extra: object = {}) => ({
  id,
  examDate: iso,
  registrationStartDate: '2026-09-01T00:00:00Z',
  registrationDeadline: '2026-09-20T00:00:00Z',
  ...extra,
});

const ENGLISH: LanguageItem = {
  id: 1,
  name: 'English',
  code: 'ENG',
  isActive: true,
  levels: [
    {
      id: 2,
      cefrLevel: 'A2',
      price: '500',
      courseHours: '120',
      examSessions: [exam(20, '2026-12-01T09:00:00Z'), exam(21, '2026-10-29T09:00:00Z')],
    },
    { id: 1, cefrLevel: 'A1', examSessions: [exam(10, '2026-01-01T09:00:00Z')] },
  ],
};

const FRENCH: LanguageItem = { id: 3, name: 'French', isActive: false };

describe('summarize', () => {
  it('counts levels and exams and picks the earliest upcoming exam', () => {
    const summary = summarize(ENGLISH, NOW);
    expect(summary.levelsCount).toBe(2);
    expect(summary.examsCount).toBe(3);
    expect(summary.nextExam).toBe('2026-10-29T09:00:00Z');
    expect(summary.active).toBeTrue();
  });

  it('ignores past exams and handles languages without levels', () => {
    const summary = summarize(FRENCH, NOW);
    expect(summary).toEqual(
      jasmine.objectContaining({ levelsCount: 0, examsCount: 0, nextExam: null, active: false }),
    );
  });
});

describe('row builders', () => {
  it('orders levels by CEFR within a language and keeps the owner', () => {
    const rows = toLevelRows([ENGLISH, FRENCH]);
    expect(rows.map((r) => r.cefrLevel)).toEqual(['A1', 'A2']);
    expect(rows[1]).toEqual(
      jasmine.objectContaining({ languageId: 1, languageName: 'English', examsCount: 2, price: '500' }),
    );
  });

  it('flattens exams sorted by date with their level and language', () => {
    const rows = toExamRows([ENGLISH]);
    expect(rows.map((r) => r.id)).toEqual([10, 21, 20]);
    expect(rows[1]).toEqual(
      jasmine.objectContaining({ languageId: 1, levelId: 2, cefrLevel: 'A2', languageName: 'English' }),
    );
  });

  it('describes status and places from the availability fields', () => {
    const language: LanguageItem = {
      id: 1,
      name: 'X',
      levels: [
        {
          id: 1,
          cefrLevel: 'A1',
          examSessions: [
            exam(1, '2026-12-01T09:00:00Z', {
              bookingStatus: 'Open',
              isBookable: true,
              maxParticipants: 20,
              placesLeft: 5,
            }),
          ],
        },
      ],
    };
    expect(toExamRows([language])[0]).toEqual(
      jasmine.objectContaining({ status: 'Open', open: true, places: '5 of 20 left' }),
    );
  });
});

describe('formatting helpers', () => {
  it('labels places', () => {
    expect(placesLabel(null, null)).toBe('Unlimited');
    expect(placesLabel(20, undefined)).toBe('20');
    expect(placesLabel(20, 0)).toBe('0 of 20 left');
  });

  it('formats dates and tolerates missing or invalid input', () => {
    expect(formatDate('2026-10-29T12:00:00Z')).toContain('2026');
    expect(formatDate(undefined)).toBe('');
    expect(formatDate('nope')).toBe('');
  });
});
