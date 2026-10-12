import { Body, Controller, Post } from '@nestjs/common';
import { ContactService } from './contact.service';
import { ContactDto } from './dto/contact.dto';
import { Public } from '../auth/decorators/public.decorator';

@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  @Public()
  async create(@Body() dto: ContactDto) {
    return this.contactService.sendContactMessage(dto);
  }
}
