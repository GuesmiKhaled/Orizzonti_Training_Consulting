import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Language } from './language.entity';
import { LanguageLevel } from './language-level.entity';
import { ExamSession } from './exam-session.entity';
import { LanguageController } from './language.controller';
import { LanguageService } from './language.service';
import { LanguageLevelService } from './language-level.service';
import { ExamSessionService } from './exam-session.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Language, LanguageLevel, ExamSession]),
  ],
  controllers: [LanguageController],
  providers: [LanguageService, LanguageLevelService, ExamSessionService],
  exports: [LanguageService, LanguageLevelService, ExamSessionService],
})
export class LanguageModule {}
