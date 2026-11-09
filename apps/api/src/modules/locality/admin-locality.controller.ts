import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { LocalityService } from './locality.service';
import {
  CreateLocalityRequestDto,
  UpdateLocalityRequestDto,
  UpdateLocalityStatusRequestDto,
} from './dto/locality.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@rental-peshawar/shared-types';

@Controller('admin/localities')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class AdminLocalityController {
  constructor(private readonly localityService: LocalityService) {}

  @Get()
  async getLocalitiesForAdmin() {
    return this.localityService.findAllAdmin();
  }

  @Post()
  async createLocality(
    @Body() dto: CreateLocalityRequestDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.localityService.create(dto, user.sub);
  }

  @Patch(':id')
  async updateLocality(
    @Param('id') id: string,
    @Body() dto: UpdateLocalityRequestDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.localityService.update(id, dto, user.sub);
  }

  @Delete(':id')
  async deleteLocality(@Param('id') id: string, @CurrentUser() user: { sub: string }) {
    return this.localityService.delete(id, user.sub);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateLocalityStatusRequestDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.localityService.updateStatus(id, dto.isActive, user.sub);
  }
}
