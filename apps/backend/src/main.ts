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
  app.use(helmet());
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
