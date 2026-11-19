import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole, AiSuggestionStatus } from '@rental-peshawar/shared-types';
import { ListingQualityService } from './listing-quality.service';
import { PricingIntelligenceService } from './pricing-intelligence.service';

@Controller('landlord/properties')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.LANDLORD, UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class LandlordAiController {
  constructor(
    private readonly qualityService: ListingQualityService,
    private readonly pricingService: PricingIntelligenceService,
  ) {}

  @Post(':id/quality-suggestions')
  @HttpCode(HttpStatus.OK)
  async evaluateQuality(@Param('id') propertyId: string, @CurrentUser('sub') landlordId: string) {
    const data = await this.qualityService.generateQualitySuggestions(propertyId, landlordId);
    return { success: true, data };
  }

  @Get(':id/quality-suggestions')
  async getQualitySuggestions(
    @Param('id') propertyId: string,
    @CurrentUser('sub') landlordId: string,
  ) {
    const data = await this.qualityService.getQualitySuggestions(propertyId, landlordId);
    return { success: true, data };
  }

  @Patch(':id/quality-suggestions/:suggestionId')
  @HttpCode(HttpStatus.OK)
  async updateSuggestion(
    @Param('suggestionId') suggestionId: string,
    @CurrentUser('sub') landlordId: string,
    @Body('status') status: AiSuggestionStatus,
  ) {
    const data = await this.qualityService.updateSuggestionStatus(suggestionId, status, landlordId);
    return { success: true, data };
  }

  @Post(':id/price-insights')
  @HttpCode(HttpStatus.OK)
  async getPriceInsights(@Param('id') propertyId: string) {
    const data = await this.pricingService.getPropertyPriceInsights(propertyId);
    return { success: true, data };
  }
}
