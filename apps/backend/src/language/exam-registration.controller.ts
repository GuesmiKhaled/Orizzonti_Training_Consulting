import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
} from '@nestjs/common';
import { UpdateExamRegistrationDto } from './dto/update-exam-registration.dto';
import { ExamRegistrationService } from './exam-registration.service';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';

@Controller('exam-registrations')
export class ExamRegistrationController {
  constructor(private readonly registrationService: ExamRegistrationService) {}

  @Get()
  @RequirePermission('manage_course_requests')
  findAll(
    @Query('status') status?: string,
    @Query('examSessionId') examSessionId?: string,
  ) {
    return this.registrationService.findAll({
      status,
      examSessionId: examSessionId ? Number(examSessionId) : undefined,
    });
  }

  @Patch(':id')
  @RequirePermission('manage_course_requests')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateExamRegistrationDto,
  ) {
    return this.registrationService.updateStatus(id, dto.status);
  }

  @Delete(':id')
  @RequirePermission('manage_course_requests')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.registrationService.remove(id);
  }
}
