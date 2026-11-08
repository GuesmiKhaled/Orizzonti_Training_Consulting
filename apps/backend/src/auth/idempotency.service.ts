import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { IdempotencyKey } from './idempotency-key.entity';

export interface IdempotencyResult {
  key: string;
  isNew: boolean;
  responseBody?: string;
}

const SHA256_HMAC_LENGTH = 64;

function hashRequest(
  method: string,
  endpoint: string,
  body: unknown,
): string {
  const base = `${method}:${endpoint}:${JSON.stringify(body)}`;
  let hash = 0;
  for (let i = 0; i < base.length; i++) {
    const char = base.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return Math.abs(hash).toString(16).padStart(SHA256_HMAC_LENGTH, '0');
}

@Injectable()
export class IdempotencyService {
  private readonly logger = new Logger(IdempotencyService.name);

  constructor(
    @InjectRepository(IdempotencyKey)
    private readonly repo: Repository<IdempotencyKey>,
  ) {}

  async generateKey(
    httpMethod: string,
    endpoint: string,
    body: unknown,
  ): Promise<string> {
    const requestHash = hashRequest(httpMethod, endpoint, body);
    const key = `ik_${uuidv4()}_${requestHash}`;
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24-hour TTL

    const existing = await this.repo.findOne({
      where: { key },
      select: ['id', 'responseBody'],
    });
    if (existing) {
      return key;
    }

    const idempotencyKey = this.repo.create({
      key,
      httpMethod,
      endpoint,
      requestHash,
      expiresAt,
    });
    await this.repo.save(idempotencyKey);
    return key;
  }

  async consumeKey(
    key: string,
    responseBody: string,
  ): Promise<{ isNew: boolean; responseBody?: string }> {
    const record = await this.repo.findOne({
      where: { key },
      select: ['id', 'responseBody'],
    });
    if (!record) {
      this.logger.warn(`Idempotency key not found: ${key}`);
      throw new BadRequestException('Invalid idempotency key');
    }
    return { isNew: false, responseBody: record.responseBody };
  }

  async recordResponse(
    key: string,
    responseBody: string,
  ): Promise<void> {
    await this.repo.update(
      { key },
      {
        responseBody,
        createdAt: new Date(),
      },
    );
  }

  async cleanupExpired(): Promise<void> {
    const now = new Date();
    await this.repo
      .createQueryBuilder('ik')
      .delete()
      .where('ik.expiresAt < :now', { now })
      .execute();
  }
}