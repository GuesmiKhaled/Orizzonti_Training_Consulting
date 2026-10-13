import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Language } from './language.entity';
import { LanguageLevel } from './language-level.entity';
import { ExamSession } from './exam-session.entity';
import { LanguageController } from './language.controller';
import { LanguageService } from './language.service';
import { LanguageLevelService } from './language-level.service';
import { ExamSessionService } from './exam-session.service';
import { ExamRegistration } from './exam-registration.entity';
import { ExamRegistrationService } from './exam-registration.service';
import { ExamRegistrationController } from './exam-registration.controller';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Language,
      LanguageLevel,
      ExamSession,
      ExamRegistration,
    ]),
    MailModule,
  ],
  controllers: [LanguageController, ExamRegistrationController],
  providers: [
    LanguageService,
    LanguageLevelService,
    ExamSessionService,
    ExamRegistrationService,
  ],
  exports: [LanguageService, LanguageLevelService, ExamSessionService],
})
export class LanguageModule {}
