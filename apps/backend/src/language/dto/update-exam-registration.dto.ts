import { IsIn } from 'class-validator';

export class UpdateExamRegistrationDto {
  @IsIn(['pending', 'accepted', 'rejected'])
  status!: 'pending' | 'accepted' | 'rejected';
}
