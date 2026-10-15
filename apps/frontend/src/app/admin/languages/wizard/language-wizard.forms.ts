import {
  AbstractControl,
  FormControl,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import {
  CEFR_LEVELS,
  ExamValues,
  LanguageValues,
  LevelValues,
} from './language-wizard.types';

export type LanguageForm = FormGroup<{
  name: FormControl<string>;
  code: FormControl<string>;
  nativeName: FormControl<string>;
  imageUrl: FormControl<string>;
  isActive: FormControl<boolean>;
}>;

export type LevelForm = FormGroup<{
  cefrLevel: FormControl<string>;
  courseHours: FormControl<string>;
  price: FormControl<string>;
  isActive: FormControl<boolean>;
}>;

export type ExamForm = FormGroup<{
  examDate: FormControl<string>;
  registrationStartDate: FormControl<string>;
  registrationDeadline: FormControl<string>;
  location: FormControl<string>;
  price: FormControl<string>;
  courseHours: FormControl<string>;
  subscriptionUrl: FormControl<string>;
  maxParticipants: FormControl<string>;
  isActive: FormControl<boolean>;
}>;

const text = (value: string, validators: ValidatorFn[] = []) =>
  new FormControl(value, { nonNullable: true, validators });

const flag = (value: boolean) => new FormControl(value, { nonNullable: true });

export const EMPTY_LANGUAGE: LanguageValues = {
  name: '',
  code: '',
  nativeName: '',
  imageUrl: '',
  isActive: true,
};

export const EMPTY_LEVEL: LevelValues = {
  cefrLevel: '',
  courseHours: '',
  price: '',
  isActive: true,
};

export const EMPTY_EXAM: ExamValues = {
  examDate: '',
  registrationStartDate: '',
  registrationDeadline: '',
  location: '',
  price: '',
  courseHours: '',
  subscriptionUrl: '',
  maxParticipants: '',
  isActive: true,
};

export function createLanguageForm(values: LanguageValues = EMPTY_LANGUAGE): LanguageForm {
  return new FormGroup({
    name: text(values.name, [Validators.required, Validators.maxLength(100)]),
    code: text(values.code, [Validators.maxLength(20)]),
    nativeName: text(values.nativeName, [Validators.maxLength(100)]),
    imageUrl: text(values.imageUrl, [Validators.maxLength(255)]),
    isActive: flag(values.isActive),
  });
}

export function createLevelForm(values: LevelValues = EMPTY_LEVEL): LevelForm {
  return new FormGroup({
    cefrLevel: text(values.cefrLevel, [
      Validators.required,
      Validators.pattern(new RegExp(`^(${CEFR_LEVELS.join('|')})$`)),
    ]),
    courseHours: text(values.courseHours, [Validators.required]),
    price: text(values.price, [Validators.required]),
    isActive: flag(values.isActive),
  });
}

/** Mirrors the backend rules: start < deadline < exam date. */
export const examDatesValidator: ValidatorFn = (
  group: AbstractControl,
): ValidationErrors | null => {
  const value = group.value as ExamValues;
  const exam = Date.parse(value.examDate);
  const start = Date.parse(value.registrationStartDate);
  const deadline = Date.parse(value.registrationDeadline);
  const errors: ValidationErrors = {};
  if (!Number.isNaN(deadline) && !Number.isNaN(exam) && deadline >= exam) {
    errors['deadlineAfterExam'] = true;
  }
  if (!Number.isNaN(start) && !Number.isNaN(deadline) && start >= deadline) {
    errors['startAfterDeadline'] = true;
  }
  return Object.keys(errors).length ? errors : null;
};

export function createExamForm(values: ExamValues = EMPTY_EXAM): ExamForm {
  return new FormGroup(
    {
      examDate: text(values.examDate, [Validators.required]),
      registrationStartDate: text(values.registrationStartDate, [Validators.required]),
      registrationDeadline: text(values.registrationDeadline, [Validators.required]),
      location: text(values.location),
      price: text(values.price),
      courseHours: text(values.courseHours),
      subscriptionUrl: text(values.subscriptionUrl, [
        Validators.pattern(/^https?:\/\/\S+$/),
      ]),
      maxParticipants: text(values.maxParticipants, [
        Validators.pattern(/^[1-9]\d*$/),
      ]),
      isActive: flag(values.isActive),
    },
    { validators: examDatesValidator },
  );
}

/** Short, user-facing message for the first failing rule, once the field was touched. */
export function errorOf(control: AbstractControl): string {
  if (!control.invalid || !(control.touched || control.dirty)) {
    return '';
  }
  const errors = control.errors ?? {};
  if (errors['required']) {
    return 'Required';
  }
  if (errors['maxlength']) {
    return 'Too long';
  }
  return 'Invalid value';
}

export function groupErrorOf(group: AbstractControl): string {
  if (!group.touched && !group.dirty) {
    return '';
  }
  if (group.errors?.['deadlineAfterExam']) {
    return 'The registration deadline must be before the exam date.';
  }
  if (group.errors?.['startAfterDeadline']) {
    return 'The registration start must be before the deadline.';
  }
  return '';
}
