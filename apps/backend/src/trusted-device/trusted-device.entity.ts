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

@Entity('trusted_devices')
@Index('IX_trusted_devices_userId', ['userId'])
export class TrustedDevice {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  userId: number;

  @Column({ type: 'nvarchar', length: 255 })
  deviceTokenHash: string;

  @Column({ type: 'nvarchar', length: 200, nullable: true })
  deviceName: string | null;

  @Column({ type: 'nvarchar', length: 100, nullable: true })
  browser: string | null;

  @Column({ type: 'nvarchar', length: 100, nullable: true })
  operatingSystem: string | null;

  @Column({ type: 'datetime' })
  firstAuthenticatedAt: Date;

  @Column({ type: 'datetime' })
  lastUsedAt: Date;

  @Column({ type: 'datetime' })
  expiresAt: Date;

  @Column({ type: 'datetime', nullable: true })
  revokedAt: Date | null;

  @Column({ type: 'nvarchar', length: 45, nullable: true })
  lastKnownIp: string | null;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @ManyToOne(() => AdminUser, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: AdminUser;
}
