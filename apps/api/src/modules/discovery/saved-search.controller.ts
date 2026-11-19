import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SavedSearchService } from './saved-search.service';
import {
  CreateSavedSearchRequestDto,
  UpdateSavedSearchRequestDto,
  UpdateSavedSearchAlertsRequestDto,
  NotificationPreferenceRequestDto,
} from './dto/saved-search.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('saved-searches')
@UseGuards(JwtAuthGuard)
export class SavedSearchController {
  constructor(private readonly savedSearchService: SavedSearchService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@CurrentUser('sub') userId: string, @Body() dto: CreateSavedSearchRequestDto) {
    return this.savedSearchService.createSavedSearch(userId, dto);
  }

  @Get()
  async getMySavedSearches(@CurrentUser('sub') userId: string) {
    return this.savedSearchService.getUserSavedSearches(userId);
  }

  @Get(':id')
  async getById(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.savedSearchService.getSavedSearchById(id, userId);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdateSavedSearchRequestDto,
  ) {
    return this.savedSearchService.updateSavedSearch(id, userId, dto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.savedSearchService.deleteSavedSearch(id, userId);
  }

  @Patch(':id/alerts')
  async updateAlerts(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdateSavedSearchAlertsRequestDto,
  ) {
    return this.savedSearchService.updateSavedSearchAlerts(id, userId, dto);
  }
}

@Controller('notification-preferences')
@UseGuards(JwtAuthGuard)
export class NotificationPreferenceController {
  constructor(private readonly savedSearchService: SavedSearchService) {}

  @Get()
  async getPreferences(@CurrentUser('sub') userId: string) {
    return this.savedSearchService.getNotificationPreferences(userId);
  }

  @Patch()
  async updatePreferences(
    @CurrentUser('sub') userId: string,
    @Body() dto: NotificationPreferenceRequestDto,
  ) {
    return this.savedSearchService.updateNotificationPreferences(userId, dto);
  }
}
