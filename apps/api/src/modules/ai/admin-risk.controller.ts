import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole, RiskEntityType, RiskLevel } from '@rental-peshawar/shared-types';
import { FraudDetectionService } from './fraud-detection.service';
import { MarketplaceIntelligenceService } from './marketplace-intelligence.service';
import { ContentModerationService } from './content-moderation.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MODERATOR)
export class AdminRiskController {
  constructor(
    private readonly fraudService: FraudDetectionService,
    private readonly marketplaceService: MarketplaceIntelligenceService,
    private readonly moderationService: ContentModerationService,
  ) {}

  @Get('risk/entities')
  async getRiskEntities(
    @Query('entityType') entityType?: RiskEntityType,
    @Query('riskLevel') riskLevel?: RiskLevel,
    @Query('isResolved') isResolved?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const data = await this.fraudService.getRiskEntities({
      entityType,
      riskLevel,
      isResolved: isResolved !== undefined ? isResolved === 'true' : undefined,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
    return { success: true, data };
  }

  @Get('risk/:entityType/:entityId')
  async getEntityRisk(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ) {
    const data = await this.fraudService.getEntityRisk(entityType, entityId);
    return { success: true, data };
  }

  @Patch('risk/:entityType/:entityId/review')
  @HttpCode(HttpStatus.OK)
  async reviewEntityRisk(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
    @CurrentUser('sub') adminId: string,
    @Body()
    dto: { isResolved: boolean; decision: string; resolutionNotes?: string },
  ) {
    const data = await this.fraudService.reviewRiskEntity(entityType, entityId, adminId, dto);
    return { success: true, data };
  }

  @Get('intelligence/overview')
  async getIntelligenceOverview() {
    const data = await this.marketplaceService.getOverview();
    return { success: true, data };
  }

  @Get('intelligence/localities')
  async getLocalityIntelligence() {
    const data = await this.marketplaceService.getLocalityIntelligence();
    return { success: true, data };
  }

  @Get('intelligence/fraud')
  async getFraudTrends() {
    const data = await this.marketplaceService.getFraudTrends();
    return { success: true, data };
  }

  @Get('moderation/records')
  async getModerationRecords(
    @Query('flag') flag?: any,
    @Query('actionTaken') actionTaken?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const data = await this.moderationService.getModerationRecords({
      flag,
      actionTaken,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
    return { success: true, data };
  }

  @Patch('moderation/records/:id/review')
  @HttpCode(HttpStatus.OK)
  async reviewModerationRecord(
    @Param('id') recordId: string,
    @CurrentUser('sub') adminId: string,
    @Body('reviewerAction') reviewerAction: 'APPROVED' | 'BLOCKED' | 'DISMISSED',
  ) {
    const data = await this.moderationService.reviewModerationRecord(
      recordId,
      adminId,
      reviewerAction,
    );
    return { success: true, data };
  }
}
