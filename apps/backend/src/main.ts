import 'dotenv/config';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { assertJwtSecretConfigured } from './auth/auth.constants';
import { ProblemDetailsFilter } from './common/problem-details.filter';
import { configureUploads } from './media/configure-uploads';

async function bootstrap() {
  assertJwtSecretConfigured();
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    // Body parsing is configured explicitly below with a size limit.
    bodyParser: false,
  });

  const corsOrigins = (
    process.env.CORS_ORIGINS ?? 'http://localhost:5007,http://localhost:5007'
  )
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Request-Id',
      'X-CSRF-Token',
    ],
    exposedHeaders: ['X-Request-Id'],
    credentials: true,
  });

  if (process.env.TRUST_PROXY) {
    app.set('trust proxy', process.env.TRUST_PROXY === 'true' ? 1 : process.env.TRUST_PROXY);
  }

  // Security headers (audit finding #1) and explicit JSON body-size limit
  // (audit finding #6). Helmet sets HSTS, CSP, X-Frame-Options, etc.
  // Relax the cross-origin policies: the frontend and API are on different
  // origins (different ports), so same-origin/require-corp would block
  // every API response in the browser (ERR_BLOCKED_BY_RESPONSE.NotSameOrigin).
  // HSTS is enabled when ENFORCE_HTTPS=true (production behind TLS).
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      crossOriginEmbedderPolicy: false,
      crossOriginOpenerPolicy: { policy: 'unsafe-none' },
      hsts: process.env.ENFORCE_HTTPS === 'true'
        ? { maxAge: 31_536_000, includeSubDomains: true, preload: true }
        : false,
    }),
  );

  // Enforce HTTPS: redirect any plain-HTTP request to https:// in production.
  // Enable with ENFORCE_HTTPS=true. Behind a reverse proxy, set TRUST_PROXY
  // so req.protocol reflects the original scheme.
  if (process.env.ENFORCE_HTTPS === 'true') {
    app.use((req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) => {
      if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
        return next();
      }
      res.redirect(308, `https://${req.headers.host}${req.url}`);
    });
  }

  // Cookie parsing required for the cookie-based auth flow (audit finding #4).
  app.use(cookieParser());
  app.useBodyParser('json', { limit: process.env.BODY_SIZE_LIMIT ?? '1mb' });

  configureUploads(app);

  app.useGlobalFilters(new ProblemDetailsFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(process.env.APP_PORT ?? 5007);
}

void bootstrap();
