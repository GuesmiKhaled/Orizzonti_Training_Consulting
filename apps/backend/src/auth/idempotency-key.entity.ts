import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

/**
 * Stores idempotency keys for state-changing POST endpoints.
 * Enables safe retries without duplicate side effects.
 */
@Entity('idempotency_keys')
@Index('IX_idempotency_keys_key', ['key'], { unique: true })
export class IdempotencyKey {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  @Index()
  key: string;

  @Column({ name: 'http_method', type: 'varchar', length: 10 })
  httpMethod: string;

  @Column({ name: 'endpoint', type: 'varchar', length: 255 })
  endpoint: string;

  @Column({ name: 'request_hash', type: 'varchar', length: 64 })
  requestHash: string;

  @Column({ name: 'response_body', type: 'text', nullable: true })
  responseBody?: string;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @Column({ name: 'expires_at', type: 'datetime' })
  expiresAt: Date;
}