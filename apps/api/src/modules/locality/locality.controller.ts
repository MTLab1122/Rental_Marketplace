import { Controller, Get, Param } from '@nestjs/common';
import { LocalityService } from './locality.service';

@Controller('localities')
export class LocalityController {
  constructor(private readonly localityService: LocalityService) {}

  @Get()
  async getLocalities() {
    return this.localityService.findAllActive();
  }

  @Get(':id')
  async getLocality(@Param('id') id: string) {
    return this.localityService.findByIdOrSlug(id);
  }
}
