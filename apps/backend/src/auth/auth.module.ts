import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AdminUser } from './admin-user.entity';
import { Permission } from './permission.entity';
import { RefreshToken } from './refresh-token.entity';
import { Role } from './role.entity';
import { CsrfGuard, JwtAuthGuard } from './guards/jwt-auth.guard';
import { PermissionsGuard } from './guards/permissions.guard';

@Module({
  imports: [TypeOrmModule.forFeature([AdminUser, Role, Permission, RefreshToken])],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, CsrfGuard, PermissionsGuard],
  exports: [AuthService],
})
export class AuthModule {}
