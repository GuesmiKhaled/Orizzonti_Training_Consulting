import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AdminUser } from '../auth/admin-user.entity';

export type OtpChallengeStatus = 'pending' | 'consumed' | 'expired' | 'superseded';

@Entity('otp_challenges')
@Index('IX_otp_challenges_userId_status', ['userId', 'status'])
export class OtpChallenge {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  userId: number;

  @Column({ type: 'char', length: 64 })
  challengeHash: string;

  @Column({ type: 'nvarchar', length: 255 })
  otpHash: string;

  @Column({ type: 'datetime' })
  expiresAt: Date;

  @Column({ type: 'int', default: 0 })
  attempts: number;

  @Column({ type: 'int', default: 5 })
  maxAttempts: number;

  @Column({ type: 'nvarchar', length: 20, default: 'pending' })
  status: OtpChallengeStatus;

  @Column({ type: 'datetime', nullable: true })
  lastResentAt: Date | null;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @Column({ type: 'datetime', nullable: true })
  consumedAt: Date | null;

  @ManyToOne(() => AdminUser, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: AdminUser;
}
