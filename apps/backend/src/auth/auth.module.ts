import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AdminUser } from './admin-user.entity';
import { IdempotencyKey } from './idempotency-key.entity';
import { Permission } from './permission.entity';
import { RefreshToken } from './refresh-token.entity';
import { Role } from './role.entity';
import { CsrfGuard, JwtAuthGuard } from './guards/jwt-auth.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { IdempotencyService } from './idempotency.service';
import { IdempotencyInterceptor } from './idempotency.interceptor';
import { OtpModule } from '../otp/otp.module';
import { TrustedDeviceModule } from '../trusted-device/trusted-device.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AdminUser,
      Role,
      Permission,
      RefreshToken,
      IdempotencyKey,
    ]),
    OtpModule,
    TrustedDeviceModule,
    MailModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtAuthGuard,
    CsrfGuard,
    PermissionsGuard,
    IdempotencyService,
    {
      provide: APP_INTERCEPTOR,
      useClass: IdempotencyInterceptor,
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}
