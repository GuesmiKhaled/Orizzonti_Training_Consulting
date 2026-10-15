import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ContactService } from './contact.service';
import { PUBLIC_FORM_THROTTLE } from '../throttling';
import { ContactDto } from './dto/contact.dto';
import { Public } from '../auth/decorators/public.decorator';

@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  @Public()
  @Throttle(PUBLIC_FORM_THROTTLE)
  async create(@Body() dto: ContactDto) {
    return this.contactService.sendContactMessage(dto);
  }
}
