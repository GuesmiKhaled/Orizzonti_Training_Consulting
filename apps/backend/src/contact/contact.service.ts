import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { MailerService } from '../mail/mailer.service';
import { ContactDto } from './dto/contact.dto';

@Injectable()
export class ContactService {
  constructor(private readonly mailerService: MailerService) {}

  async sendContactMessage(dto: ContactDto) {
    try {
      await this.mailerService.sendMail({
        to: process.env.SMTP_FROM ?? 'info@orizzonti.tn',
        subject: dto.subject,
        text: `Name: ${dto.name}\nEmail: ${dto.email}\n\nMessage:\n${dto.message}`,
      });

      return { success: true, message: 'Message sent successfully.' };
    } catch (error) {
      throw new InternalServerErrorException('Unable to send message right now.');
    }
  }
}
