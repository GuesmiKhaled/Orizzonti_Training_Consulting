export const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;

/** Plain form values; every field is a string/boolean so diffing stays trivial. */
export interface LanguageValues {
  name: string;
  code: string;
  nativeName: string;
  /** Site-relative path from the image library, or '' for none. */
  imageUrl: string;
  isActive: boolean;
}

export interface LevelValues {
  cefrLevel: string;
  courseHours: string;
  price: string;
  isActive: boolean;
}

/** Dates are `datetime-local` strings (YYYY-MM-DDTHH:mm, local time). */
export interface ExamValues {
  examDate: string;
  registrationStartDate: string;
  registrationDeadline: string;
  location: string;
  price: string;
  courseHours: string;
  subscriptionUrl: string;
  maxParticipants: string;
  isActive: boolean;
}

export type EntityState = 'new' | 'modified' | 'unchanged';

export interface FieldChange {
  readonly field: string;
  readonly label: string;
  readonly from: string;
  readonly to: string;
}

export interface EntityChange {
  readonly state: EntityState;
  readonly fields: readonly FieldChange[];
}

export type WizardMode = 'create' | 'edit';
