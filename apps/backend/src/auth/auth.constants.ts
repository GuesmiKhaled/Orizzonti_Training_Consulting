export const PUBLIC_ROUTE_KEY = 'isPublic';
export const REQUIRED_PERMISSION_KEY = 'requiredPermission';
export const ALLOW_PENDING_PASSWORD_CHANGE_KEY = 'allowPendingPasswordChange';

export const MIN_JWT_SECRET_LENGTH = 32;
export const MIN_PASSWORD_LENGTH = 12;

/** Placeholder values that must never be accepted as a signing secret. */
const REJECTED_SECRETS: ReadonlySet<string> = new Set([
  'local-development-only-change-me',
  'change-me',
  'changeme',
  'secret',
]);

/**
 * The signing secret comes from the environment only. There is deliberately
 * no fallback: a missing or weak secret makes every token forgeable.
 */
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret) {
    throw new Error(
      'JWT_SECRET is not set. Define a long random value in the environment (apps/backend/.env).',
    );
  }
  if (secret.length < MIN_JWT_SECRET_LENGTH || REJECTED_SECRETS.has(secret)) {
    throw new Error(
      `JWT_SECRET is too weak. Use a random value of at least ${MIN_JWT_SECRET_LENGTH} characters.`,
    );
  }
  return secret;
}

/** Called at startup so a misconfigured server never begins serving requests. */
export function assertJwtSecretConfigured(): void {
  getJwtSecret();
}
