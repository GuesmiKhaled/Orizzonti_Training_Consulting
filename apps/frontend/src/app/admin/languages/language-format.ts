import { LanguageItem } from '../../services/orizzonti-api.service';

const DATE = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

export function formatDate(iso: string | undefined | null): string {
  const date = iso ? new Date(iso) : null;
  return date && !Number.isNaN(date.getTime()) ? DATE.format(date) : '';
}

export interface LanguageSummary {
  readonly id: number;
  readonly name: string;
  readonly code: string;
  readonly nativeName: string;
  readonly imageUrl: string | null;
  readonly active: boolean;
  readonly levelsCount: number;
  readonly examsCount: number;
  /** Earliest upcoming exam, or null. */
  readonly nextExam: string | null;
}

export function summarize(
  language: LanguageItem,
  now: Date = new Date(),
): LanguageSummary {
  const levels = language.levels ?? [];
  const exams = levels.flatMap((level) => level.examSessions ?? []);
  const upcoming = exams
    .map((exam) => exam.examDate)
    .filter((iso) => Date.parse(iso) >= now.getTime())
    .sort((a, b) => Date.parse(a) - Date.parse(b));
  return {
    id: language.id ?? 0,
    name: language.name,
    code: language.code ?? '',
    nativeName: language.nativeName ?? '',
    imageUrl: language.imageUrl ?? null,
    active: language.isActive !== false,
    levelsCount: levels.length,
    examsCount: exams.length,
    nextExam: upcoming[0] ?? null,
  };
}

export interface LevelRow {
  readonly id: number;
  readonly languageId: number;
  readonly languageName: string;
  readonly cefrLevel: string;
  readonly courseHours: string;
  readonly price: string;
  readonly examsCount: number;
  readonly active: boolean;
}

export interface ExamRow {
  readonly id: number;
  readonly languageId: number;
  readonly languageName: string;
  readonly levelId: number;
  readonly cefrLevel: string;
  readonly examDate: string;
  readonly registrationStart: string;
  readonly registrationDeadline: string;
  readonly places: string;
  readonly status: string;
  readonly open: boolean;
}

const CEFR_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export function toLevelRows(languages: readonly LanguageItem[]): LevelRow[] {
  return languages.flatMap((language) =>
    (language.levels ?? [])
      .map((level) => ({
        id: level.id ?? 0,
        languageId: language.id ?? 0,
        languageName: language.name,
        cefrLevel: level.cefrLevel,
        courseHours: level.courseHours ?? '',
        price: level.price ?? '',
        examsCount: level.examSessions?.length ?? 0,
        active: level.isActive !== false,
      }))
      .sort((a, b) => CEFR_ORDER.indexOf(a.cefrLevel) - CEFR_ORDER.indexOf(b.cefrLevel)),
  );
}

export function toExamRows(languages: readonly LanguageItem[]): ExamRow[] {
  return languages
    .flatMap((language) =>
      (language.levels ?? []).flatMap((level) =>
        (level.examSessions ?? []).map((exam) => ({
          id: exam.id ?? 0,
          languageId: language.id ?? 0,
          languageName: language.name,
          levelId: level.id ?? 0,
          cefrLevel: level.cefrLevel,
          examDate: exam.examDate,
          registrationStart: exam.registrationStartDate,
          registrationDeadline: exam.registrationDeadline,
          places: placesLabel(exam.maxParticipants, exam.placesLeft),
          status: exam.bookingStatus ?? (exam.isActive === false ? 'Not available' : ''),
          open: exam.isBookable === true,
        })),
      ),
    )
    .sort((a, b) => Date.parse(a.examDate) - Date.parse(b.examDate));
}

export function placesLabel(
  max: number | null | undefined,
  left: number | null | undefined,
): string {
  if (max == null) {
    return 'Unlimited';
  }
  return left == null ? String(max) : `${left} of ${max} left`;
}
