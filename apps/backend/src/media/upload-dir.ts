import { join } from 'node:path';

export const UPLOAD_ROUTE = '/uploads';

export function getUploadDir(): string {
  return process.env.UPLOAD_DIR ?? join(process.cwd(), 'uploads');
}
