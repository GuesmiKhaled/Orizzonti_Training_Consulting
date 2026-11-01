import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailNotification } from './email-notification.entity';
import { NotificationService } from './notification.service';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [TypeOrmModule.forFeature([EmailNotification]), MailModule],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
