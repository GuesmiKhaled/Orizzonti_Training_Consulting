import { NestExpressApplication } from '@nestjs/platform-express';
import { UPLOAD_ROUTE, getUploadDir } from './upload-dir';

/** Serves uploaded images read-only from /uploads with hardened headers. */
export function configureUploads(app: NestExpressApplication): void {
  app.useStaticAssets(getUploadDir(), {
    prefix: `${UPLOAD_ROUTE}/`,
    index: false,
    dotfiles: 'deny',
    setHeaders: (response) => {
      response.setHeader('X-Content-Type-Options', 'nosniff');
      response.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    },
  });
}
