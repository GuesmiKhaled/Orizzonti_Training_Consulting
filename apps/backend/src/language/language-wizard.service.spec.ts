/// <reference types="jest" />
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { CreateLanguageWizardDto } from './dto/create-language-wizard.dto';
import { UpdateExamSessionDto } from './dto/update-exam-session.dto';
import { UpdateLanguageLevelDto } from './dto/update-language-level.dto';
import { UpdateLanguageDto } from './dto/update-language.dto';
import { LanguageWizardService } from './language-wizard.service';

const exam = (day: number) => ({
  examDate: `2026-12-${String(day).padStart(2, '0')}T09:00:00Z`,
  registrationStartDate: '2026-11-01T00:00:00Z',
  registrationDeadline: `2026-11-${String(day).padStart(2, '0')}T00:00:00Z`,
  maxParticipants: 10,
});

function setup(failOnSave?: number) {
  let saves = 0;
  let nextId = 1;
  const saved: { type: string; value: Record<string, unknown> }[] = [];
  const manager = {
    create: jest.fn((type: { name: string }, value: Record<string, unknown>) => ({
      __type: type.name,
      ...value,
    })),
    save: jest.fn((entity: { __type: string } & Record<string, unknown>) => {
      saves++;
      if (failOnSave === saves) {
        return Promise.reject(new Error('db down'));
      }
      saved.push({ type: entity.__type, value: entity });
      return Promise.resolve({ ...entity, id: nextId++ });
    }),
    findOneOrFail: jest.fn().mockResolvedValue({ id: 1, name: 'English' }),
  };
  const dataSource = {
    transaction: jest.fn((cb: (m: unknown) => unknown) => cb(manager)),
  };
  const service = new LanguageWizardService(dataSource as never);
  return { service, manager, dataSource, saved };
}

describe('LanguageWizardService', () => {
  const dto = {
    language: { name: 'English', code: 'ENG' },
    levels: [
      { cefrLevel: 'A1', price: '500', exams: [exam(10), exam(20)] },
      { cefrLevel: 'A2', exams: [exam(15)] },
    ],
  } as unknown as CreateLanguageWizardDto;

  it('saves language, levels and exams in one transaction, parents first', async () => {
    const { service, saved, dataSource } = setup();
    await service.create(dto);

    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
    expect(saved.map((s) => s.type)).toEqual([
      'Language',
      'LanguageLevel',
      'ExamSession',
      'ExamSession',
      'LanguageLevel',
      'ExamSession',
    ]);
    expect(saved[1].value['languageId']).toBe(1);
    expect(saved[2].value['languageLevelId']).toBe(2);
    expect(saved[0].value['isActive']).toBe(true);
  });

  it('rejects duplicate CEFR levels before touching the database', async () => {
    const { service, dataSource } = setup();
    const duplicate = {
      language: { name: 'x' },
      levels: [{ cefrLevel: 'B1' }, { cefrLevel: 'B1' }],
    } as unknown as CreateLanguageWizardDto;
    await expect(service.create(duplicate)).rejects.toThrow(BadRequestException);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('rejects invalid exam dates before touching the database', async () => {
    const { service, dataSource } = setup();
    const bad = {
      language: { name: 'x' },
      levels: [
        {
          cefrLevel: 'B1',
          exams: [
            {
              examDate: '2026-12-01T00:00:00Z',
              registrationStartDate: '2026-11-01T00:00:00Z',
              registrationDeadline: '2026-12-05T00:00:00Z',
            },
          ],
        },
      ],
    } as unknown as CreateLanguageWizardDto;
    await expect(service.create(bad)).rejects.toThrow(
      'Registration deadline must be before exam date',
    );
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('propagates a failure inside the transaction so it rolls back', async () => {
    const { service } = setup(3);
    await expect(service.create(dto)).rejects.toThrow('db down');
  });
});

describe('language DTO validation', () => {
  const pipe = new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  });
  const run = (value: unknown, metatype: new () => object) =>
    pipe.transform(value, { type: 'body', metatype });

  it('UpdateLanguageDto accepts partial bodies', async () => {
    await expect(run({ name: 'French' }, UpdateLanguageDto)).resolves.toEqual({
      name: 'French',
    });
  });

  it('UpdateLanguageDto rejects unknown fields such as id', async () => {
    await expect(run({ id: 9, name: 'x' }, UpdateLanguageDto)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('UpdateLanguageDto still validates field rules', async () => {
    await expect(
      run({ name: 'x'.repeat(101) }, UpdateLanguageDto),
    ).rejects.toThrow(BadRequestException);
  });

  it('UpdateLanguageLevelDto and UpdateExamSessionDto stay partial but validated', async () => {
    await expect(run({ price: '600' }, UpdateLanguageLevelDto)).resolves.toBeDefined();
    await expect(run({ cefrLevel: 'Z9' }, UpdateLanguageLevelDto)).rejects.toThrow();
    await expect(run({ maxParticipants: 5 }, UpdateExamSessionDto)).resolves.toBeDefined();
    await expect(run({ maxParticipants: 0 }, UpdateExamSessionDto)).rejects.toThrow();
  });

  it('wizard DTO validates nested levels and exams', async () => {
    const ok = {
      language: { name: 'English' },
      levels: [{ cefrLevel: 'A1', exams: [exam(10)] }],
    };
    await expect(run(ok, CreateLanguageWizardDto)).resolves.toBeDefined();

    const badLevel = { language: { name: 'English' }, levels: [{ cefrLevel: 'Q1' }] };
    await expect(run(badLevel, CreateLanguageWizardDto)).rejects.toThrow();

    const badExam = {
      language: { name: 'English' },
      levels: [{ cefrLevel: 'A1', exams: [{ examDate: 'nope' }] }],
    };
    await expect(run(badExam, CreateLanguageWizardDto)).rejects.toThrow();
  });
});
