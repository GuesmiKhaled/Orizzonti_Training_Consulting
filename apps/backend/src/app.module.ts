import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ContactModule } from './contact/contact.module';
import { BlogModule } from './blog/blog.module';
import { CourseModule } from './course/course.module';
import { LanguageModule } from './language/language.module';
import { SettingsModule } from './settings/settings.module';
import { MediaModule } from './media/media.module';
import { CourseRequestModule } from './course-request/course-request.module';
import { SiteSettingsModule } from './site-settings/site-settings.module';
import { SiteSettings } from './site-settings/site-settings.entity';
import { AdminUser } from './auth/admin-user.entity';
import { Permission } from './auth/permission.entity';
import { RefreshToken } from './auth/refresh-token.entity';
import { Role } from './auth/role.entity';
import { Blog } from './blog/blog.entity';
import { Course } from './course/course.entity';
import { Language } from './language/language.entity';
import { LanguageLevel } from './language/language-level.entity';
import { ExamSession } from './language/exam-session.entity';
import { ExamRegistration } from './language/exam-registration.entity';
import { MailSettings } from './settings/mail-settings.entity';
import { SliderMedia } from './media/media.entity';
import { CourseRequest } from './course-request/course-request.entity';
import { CsrfGuard, JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { PermissionsGuard } from './auth/guards/permissions.guard';
import { GLOBAL_THROTTLE } from './throttling';
import { RequestIdMiddleware } from './common/request-id.middleware';
import { HealthModule } from './health/health.module';
import { TrustedDeviceModule } from './trusted-device/trusted-device.module';
import { TrustedDevice } from './trusted-device/trusted-device.entity';
import { OtpModule } from './otp/otp.module';
import { OtpChallenge } from './otp/otp-challenge.entity';
import { NotificationModule } from './notification/notification.module';
import { EmailNotification } from './notification/email-notification.entity';

const databaseConfig = {
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 1433),
  username: process.env.DB_USER ?? 'vagrok',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME ?? 'orizzontdb',
  options: {
    // Audit finding #2: make TLS configurable. Defaults preserve the
    // existing behavior (encrypt off) so connectivity is not broken; set
    // DB_ENCRYPT=true and DB_TRUST_SERVER_CERTIFICATE as needed to enable
    // encrypted connections to SQL Server.
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE !== 'false',
    // Recommended by Microsoft — prevents arithmetic abort errors that can
    // cause query plan differences and intermittent failures. (The TypeORM
    // mssql driver also sets this, but we set it explicitly for clarity.)
    enableArithAbort: true,
  },
  // Pool and timeout tuning. Stale-connection timeouts (15s default
  // requestTimeout) are common when the app runs in Docker Desktop on
  // Windows: the WSL2 NAT layer silently drops idle TCP connections, so
  // the pool hands out dead sockets and queries hang until the timeout
  // fires. healthCheck runs SELECT 1 before reusing a pooled connection,
  // and a shorter idleTimeoutMillis recycles connections before the NAT
  // drops them.
  requestTimeout: Number(process.env.DB_REQUEST_TIMEOUT_MS ?? 30000),
  connectionTimeout: Number(process.env.DB_CONNECTION_TIMEOUT_MS ?? 15000),
  // The pool config (including healthCheck, which is a tarn option not in
  // TypeORM's typed pool interface) goes in extra — the driver spreads
  // extra last, so it overrides the typed pool field.
  extra: {
    pool: {
      max: Number(process.env.DB_POOL_MAX ?? 10),
      min: 0,
      idleTimeoutMillis: Number(process.env.DB_POOL_IDLE_TIMEOUT_MS ?? 10000),
      healthCheck: true,
    },
  },
};

console.info(
  `[Database] Target: Server=${databaseConfig.host};Database=${databaseConfig.database};User Id=[REDACTED];Password=[REDACTED];Encrypt=${databaseConfig.options.encrypt};TrustServerCertificate=${databaseConfig.options.trustServerCertificate}; (port ${databaseConfig.port})`,
);

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mssql',
      host: databaseConfig.host,
      port: databaseConfig.port,
      username: databaseConfig.username,
      password: databaseConfig.password,
      database: databaseConfig.database,
      entities: [
        AdminUser,
        Role,
        Permission,
        RefreshToken,
        Blog,
        Course,
        Language,
        LanguageLevel,
        ExamSession,
        ExamRegistration,
        MailSettings,
        SliderMedia,
        CourseRequest,
        SiteSettings,
        TrustedDevice,
        OtpChallenge,
        EmailNotification,
      ],
      synchronize: process.env.DB_SYNCHRONIZE === 'true',
      logging: false,
      options: databaseConfig.options,
    }),
    ThrottlerModule.forRoot([GLOBAL_THROTTLE]),
    TypeOrmModule.forFeature([
      Blog,
      Course,
      Language,
      SliderMedia,
      CourseRequest,
      AdminUser,
    ]),
    AuthModule,
    ContactModule,
    BlogModule,
    CourseModule,
    LanguageModule,
    SettingsModule,
    MediaModule,
    CourseRequestModule,
    SiteSettingsModule,
    HealthModule,
    TrustedDeviceModule,
    OtpModule,
    NotificationModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
    { provide: APP_GUARD, useClass: CsrfGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    // Correlation id on every request (audit finding #8).
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
