import { PartialType } from '@nestjs/mapped-types';
import { CreateExamSessionDto } from './create-exam-session.dto';

export class UpdateExamSessionDto extends PartialType(CreateExamSessionDto) {}
