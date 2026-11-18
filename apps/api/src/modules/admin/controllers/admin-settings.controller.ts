import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { AdminSettingsService } from '../services/admin-settings.service';
import { UpdateSystemSettingDto } from '../dto/admin.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { UserRole } from '@rental-peshawar/shared-types';

@Controller('admin/settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class AdminSettingsController {
  constructor(private readonly settingsService: AdminSettingsService) {}

  @Get()
  async getSettings() {
    return this.settingsService.getSettings();
  }

  @Patch(':key')
  async updateSetting(
    @Param('key') key: string,
    @Body() dto: UpdateSystemSettingDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.settingsService.updateSetting(key, dto.value, user.sub, dto.description);
  }

  @Get('flags')
  async getFeatureFlags() {
    return this.settingsService.getFeatureFlags();
  }

  @Patch('flags/:key')
  async updateFeatureFlag(
    @Param('key') key: string,
    @Body('enabled') enabled: boolean,
    @CurrentUser() user: { sub: string },
  ) {
    return this.settingsService.updateSetting(key, enabled, user.sub);
  }
}
