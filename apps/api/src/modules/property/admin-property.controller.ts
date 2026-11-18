import { Controller, Get, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { PropertyService } from './property.service';
import {
  AdminPropertyQueryDto,
  AdminReasonDto,
  UpdatePropertyStatusRequestDto,
} from './dto/property.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@rental-peshawar/shared-types';

@Controller('admin/properties')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MODERATOR)
export class AdminPropertyController {
  constructor(private readonly propertyService: PropertyService) {}

  @Get()
  async getProperties(@Query() query: AdminPropertyQueryDto) {
    return this.propertyService.findAllAdmin(query);
  }

  @Get(':id')
  async getPropertyDetail(@Param('id') id: string) {
    return this.propertyService.findByIdForAdmin(id);
  }

  @Patch(':id/approve')
  async approveProperty(@Param('id') id: string, @CurrentUser() user: { sub: string }) {
    return this.propertyService.approveByAdmin(id, user.sub);
  }

  @Patch(':id/reject')
  async rejectProperty(
    @Param('id') id: string,
    @Body() dto: AdminReasonDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.propertyService.rejectByAdmin(id, user.sub, dto.reason);
  }

  @Patch(':id/suspend')
  async suspendProperty(
    @Param('id') id: string,
    @Body() dto: AdminReasonDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.propertyService.suspendByAdmin(id, user.sub, dto.reason);
  }

  @Patch(':id/restore')
  async restoreProperty(@Param('id') id: string, @CurrentUser() user: { sub: string }) {
    return this.propertyService.restoreByAdmin(id, user.sub);
  }

  @Delete(':id')
  async deleteProperty(@Param('id') id: string, @CurrentUser() user: { sub: string }) {
    return this.propertyService.deleteByAdmin(id, user.sub);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdatePropertyStatusRequestDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.propertyService.updateStatusByAdmin(id, user.sub, dto);
  }
}
