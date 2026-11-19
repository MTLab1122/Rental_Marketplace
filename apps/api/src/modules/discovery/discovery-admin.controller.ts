import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SavedSearchService } from './saved-search.service';
import { DiscoveryEventsService } from './discovery-events.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@rental-peshawar/shared-types';

@Controller('admin/discovery')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MODERATOR)
export class DiscoveryAdminController {
  constructor(
    private readonly savedSearchService: SavedSearchService,
    private readonly discoveryEventsService: DiscoveryEventsService,
  ) {}

  @Get('alerts')
  async getAlertDeliveries(@Query('limit') limit?: string) {
    const take = limit ? parseInt(limit, 10) : 50;
    return this.savedSearchService.getAlertDeliveries(take);
  }

  @Get('locality-demand')
  async getLocalityDemand(
    @Query('localityId') localityId?: string,
    @Query('period') period?: string,
  ) {
    return this.discoveryEventsService.getLocalityDemand(localityId, period || 'DAILY');
  }

  @Get('analytics')
  async getAnalytics() {
    return this.discoveryEventsService.getAnalyticsSummary();
  }
}
