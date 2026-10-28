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
      // Allow cross-origin reads of uploaded images. The frontend and API
      // are on different origins (different ports); without this header the
      // browser blocks the image with ERR_BLOCKED_BY_RESPONSE.NotSameOrigin.
      response.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    },
  });
}
