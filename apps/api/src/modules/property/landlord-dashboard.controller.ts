import { Controller, Get, UseGuards } from '@nestjs/common';
import { PropertyService } from './property.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@rental-peshawar/shared-types';

@Controller('landlord/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.LANDLORD, UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class LandlordDashboardController {
  constructor(private readonly propertyService: PropertyService) {}

  @Get()
  async getDashboardSummary(@CurrentUser() user: { sub: string }) {
    return this.propertyService.getLandlordDashboard(user.sub);
  }
}
