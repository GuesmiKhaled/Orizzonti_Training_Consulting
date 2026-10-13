export const PUBLIC_ROUTE_KEY = 'isPublic';
export const REQUIRED_PERMISSION_KEY = 'requiredPermission';

export function getJwtSecret(): string {
  return process.env.JWT_SECRET ?? 'local-development-only-change-me';
}
