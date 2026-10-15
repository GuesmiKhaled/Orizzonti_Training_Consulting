import { EntityChange, FieldChange } from './language-wizard.types';

const LABELS: Readonly<Record<string, string>> = {
  name: 'name',
  code: 'code',
  nativeName: 'native name',
  isActive: 'status',
  cefrLevel: 'level',
  courseHours: 'hours',
  price: 'price',
  examDate: 'exam date',
  registrationStartDate: 'registration start',
  registrationDeadline: 'registration deadline',
  location: 'location',
  subscriptionUrl: 'subscription URL',
  maxParticipants: 'places',
};

/** Compares current values with the last saved baseline (null = never saved). */
export function diffValues<T extends object>(
  baseline: T | null,
  current: T,
): EntityChange {
  if (!baseline) {
    return { state: 'new', fields: [] };
  }
  const before = baseline as Record<string, unknown>;
  const after = current as Record<string, unknown>;
  const fields: FieldChange[] = Object.keys(after)
    .filter((field) => String(before[field]) !== String(after[field]))
    .map((field) => ({
      field,
      label: LABELS[field] ?? field,
      from: String(before[field]),
      to: String(after[field]),
    }));
  return { state: fields.length ? 'modified' : 'unchanged', fields };
}

/** A new entity counts as one change, a modified one as one per changed field. */
export function changeCount(change: EntityChange): number {
  if (change.state === 'new') {
    return 1;
  }
  return change.fields.length;
}

export function changedFieldNames(change: EntityChange): ReadonlySet<string> {
  return new Set(change.fields.map((f) => f.field));
}

/** The value a field had before the user edited it, or null when it is unchanged. */
export function previousOf(change: EntityChange | undefined, field: string): string | null {
  return change?.fields.find((f) => f.field === field)?.from ?? null;
}
