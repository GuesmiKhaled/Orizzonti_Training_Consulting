import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OtpChallenge } from './otp-challenge.entity';
import { OtpService } from './otp.service';
import { OtpController } from './otp.controller';
import { AdminUser } from '../auth/admin-user.entity';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [TypeOrmModule.forFeature([OtpChallenge, AdminUser]), MailModule],
  providers: [OtpService],
  controllers: [OtpController],
  exports: [OtpService],
})
export class OtpModule {}
