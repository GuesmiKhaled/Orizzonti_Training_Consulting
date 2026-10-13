import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createTransport } from 'nodemailer';
import { Repository } from 'typeorm';
import { MailSettings } from '../settings/mail-settings.entity';

export interface MailPayload {
  to: string;
  subject: string;
  text: string;
  from?: string;
}

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);

  constructor(
    @InjectRepository(MailSettings)
    private readonly mailSettingsRepository: Repository<MailSettings>,
  ) {}

  async sendMail(payload: MailPayload): Promise<void> {
    const [settings] = await this.mailSettingsRepository.find({
      order: { id: 'DESC' },
      take: 1,
    });
    if (!settings?.host || !settings.password) {
      this.logger.warn('Mail settings are not configured; email not sent.');
      return;
    }
    const implicitTls = settings.port === 465;
    const transporter = createTransport({
      host: settings.host,
      port: settings.port,
      secure: implicitTls,
      requireTLS: settings.secure && !implicitTls,
      auth: { user: settings.username, pass: settings.password },
    });
    await transporter.sendMail({
      from: payload.from ?? settings.fromAddress,
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
    });
  }
}
