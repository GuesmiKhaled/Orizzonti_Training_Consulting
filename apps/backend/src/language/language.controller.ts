import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { PUBLIC_FORM_THROTTLE } from '../throttling';
import { LanguageService } from './language.service';
import { LanguageLevelService } from './language-level.service';
import { ExamSessionService } from './exam-session.service';
import { ExamRegistrationService } from './exam-registration.service';
import { CreateExamRegistrationDto } from './dto/create-exam-registration.dto';
import { CreateLanguageDto } from './dto/create-language.dto';
import { UpdateLanguageDto } from './dto/update-language.dto';
import { CreateLanguageWizardDto } from './dto/create-language-wizard.dto';
import { LanguageWizardService } from './language-wizard.service';
import { CreateLanguageLevelDto } from './dto/create-language-level.dto';
import { UpdateLanguageLevelDto } from './dto/update-language-level.dto';
import { CreateExamSessionDto } from './dto/create-exam-session.dto';
import { UpdateExamSessionDto } from './dto/update-exam-session.dto';
import { Public } from '../auth/decorators/public.decorator';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';

@Controller('languages')
export class LanguageController {
  constructor(
    private readonly languageService: LanguageService,
    private readonly languageLevelService: LanguageLevelService,
    private readonly examSessionService: ExamSessionService,
    private readonly examRegistrationService: ExamRegistrationService,
    private readonly languageWizardService: LanguageWizardService,
  ) {}

  @Get()
  @Public()
  async findAll() {
    const languages = await this.languageService.findAll();
    await this.examRegistrationService.decorate(
      languages.flatMap((language) =>
        (language.levels ?? []).flatMap((level) => level.examSessions ?? []),
      ),
    );
    return languages;
  }

  @Get(':id')
  @Public()
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const language = await this.languageService.findOne(id);
    await this.examRegistrationService.decorate(
      (language.levels ?? []).flatMap((level) => level.examSessions ?? []),
    );
    return language;
  }

  @Post()
  @RequirePermission('manage_languages')
  create(@Body() dto: CreateLanguageDto) {
    return this.languageService.create(dto);
  }

  @Post('wizard')
  @RequirePermission('manage_languages')
  createWithStructure(@Body() dto: CreateLanguageWizardDto) {
    return this.languageWizardService.create(dto);
  }

  @Patch(':id')
  @RequirePermission('manage_languages')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateLanguageDto,
  ) {
    return this.languageService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermission('manage_languages')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.languageService.remove(id);
  }

  // Language Levels endpoints
  @Get(':id/levels')
  @Public()
  async getLevels(@Param('id', ParseIntPipe) id: number) {
    const levels = await this.languageLevelService.findByLanguageId(id);
    await this.examRegistrationService.decorate(
      levels.flatMap((level) => level.examSessions ?? []),
    );
    return levels;
  }

  @Get(':id/levels/:levelId')
  @Public()
  async getLevel(
    @Param('id', ParseIntPipe) id: number,
    @Param('levelId', ParseIntPipe) levelId: number,
  ) {
    const level = await this.languageLevelService.findOne(id, levelId);
    await this.examRegistrationService.decorate(level.examSessions ?? []);
    return level;
  }

  @Post(':id/levels')
  @RequirePermission('manage_languages')
  createLevel(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateLanguageLevelDto,
  ) {
    return this.languageLevelService.create(id, dto);
  }

  @Patch(':id/levels/:levelId')
  @RequirePermission('manage_languages')
  updateLevel(
    @Param('id', ParseIntPipe) id: number,
    @Param('levelId', ParseIntPipe) levelId: number,
    @Body() dto: UpdateLanguageLevelDto,
  ) {
    return this.languageLevelService.update(id, levelId, dto);
  }

  @Delete(':id/levels/:levelId')
  @RequirePermission('manage_languages')
  deleteLevel(
    @Param('id', ParseIntPipe) id: number,
    @Param('levelId', ParseIntPipe) levelId: number,
  ) {
    return this.languageLevelService.delete(id, levelId);
  }

  // Exam Sessions endpoints
  @Get(':id/levels/:levelId/exams')
  @Public()
  async getExamSessions(
    @Param('id', ParseIntPipe) id: number,
    @Param('levelId', ParseIntPipe) levelId: number,
  ) {
    const sessions = await this.examSessionService.findByLevelId(id, levelId);
    return this.examRegistrationService.decorate(sessions);
  }

  @Get(':id/levels/:levelId/exams/:sessionId')
  @Public()
  async getExamSession(
    @Param('id', ParseIntPipe) id: number,
    @Param('levelId', ParseIntPipe) levelId: number,
    @Param('sessionId', ParseIntPipe) sessionId: number,
  ) {
    const session = await this.examSessionService.findOne(
      id,
      levelId,
      sessionId,
    );
    const [decorated] = await this.examRegistrationService.decorate([session]);
    return decorated;
  }

  @Post(':id/levels/:levelId/exams')
  @RequirePermission('manage_languages')
  createExamSession(
    @Param('id', ParseIntPipe) id: number,
    @Param('levelId', ParseIntPipe) levelId: number,
    @Body() dto: CreateExamSessionDto,
  ) {
    return this.examSessionService.create(id, levelId, dto);
  }

  @Patch(':id/levels/:levelId/exams/:sessionId')
  @RequirePermission('manage_languages')
  updateExamSession(
    @Param('id', ParseIntPipe) id: number,
    @Param('levelId', ParseIntPipe) levelId: number,
    @Param('sessionId', ParseIntPipe) sessionId: number,
    @Body() dto: UpdateExamSessionDto,
  ) {
    return this.examSessionService.update(id, levelId, sessionId, dto);
  }

  @Delete(':id/levels/:levelId/exams/:sessionId')
  @RequirePermission('manage_languages')
  deleteExamSession(
    @Param('id', ParseIntPipe) id: number,
    @Param('levelId', ParseIntPipe) levelId: number,
    @Param('sessionId', ParseIntPipe) sessionId: number,
  ) {
    return this.examSessionService.delete(id, levelId, sessionId);
  }

  @Post(':id/levels/:levelId/exams/:sessionId/register')
  @Public()
  @Throttle(PUBLIC_FORM_THROTTLE)
  registerForExam(
    @Param('id', ParseIntPipe) id: number,
    @Param('levelId', ParseIntPipe) levelId: number,
    @Param('sessionId', ParseIntPipe) sessionId: number,
    @Body() dto: CreateExamRegistrationDto,
  ) {
    return this.examRegistrationService.register(id, levelId, sessionId, dto);
  }

  @Post(':id/levels/:levelId/exams/:sessionId/subscribe')
  @Public()
  checkBookingEligibility(
    @Param('sessionId', ParseIntPipe) sessionId: number,
  ) {
    return this.examSessionService.checkBookingEligibility(sessionId);
  }
}
