/**
 * Rate limits. The global default is generous so the admin UI is unaffected;
 * the tight ones protect login (brute force) and the public forms (spam, since
 * each submission can also send an email).
 */
export const GLOBAL_THROTTLE = { ttl: 60_000, limit: 600 } as const;

export const LOGIN_THROTTLE = { default: { ttl: 60_000, limit: 5 } } as const;

export const PASSWORD_CHANGE_THROTTLE = {
  default: { ttl: 60_000, limit: 5 },
} as const;

export const PUBLIC_FORM_THROTTLE = {
  default: { ttl: 600_000, limit: 5 },
} as const;
