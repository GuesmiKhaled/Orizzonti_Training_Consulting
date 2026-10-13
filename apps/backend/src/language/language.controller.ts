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
import { LanguageService } from './language.service';
import { LanguageLevelService } from './language-level.service';
import { ExamSessionService } from './exam-session.service';
import { CreateLanguageDto } from './dto/create-language.dto';
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
  ) {}

  @Get()
  @Public()
  findAll() {
    return this.languageService.findAll();
  }

  @Get(':id')
  @Public()
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.languageService.findOne(id);
  }

  @Post()
  @RequirePermission('manage_languages')
  create(@Body() dto: CreateLanguageDto) {
    return this.languageService.create(dto);
  }

  @Patch(':id')
  @RequirePermission('manage_languages')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateLanguageDto>,
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
  getLevels(@Param('id', ParseIntPipe) id: number) {
    return this.languageLevelService.findByLanguageId(id);
  }

  @Get(':id/levels/:levelId')
  @Public()
  getLevel(
    @Param('id', ParseIntPipe) id: number,
    @Param('levelId', ParseIntPipe) levelId: number,
  ) {
    return this.languageLevelService.findOne(id, levelId);
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
  getExamSessions(
    @Param('id', ParseIntPipe) id: number,
    @Param('levelId', ParseIntPipe) levelId: number,
  ) {
    return this.examSessionService.findByLevelId(id, levelId);
  }

  @Get(':id/levels/:levelId/exams/:sessionId')
  @Public()
  getExamSession(
    @Param('id', ParseIntPipe) id: number,
    @Param('levelId', ParseIntPipe) levelId: number,
    @Param('sessionId', ParseIntPipe) sessionId: number,
  ) {
    return this.examSessionService.findOne(id, levelId, sessionId);
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

  @Post(':id/levels/:levelId/exams/:sessionId/subscribe')
  @Public()
  checkBookingEligibility(
    @Param('sessionId', ParseIntPipe) sessionId: number,
  ) {
    return this.examSessionService.checkBookingEligibility(sessionId);
  }
}
