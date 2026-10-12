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
import { LanguageService } from './language.service';
import { CreateLanguageDto } from './dto/create-language.dto';
import { Public } from '../auth/decorators/public.decorator';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';

@Controller('languages')
export class LanguageController {
  constructor(private readonly languageService: LanguageService) {}

  @Get()
  @Public()
  findAll() {
    return this.languageService.findAll();
  }

  @Get(':id')
  @Public()
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.languageService.findOne(id);
  }

  @Post()
  @RequirePermission('manage_languages')
  create(@Body() dto: CreateLanguageDto) {
    return this.languageService.create(dto);
  }

  @Patch(':id')
  @RequirePermission('manage_languages')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateLanguageDto>,
  ) {
    return this.languageService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermission('manage_languages')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.languageService.remove(id);
  }
}
