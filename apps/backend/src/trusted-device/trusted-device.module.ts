import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrustedDevice } from './trusted-device.entity';
import { TrustedDeviceService } from './trusted-device.service';
import { TrustedDeviceController } from './trusted-device.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TrustedDevice])],
  providers: [TrustedDeviceService],
  controllers: [TrustedDeviceController],
  exports: [TrustedDeviceService],
})
export class TrustedDeviceModule {}
