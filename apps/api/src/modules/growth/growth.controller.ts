import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Header,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { GrowthService } from './growth.service';
import {
  CreateSavedSearchDto,
  CreateLandlordReviewDto,
  RecordRecentlyViewedDto,
  ClaimReferralDto,
} from './growth.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@rental-peshawar/shared-types';

@Controller('growth')
export class GrowthController {
  constructor(private readonly growthService: GrowthService) {}

  /**
   * Referral program metrics and code for user
   */
  @Get('referral-program')
  @UseGuards(JwtAuthGuard)
  async getReferralProgram(@CurrentUser() user: { sub: string }) {
    return this.growthService.getReferralProgram(user.sub);
  }

  /**
   * Claim referral code
   */
  @Post('claim-referral')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async claimReferral(@Body() dto: ClaimReferralDto, @CurrentUser() user: { sub: string }) {
    return this.growthService.claimReferral(dto, user.sub);
  }

  /**
   * Create a saved search for new-listing alerts
   */
  @Post('saved-searches')
  @UseGuards(JwtAuthGuard)
  async createSavedSearch(@Body() dto: CreateSavedSearchDto, @CurrentUser() user: { sub: string }) {
    return this.growthService.createSavedSearch(user.sub, dto);
  }

  /**
   * Get active saved searches for current user
   */
  @Get('saved-searches')
  @UseGuards(JwtAuthGuard)
  async getSavedSearches(@CurrentUser() user: { sub: string }) {
    return this.growthService.getSavedSearches(user.sub);
  }

  /**
   * Delete saved search
   */
  @Delete('saved-searches/:id')
  @UseGuards(JwtAuthGuard)
  async deleteSavedSearch(@Param('id') id: string, @CurrentUser() user: { sub: string }) {
    return this.growthService.deleteSavedSearch(user.sub, id);
  }

  /**
   * Track recently viewed property
   */
  @Post('recently-viewed')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async recordRecentlyViewed(
    @Body() dto: RecordRecentlyViewedDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.growthService.recordRecentlyViewed(user.sub, dto.propertyId);
  }

  /**
   * Get user's recently viewed properties
   */
  @Get('recently-viewed')
  @UseGuards(JwtAuthGuard)
  async getRecentlyViewed(@CurrentUser() user: { sub: string }) {
    return this.growthService.getRecentlyViewed(user.sub);
  }

  /**
   * Similar-property recommendations with strict eligibility segregation
   */
  @Get('recommendations/:propertyId')
  async getRecommendations(@Param('propertyId') propertyId: string) {
    return this.growthService.getSimilarProperties(propertyId);
  }

  /**
   * Submit Landlord review after completed inquiry
   */
  @Post('reviews')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TENANT, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async createReview(@Body() dto: CreateLandlordReviewDto, @CurrentUser() user: { sub: string }) {
    return this.growthService.createLandlordReview(user.sub, dto);
  }

  /**
   * Landlord trust badges and response telemetry
   */
  @Get('landlords/:id/badges')
  async getLandlordBadges(@Param('id') id: string) {
    return this.growthService.getLandlordBadges(id);
  }

  /**
   * Schema.org Structured Data (JSON-LD) for property SEO
   */
  @Get('seo/structured-data/:propertyId')
  async getStructuredData(@Param('propertyId') propertyId: string) {
    return this.growthService.getPropertyStructuredData(propertyId);
  }

  /**
   * Dynamic XML Sitemap for Peshawar properties and localities
   */
  @Get('seo/sitemap.xml')
  @Header('Content-Type', 'text/xml')
  async getSitemap() {
    return this.growthService.generateSitemapXml();
  }

  /**
   * WhatsApp share link and deep link generator
   */
  @Get('share/:propertyId')
  async getShareLinks(@Param('propertyId') propertyId: string) {
    return this.growthService.getShareLinks(propertyId);
  }

  /**
   * Localized landing page benchmarks and properties
   */
  @Get('localities/:slug')
  async getLocalityLanding(@Param('slug') slug: string) {
    return this.growthService.getLocalityLandingPage(slug);
  }
}
