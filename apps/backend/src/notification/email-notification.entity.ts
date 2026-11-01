import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type EmailNotificationStatus = 'pending' | 'sent' | 'failed';
export type EmailNotificationType =
  | 'otp'
  | 'course_reservation'
  | 'exam_booking'
  | 'exam_accepted'
  | 'exam_rejected';

@Entity('email_notifications')
@Index('IX_email_notifications_status_createdAt', ['status', 'createdAt'])
export class EmailNotification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: true })
  userId: number | null;

  @Column({ type: 'nvarchar', length: 200 })
  recipient: string;

  @Column({ type: 'nvarchar', length: 50 })
  notificationType: string;

  @Column({ type: 'int', nullable: true })
  relatedEntityId: number | null;

  @Column({ type: 'nvarchar', length: 300 })
  subject: string;

  @Column({ type: 'nvarchar', length: 'MAX', nullable: true })
  htmlBody: string | null;

  @Column({ type: 'nvarchar', length: 'MAX', nullable: true })
  textBody: string | null;

  @Column({ type: 'nvarchar', length: 20, default: 'pending' })
  status: EmailNotificationStatus;

  @Column({ type: 'int', default: 0 })
  retryCount: number;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @Column({ type: 'datetime', nullable: true })
  sentAt: Date | null;

  @Column({ type: 'nvarchar', length: 'MAX', nullable: true })
  lastError: string | null;
}
