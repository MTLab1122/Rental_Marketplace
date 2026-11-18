import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminAnalyticsService } from '../services/admin-analytics.service';
import { AdminAnalyticsQueryDto } from '../dto/admin.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '@rental-peshawar/shared-types';

@Controller('admin/analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MODERATOR)
export class AdminAnalyticsController {
  constructor(private readonly analyticsService: AdminAnalyticsService) {}

  @Get()
  async getAnalytics(@Query() query: AdminAnalyticsQueryDto) {
    return this.analyticsService.getPlatformAnalytics(query);
  }

  @Get('trends')
  async getTrends() {
    return this.analyticsService.getTrends();
  }
}
