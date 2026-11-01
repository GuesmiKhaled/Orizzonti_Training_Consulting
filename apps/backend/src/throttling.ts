/**
 * Rate limits. The global default is generous so the admin UI is unaffected;
 * the tight ones protect login (brute force) and the public forms (spam, since
 * each submission can also send an email).
 *
 * Values are env-overridable so production can tune without a code change.
 */
const envInt = (key: string, fallback: number): number => {
  const raw = process.env[key];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const GLOBAL_THROTTLE = {
  ttl: envInt('GLOBAL_THROTTLE_TTL_MS', 60_000),
  limit: envInt('GLOBAL_THROTTLE_LIMIT', 600),
} as const;

/** Login brute-force protection: 3 attempts per 10 minutes (env-configurable). */
export const LOGIN_THROTTLE = {
  default: {
    ttl: envInt('LOGIN_THROTTLE_TTL_MS', 600_000),
    limit: envInt('LOGIN_THROTTLE_LIMIT', 3),
  },
} as const;

export const PASSWORD_CHANGE_THROTTLE = {
  default: { ttl: 60_000, limit: 5 },
} as const;

export const PUBLIC_FORM_THROTTLE = {
  default: { ttl: 600_000, limit: 5 },
} as const;
