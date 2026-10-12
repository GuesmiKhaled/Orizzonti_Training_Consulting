import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { MediaService } from './media.service';
import { Public } from '../auth/decorators/public.decorator';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get()
  @Public()
  findAll() {
    return this.mediaService.findAll();
  }

  @Post()
  @RequirePermission('manage_media')
  create(@Body() dto: any) {
    return this.mediaService.create(dto);
  }

  @Patch(':id')
  @RequirePermission('manage_media')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: any) {
    return this.mediaService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermission('manage_media')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.mediaService.remove(id);
  }
}
