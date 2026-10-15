import {
  ExamSession,
  LanguageItem,
  LanguageLevel,
} from '../../../services/orizzonti-api.service';
import { EntityChange, ExamValues, LanguageValues, LevelValues } from './language-wizard.types';

const pad = (n: number): string => String(n).padStart(2, '0');

/** ISO string -> `datetime-local` value in the browser's time zone. */
export function toLocalInput(iso: string | undefined | null): string {
  if (!iso) {
    return '';
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** `datetime-local` value (local time) -> ISO string the API expects. */
export function fromLocalInput(local: string): string {
  return new Date(local).toISOString();
}

export function languageToValues(language: LanguageItem): LanguageValues {
  return {
    name: language.name,
    code: language.code ?? '',
    nativeName: language.nativeName ?? '',
    isActive: language.isActive !== false,
  };
}

export function levelToValues(level: LanguageLevel): LevelValues {
  return {
    cefrLevel: level.cefrLevel,
    courseHours: level.courseHours ?? '',
    price: level.price ?? '',
    isActive: level.isActive !== false,
  };
}

export function examToValues(exam: ExamSession): ExamValues {
  return {
    examDate: toLocalInput(exam.examDate),
    registrationStartDate: toLocalInput(exam.registrationStartDate),
    registrationDeadline: toLocalInput(exam.registrationDeadline),
    location: exam.location ?? '',
    price: exam.price ?? '',
    courseHours: exam.courseHours ?? '',
    subscriptionUrl: exam.subscriptionUrl ?? '',
    maxParticipants: exam.maxParticipants == null ? '' : String(exam.maxParticipants),
    isActive: exam.isActive !== false,
  };
}

const orUndefined = (value: string): string | undefined => value.trim() || undefined;
const orNull = (value: string): string | null => value.trim() || null;

/* ---- create payloads: empty optional fields are simply omitted ---- */

export interface LevelPayload {
  cefrLevel: string;
  courseHours?: string;
  price?: string;
  isActive: boolean;
}

export interface ExamPayload {
  examDate: string;
  registrationStartDate: string;
  registrationDeadline: string;
  location?: string;
  price?: string;
  courseHours?: string;
  subscriptionUrl?: string;
  maxParticipants?: number;
  isActive: boolean;
}

export function levelCreatePayload(values: LevelValues): LevelPayload {
  return {
    cefrLevel: values.cefrLevel,
    courseHours: orUndefined(values.courseHours),
    price: orUndefined(values.price),
    isActive: values.isActive,
  };
}

export function examCreatePayload(values: ExamValues): ExamPayload {
  return {
    examDate: fromLocalInput(values.examDate),
    registrationStartDate: fromLocalInput(values.registrationStartDate),
    registrationDeadline: fromLocalInput(values.registrationDeadline),
    location: orUndefined(values.location),
    price: orUndefined(values.price),
    courseHours: orUndefined(values.courseHours),
    subscriptionUrl: orUndefined(values.subscriptionUrl),
    maxParticipants: values.maxParticipants ? Number(values.maxParticipants) : undefined,
    isActive: values.isActive,
  };
}

export function languageCreatePayload(values: LanguageValues): {
  name: string;
  code?: string;
  nativeName?: string;
  isActive: boolean;
} {
  return {
    name: values.name.trim(),
    code: orUndefined(values.code),
    nativeName: orUndefined(values.nativeName),
    isActive: values.isActive,
  };
}

/* ---- patch payloads: only changed fields; cleared optional fields become null ---- */

type Patch = Record<string, string | number | boolean | null>;

function patchFrom<T extends object>(
  change: EntityChange,
  values: T,
  convert: (field: string, raw: string | boolean) => string | number | boolean | null,
): Patch | null {
  if (change.state !== 'modified') {
    return null;
  }
  const source = values as Record<string, string | boolean>;
  const patch: Patch = {};
  for (const { field } of change.fields) {
    patch[field] = convert(field, source[field]);
  }
  return patch;
}

const NULLABLE_TEXT = new Set([
  'code',
  'nativeName',
  'courseHours',
  'price',
  'location',
  'subscriptionUrl',
]);

const DATE_FIELDS = new Set([
  'examDate',
  'registrationStartDate',
  'registrationDeadline',
]);

const convertField = (field: string, raw: string | boolean): string | number | boolean | null => {
  if (typeof raw === 'boolean') {
    return raw;
  }
  if (DATE_FIELDS.has(field)) {
    return fromLocalInput(raw);
  }
  if (field === 'maxParticipants') {
    return raw ? Number(raw) : null;
  }
  return NULLABLE_TEXT.has(field) ? orNull(raw) : raw.trim();
};

export const languagePatch = (change: EntityChange, values: LanguageValues): Patch | null =>
  patchFrom(change, values, convertField);

export const levelPatch = (change: EntityChange, values: LevelValues): Patch | null =>
  patchFrom(change, values, convertField);

export const examPatch = (change: EntityChange, values: ExamValues): Patch | null =>
  patchFrom(change, values, convertField);
