import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
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
import { AdminUser } from './auth/admin-user.entity';
import { Permission } from './auth/permission.entity';
import { Role } from './auth/role.entity';
import { Blog } from './blog/blog.entity';
import { Course } from './course/course.entity';
import { Language } from './language/language.entity';
import { LanguageLevel } from './language/language-level.entity';
import { ExamSession } from './language/exam-session.entity';
import { MailSettings } from './settings/mail-settings.entity';
import { SliderMedia } from './media/media.entity';
import { CourseRequest } from './course-request/course-request.entity';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { PermissionsGuard } from './auth/guards/permissions.guard';

const databaseConfig = {
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 1433),
  username: process.env.DB_USER ?? 'vagrok',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME ?? 'orizzontdb',
};

console.info(
  `[Database] Target: Server=${databaseConfig.host};Database=${databaseConfig.database};User Id=${databaseConfig.username};Password=[REDACTED];TrustServerCertificate=true; (port ${databaseConfig.port})`,
);

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mssql',
      ...databaseConfig,
      entities: [
        AdminUser,
        Role,
        Permission,
        Blog,
        Course,
        Language,
        LanguageLevel,
        ExamSession,
        MailSettings,
        SliderMedia,
        CourseRequest,
      ],
      synchronize: process.env.DB_SYNCHRONIZE === 'true',
      logging: false,
      options: {
        encrypt: false,
        trustServerCertificate: true,
      },
    }),
    TypeOrmModule.forFeature([
      Blog,
      Course,
      Language,
      SliderMedia,
      CourseRequest,
    ]),
    AuthModule,
    ContactModule,
    BlogModule,
    CourseModule,
    LanguageModule,
    SettingsModule,
    MediaModule,
    CourseRequestModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})
export class AppModule {}
