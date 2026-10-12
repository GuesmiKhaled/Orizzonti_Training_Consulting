import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AdminUser } from './admin-user.entity';
import { Permission } from './permission.entity';
import { Role } from './role.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AdminUser, Role, Permission])],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
