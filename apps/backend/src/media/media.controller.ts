import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { MediaService } from './media.service';
import { MediaUploadService, UploadedImage } from './media-upload.service';
import { CreateMediaDto, UpdateMediaDto } from './dto/create-media.dto';
import { UPLOAD_ROUTE } from './upload-dir';
import { Public } from '../auth/decorators/public.decorator';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';

@Controller('media')
export class MediaController {
  constructor(
    private readonly mediaService: MediaService,
    private readonly uploadService: MediaUploadService,
  ) {}

  @Get()
  @Public()
  findAll() {
    return this.mediaService.findAll();
  }

  @Post()
  @RequirePermission('manage_media')
  create(@Body() dto: CreateMediaDto) {
    return this.mediaService.create(dto);
  }

  /** Stores one image (field `file`, max 5 MB) and returns its public URL. */
  @Post('upload')
  @RequirePermission(['manage_media', 'manage_blog', 'manage_courses'])
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024, files: 1 } }),
  )
  async upload(
    @UploadedFile() file: UploadedImage | undefined,
    @Req() request: Request,
  ) {
    if (!file) {
      throw new BadRequestException('Attach an image in the "file" field');
    }
    const name = await this.uploadService.save(file);
    const origin =
      process.env.UPLOAD_PUBLIC_URL?.replace(/\/+$/, '') ??
      `${request.protocol}://${request.get('host')}`;
    return { url: `${origin}${UPLOAD_ROUTE}/${name}` };
  }

  @Patch(':id')
  @RequirePermission('manage_media')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMediaDto,
  ) {
    return this.mediaService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermission('manage_media')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.mediaService.remove(id);
  }
}
