import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CreateLanguageWizardDto } from './dto/create-language-wizard.dto';
import { assertExamDates, buildExamFields } from './exam-dates';
import { ExamSession } from './exam-session.entity';
import { LanguageLevel } from './language-level.entity';
import { Language } from './language.entity';

@Injectable()
export class LanguageWizardService {
  constructor(private readonly dataSource: DataSource) {}

  /** Creates a language with its levels and exam sessions atomically. */
  async create(dto: CreateLanguageWizardDto) {
    const levels = dto.levels ?? [];
    const cefrLevels = levels.map((level) => level.cefrLevel);
    if (new Set(cefrLevels).size !== cefrLevels.length) {
      throw new BadRequestException('Each CEFR level can only be added once');
    }
    for (const exam of levels.flatMap((level) => level.exams ?? [])) {
      const fields = buildExamFields(exam);
      assertExamDates(
        fields.examDate,
        fields.registrationStartDate,
        fields.registrationDeadline,
      );
    }

    return this.dataSource.transaction(async (manager) => {
      const language = await manager.save(
        manager.create(Language, {
          ...dto.language,
          isActive: dto.language.isActive ?? true,
        }),
      );
      for (const { exams, ...levelFields } of levels) {
        const level = await manager.save(
          manager.create(LanguageLevel, {
            ...levelFields,
            languageId: language.id,
            isActive: levelFields.isActive ?? true,
          }),
        );
        for (const exam of exams ?? []) {
          await manager.save(
            manager.create(ExamSession, {
              ...buildExamFields(exam),
              languageLevelId: level.id,
            }),
          );
        }
      }
      return manager.findOneOrFail(Language, { where: { id: language.id } });
    });
  }
}
