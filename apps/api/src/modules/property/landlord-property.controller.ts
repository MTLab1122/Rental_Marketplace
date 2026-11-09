import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { PropertyService } from './property.service';
import {
  CreatePropertyRequestDto,
  UpdatePropertyRequestDto,
  UpdatePropertyStatusRequestDto,
} from './dto/property.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@rental-peshawar/shared-types';

@Controller('landlord/properties')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.LANDLORD, UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class LandlordPropertyController {
  constructor(private readonly propertyService: PropertyService) {}

  @Post()
  async createProperty(
    @Body() dto: CreatePropertyRequestDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.propertyService.create(user.sub, dto);
  }

  @Get()
  async getProperties(@CurrentUser() user: { sub: string }) {
    return this.propertyService.findAllByLandlord(user.sub);
  }

  @Get(':id')
  async getProperty(@Param('id') id: string, @CurrentUser() user: { sub: string }) {
    return this.propertyService.findByIdForLandlord(id, user.sub);
  }

  @Patch(':id')
  async updateProperty(
    @Param('id') id: string,
    @Body() dto: UpdatePropertyRequestDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.propertyService.update(id, user.sub, dto);
  }

  @Delete(':id')
  async deleteProperty(@Param('id') id: string, @CurrentUser() user: { sub: string }) {
    return this.propertyService.delete(id, user.sub);
  }

  @Patch(':id/status')
  async updatePropertyStatus(
    @Param('id') id: string,
    @Body() dto: UpdatePropertyStatusRequestDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.propertyService.updateStatusByLandlord(id, user.sub, dto.status);
  }
}
