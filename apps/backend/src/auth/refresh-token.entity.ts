import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

/**
 * Server-side allowlist of valid refresh tokens (audit finding #4).
 * Each issued refresh token JWT carries a `jti` (UUID); a row is inserted
 * here at issue time and deleted on rotation / logout / revocation. A
 * refresh token whose jti is not present here is rejected, even if its
 * signature and expiry are still valid.
 */
@Entity('refresh_tokens')
@Index('IX_refresh_tokens_userId', ['userId'])
export class RefreshToken {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'char', length: 36, unique: true })
  jti: string;

  @Column({ name: 'userId', type: 'int' })
  userId: number;

  @Column({ type: 'datetime', nullable: false })
  expiresAt: Date;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;
}
