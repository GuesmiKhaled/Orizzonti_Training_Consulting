import {
  Injectable,
  Logger,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, Not } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { createHash, randomInt, randomBytes } from 'node:crypto';
import { OtpChallenge } from './otp-challenge.entity';

export interface OtpConfig {
  length: number;
  expirationMinutes: number;
  maxAttempts: number;
  resendCooldownSeconds: number;
}

const envInt = (key: string, fallback: number): number => {
  const raw = process.env[key];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const OTP_CONFIG: OtpConfig = {
  length: envInt('OTP_LENGTH', 6),
  expirationMinutes: envInt('OTP_EXPIRATION_MINUTES', 5),
  maxAttempts: envInt('OTP_MAX_ATTEMPTS', 5),
  resendCooldownSeconds: envInt('OTP_RESEND_COOLDOWN_SECONDS', 60),
};

export const LOGIN_INACTIVITY_DAYS = envInt('LOGIN_INACTIVITY_DAYS', 5);

export interface GeneratedChallenge {
  challengeId: string; // opaque token sent to client
  code: string; // plaintext OTP (sent via email, never returned to client API)
  email?: string | null; // recipient email (loaded from the user relation)
}

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(
    @InjectRepository(OtpChallenge)
    private readonly challengeRepository: Repository<OtpChallenge>,
  ) {}

  /** Generate a new OTP challenge for a user. Invalidates previous pending ones. */
  async createChallenge(userId: number): Promise<GeneratedChallenge> {
    // Invalidate previous pending challenges for this user.
    await this.challengeRepository.update(
      { userId, status: 'pending' },
      { status: 'superseded' },
    );

    const challengeId = randomBytes(32).toString('hex');
    const challengeHash = createHash('sha256')
      .update(challengeId)
      .digest('hex');

    // Cryptographically secure 6-digit code.
    const code = randomInt(0, 10 ** OTP_CONFIG.length)
      .toString()
      .padStart(OTP_CONFIG.length, '0');
    const otpHash = await bcrypt.hash(code, 10);

    const expiresAt = new Date(
      Date.now() + OTP_CONFIG.expirationMinutes * 60_000,
    );
    await this.challengeRepository.save(
      this.challengeRepository.create({
        userId,
        challengeHash,
        otpHash,
        expiresAt,
        attempts: 0,
        maxAttempts: OTP_CONFIG.maxAttempts,
        status: 'pending',
      }),
    );

    return { challengeId, code };
  }

  /** Verify and atomically consume an OTP. Returns userId on success. */
  async verifyAndConsume(challengeId: string, code: string): Promise<number> {
    const challengeHash = createHash('sha256')
      .update(challengeId)
      .digest('hex');
    const challenge = await this.challengeRepository.findOne({
      where: { challengeHash },
    });

    if (!challenge || challenge.status !== 'pending') {
      throw new UnauthorizedException('Invalid or expired verification code');
    }

    if (challenge.expiresAt < new Date()) {
      await this.challengeRepository.update(challenge.id, {
        status: 'expired',
      });
      throw new UnauthorizedException('Verification code has expired');
    }

    if (challenge.attempts >= challenge.maxAttempts) {
      await this.challengeRepository.update(challenge.id, {
        status: 'expired',
      });
      throw new UnauthorizedException('Maximum attempts exceeded');
    }

    // Increment attempts first (atomic via UPDATE ... WHERE status='pending').
    const incremented = await this.challengeRepository.increment(
      { id: challenge.id, status: 'pending' },
      'attempts',
      1,
    );
    if (!incremented.affected) {
      throw new UnauthorizedException('Invalid or expired verification code');
    }

    const isValid = await bcrypt.compare(code, challenge.otpHash);
    if (!isValid) {
      const remaining = challenge.maxAttempts - (challenge.attempts + 1);
      throw new UnauthorizedException(
        remaining > 0
          ? `Invalid code. ${remaining} attempt(s) remaining.`
          : 'Maximum attempts exceeded',
      );
    }

    // Atomic consume: only succeeds if still pending (prevents concurrent replay).
    const consumed = await this.challengeRepository.update(
      { id: challenge.id, status: 'pending' },
      { status: 'consumed', consumedAt: new Date() },
    );
    if (!consumed.affected) {
      throw new UnauthorizedException('Verification code already used');
    }

    return challenge.userId;
  }

  /** Resend: generates a new OTP for an existing challenge. Enforces cooldown. */
  async resend(challengeId: string): Promise<GeneratedChallenge> {
    const challengeHash = createHash('sha256')
      .update(challengeId)
      .digest('hex');
    const challenge = await this.challengeRepository.findOne({
      where: { challengeHash },
      relations: ['user'],
    });

    if (!challenge || challenge.status !== 'pending') {
      throw new UnauthorizedException('Invalid or expired challenge');
    }

    if (challenge.expiresAt < new Date()) {
      throw new UnauthorizedException('Verification code has expired');
    }

    const email = challenge.user?.email;

    const cooldownMs = OTP_CONFIG.resendCooldownSeconds * 1000;
    if (challenge.lastResentAt) {
      const elapsed = Date.now() - new Date(challenge.lastResentAt).getTime();
      if (elapsed < cooldownMs) {
        const waitSec = Math.ceil((cooldownMs - elapsed) / 1000);
        throw new BadRequestException(
          `Please wait ${waitSec}s before resending`,
        );
      }
    }

    const code = randomInt(0, 10 ** OTP_CONFIG.length)
      .toString()
      .padStart(OTP_CONFIG.length, '0');
    const otpHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(
      Date.now() + OTP_CONFIG.expirationMinutes * 60_000,
    );

    await this.challengeRepository.update(challenge.id, {
      otpHash,
      expiresAt,
      attempts: 0,
      lastResentAt: new Date(),
    });

    return { challengeId, code, email };
  }

  /** Clean up expired challenges (called periodically). */
  async cleanupExpired(): Promise<void> {
    await this.challengeRepository.update(
      { status: 'pending', expiresAt: LessThan(new Date()) },
      { status: 'expired' },
    );
  }
}
