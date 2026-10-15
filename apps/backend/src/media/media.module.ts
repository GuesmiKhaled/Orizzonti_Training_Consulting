import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SliderMedia } from './media.entity';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { MediaUploadService } from './media-upload.service';

@Module({
  imports: [TypeOrmModule.forFeature([SliderMedia])],
  controllers: [MediaController],
  providers: [MediaService, MediaUploadService],
  exports: [MediaService],
})
export class MediaModule {}
