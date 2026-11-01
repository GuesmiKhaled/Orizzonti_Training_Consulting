import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { EmailNotification } from './email-notification.entity';
import { MailerService } from '../mail/mailer.service';

const MAX_RETRIES = 3;
const POLL_INTERVAL_MS = 10_000;

@Injectable()
export class NotificationService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationService.name);
  private interval?: ReturnType<typeof setInterval>;

  constructor(
    @InjectRepository(EmailNotification)
    private readonly notificationRepository: Repository<EmailNotification>,
    private readonly mailer: MailerService,
  ) {}

  onModuleInit() {
    this.interval = setInterval(
      () => this.processPending().catch(() => {}),
      POLL_INTERVAL_MS,
    );
  }

  onModuleDestroy() {
    if (this.interval) clearInterval(this.interval);
  }

  /**
   * Enqueue a notification inside an existing transaction (outbox pattern).
   * Idempotency: unique index on (notificationType, relatedEntityId) prevents duplicates.
   */
  async enqueue(
    manager: EntityManager,
    params: {
      recipient: string;
      notificationType: string;
      relatedEntityId?: number | null;
      subject: string;
      htmlBody?: string | null;
      textBody?: string | null;
      userId?: number | null;
    },
  ): Promise<void> {
    try {
      await manager.save(
        manager.create(EmailNotification, {
          recipient: params.recipient,
          notificationType: params.notificationType,
          relatedEntityId: params.relatedEntityId ?? null,
          subject: params.subject,
          htmlBody: params.htmlBody ?? null,
          textBody: params.textBody ?? null,
          userId: params.userId ?? null,
          status: 'pending',
        }),
      );
    } catch (err) {
      // Unique constraint violation = already enqueued (idempotency). Silently skip.
      if (String(err).includes('UX_email_notifications_type_entity')) return;
      throw err;
    }
  }

  /** Process pending notifications. Called by the interval timer. */
  private async processPending(): Promise<void> {
    const pending = await this.notificationRepository.find({
      where: { status: 'pending' },
      order: { createdAt: 'ASC' },
      take: 20,
    });
    for (const notification of pending) {
      await this.sendOne(notification);
    }
  }

  private async sendOne(notification: EmailNotification): Promise<void> {
    try {
      await this.mailer.sendMail({
        to: notification.recipient,
        subject: notification.subject,
        text: notification.textBody ?? notification.subject,
        html: notification.htmlBody ?? undefined,
      });
      await this.notificationRepository.update(notification.id, {
        status: 'sent',
        sentAt: new Date(),
      });
    } catch (err) {
      const retryCount = notification.retryCount + 1;
      if (retryCount >= MAX_RETRIES) {
        await this.notificationRepository.update(notification.id, {
          status: 'failed',
          retryCount,
          lastError: String(err).slice(0, 2000),
        });
        this.logger.error(
          `Email ${notification.id} permanently failed: ${String(err).slice(0, 200)}`,
        );
      } else {
        await this.notificationRepository.update(notification.id, {
          retryCount,
          lastError: String(err).slice(0, 2000),
        });
        this.logger.warn(
          `Email ${notification.id} attempt ${retryCount} failed, will retry`,
        );
      }
    }
  }
}
