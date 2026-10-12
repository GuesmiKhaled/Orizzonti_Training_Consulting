import { Injectable } from '@nestjs/common';

export interface MailPayload {
  to: string;
  subject: string;
  text: string;
  from?: string;
}

@Injectable()
export class MailerService {
  async sendMail(payload: MailPayload): Promise<void> {
    // Placeholder implementation for local/test integration.
    // A real SMTP provider or mail transport should be configured here.
    console.log('SMTP mail request queued', payload);
  }
}
