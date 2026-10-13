import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailSettings } from '../settings/mail-settings.entity';
import { MailerService } from './mailer.service';

@Module({
  imports: [TypeOrmModule.forFeature([MailSettings])],
  providers: [MailerService],
  exports: [MailerService],
})
export class MailModule {}
