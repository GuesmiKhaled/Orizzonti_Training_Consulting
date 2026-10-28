export const PUBLIC_ROUTE_KEY = 'isPublic';
export const REQUIRED_PERMISSION_KEY = 'requiredPermission';
export const ALLOW_PENDING_PASSWORD_CHANGE_KEY = 'allowPendingPasswordChange';

export const MIN_JWT_SECRET_LENGTH = 32;
export const MIN_PASSWORD_LENGTH = 12;

/** Cookie names for the cookie-based auth flow (audit finding #4). */
export const ACCESS_TOKEN_COOKIE = 'orizzonti_access';
export const REFRESH_TOKEN_COOKIE = 'orizzonti_refresh';
export const CSRF_COOKIE = 'orizzonti_csrf';
export const CSRF_HEADER = 'x-csrf-token';

/** Lifetimes. Access token is short-lived; refresh token is longer. */
export const ACCESS_TOKEN_TTL = '15m';
export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
export const REFRESH_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

/**
 * Placeholder values that must never be accepted as a signing secret.
 */
const REJECTED_SECRETS: ReadonlySet<string> = new Set([
  'local-development-only-change-me',
  'change-me',
  'changeme',
  'secret',
]);

function resolveSecret(envVar: string, label: string): string {
  const secret = process.env[envVar]?.trim();
  if (!secret) {
    throw new Error(
      `${label} is not set. Define a long random value in the environment (apps/backend/.env).`,
    );
  }
  if (secret.length < MIN_JWT_SECRET_LENGTH || REJECTED_SECRETS.has(secret)) {
    throw new Error(
      `${label} is too weak. Use a random value of at least ${MIN_JWT_SECRET_LENGTH} characters.`,
    );
  }
  return secret;
}

/**
 * The signing secret comes from the environment only. There is deliberately
 * no fallback: a missing or weak secret makes every token forgeable.
 */
export function getJwtSecret(): string {
  return resolveSecret('JWT_SECRET', 'JWT_SECRET');
}

/**
 * Separate secret for refresh tokens so a leaked access-token secret cannot
 * forge refresh tokens. Falls back to JWT_SECRET for backward compatibility
 * but emits no warning (a single secret is acceptable; two is better).
 */
export function getRefreshTokenSecret(): string {
  return process.env.REFRESH_TOKEN_SECRET?.trim()
    ? resolveSecret('REFRESH_TOKEN_SECRET', 'REFRESH_TOKEN_SECRET')
    : getJwtSecret();
}

/** Called at startup so a misconfigured server never begins serving requests. */
export function assertJwtSecretConfigured(): void {
  getJwtSecret();
  getRefreshTokenSecret();
}

/**
 * Cookie options. SameSite=None requires Secure, so the deployment must
 * terminate HTTPS in front of the API (or use a local dev cert). The
 * `COOKIE_SECURE` env var lets local HTTP dev disable Secure if needed.
 */
export function cookieOptions(maxAgeSeconds: number) {
  const secure = process.env.COOKIE_SECURE !== 'false';
  return {
    httpOnly: true,
    secure,
    sameSite: 'none' as const,
    maxAge: maxAgeSeconds * 1000,
    path: '/',
  };
}

/** Non-HttpOnly so the Angular client can read it for the double-submit header. */
export function csrfCookieOptions() {
  const secure = process.env.COOKIE_SECURE !== 'false';
  return {
    httpOnly: false,
    secure,
    sameSite: 'none' as const,
    maxAge: REFRESH_TOKEN_TTL_SECONDS * 1000,
    path: '/',
  };
}
