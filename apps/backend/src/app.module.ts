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
