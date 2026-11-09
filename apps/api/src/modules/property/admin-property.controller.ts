import { Controller, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { PropertyService } from './property.service';
import { UpdatePropertyStatusRequestDto } from './dto/property.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@rental-peshawar/shared-types';

@Controller('admin/properties')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class AdminPropertyController {
  constructor(private readonly propertyService: PropertyService) {}

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdatePropertyStatusRequestDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.propertyService.updateStatusByAdmin(id, user.sub, dto);
  }
}
