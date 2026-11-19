import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { MonetizationService } from './monetization.service';
import {
  CreateLeadDto,
  UpdateLeadStatusDto,
  LogContactAttemptDto,
  AddLeadNoteDto,
  AssignLeadDto,
  CreateCampaignDto,
  UpdateCampaignDto,
  CreateCampaignVariantDto,
  TrackCampaignTouchDto,
  CreatePromoCodeDto,
  ApplyPromoCodeDto,
  CreatePromotionDto,
  ApplyPromotionDto,
  CreateSubscriptionPlanDto,
  SubscribePlanDto,
  ProcessRefundDto,
  ClaimReferralCodeDto,
  FeatureListingPlacementDto,
  LocalitySponsorshipDto,
} from './monetization.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole, LeadStatus, LeadSource, LeadType } from '@rental-peshawar/shared-types';

@Controller('monetization')
export class MonetizationController {
  constructor(private readonly monetizationService: MonetizationService) {}

  // ==========================================
  // PUBLIC & TENANT/LANDLORD COMMERCIAL FLOWS
  // ==========================================

  /**
   * Public Landlord & Tenant Inbound Lead Capture
   */
  @Post('leads')
  @HttpCode(HttpStatus.CREATED)
  async captureLead(@Body() dto: CreateLeadDto) {
    return this.monetizationService.createLead(dto);
  }

  /**
   * Track Marketing Campaign Touchpoints
   */
  @Post('campaigns/track')
  @HttpCode(HttpStatus.OK)
  async trackCampaignTouch(@Body() dto: TrackCampaignTouchDto, @Req() req: any) {
    const userId = req.user?.sub;
    return this.monetizationService.trackCampaignTouch(dto, userId);
  }

  /**
   * Public Promotional Packages Catalog
   */
  @Get('promotions')
  async getPromotions() {
    return this.monetizationService.getPromotions();
  }

  /**
   * Landlord Applies / Buys Listing Promotion
   */
  @Post('promotions/apply')
  @UseGuards(JwtAuthGuard)
  async applyPromotion(@Body() dto: ApplyPromotionDto, @CurrentUser() user: { sub: string }) {
    return this.monetizationService.applyPromotion(user.sub, dto);
  }

  /**
   * Public Subscription Plans
   */
  @Get('plans')
  async getSubscriptionPlans() {
    return this.monetizationService.getSubscriptionPlans();
  }

  /**
   * Landlord's Current Active Subscription
   */
  @Get('subscriptions/current')
  @UseGuards(JwtAuthGuard)
  async getCurrentSubscription(@CurrentUser() user: { sub: string }) {
    return this.monetizationService.getCurrentSubscription(user.sub);
  }

  /**
   * Subscribe to Landlord Subscription Plan
   */
  @Post('subscriptions/subscribe')
  @UseGuards(JwtAuthGuard)
  async subscribePlan(@Body() dto: SubscribePlanDto, @CurrentUser() user: { sub: string }) {
    return this.monetizationService.subscribeToPlan(user.sub, dto);
  }

  /**
   * Landlord / Tenant Invoices
   */
  @Get('invoices')
  @UseGuards(JwtAuthGuard)
  async getInvoices(@CurrentUser() user: { sub: string }) {
    return this.monetizationService.getInvoices(user.sub);
  }

  /**
   * Single Invoice View
   */
  @Get('invoices/:id')
  @UseGuards(JwtAuthGuard)
  async getInvoiceById(@Param('id') id: string, @CurrentUser() user: { sub: string }) {
    return this.monetizationService.getInvoiceById(id, user.sub);
  }

  /**
   * Validate Promo Code
   */
  @Post('promo-codes/validate')
  @HttpCode(HttpStatus.OK)
  async validatePromoCode(@Body() dto: ApplyPromoCodeDto) {
    return this.monetizationService.validatePromoCode(dto.code, dto.applicableType);
  }

  /**
   * Claim Referral Reward
   */
  @Post('referrals/claim')
  @UseGuards(JwtAuthGuard)
  async claimReferral(
    @Body() dto: ClaimReferralCodeDto,
    @CurrentUser() user: { sub: string },
    @Req() req: any,
  ) {
    const ip = req.ip || req.headers['x-forwarded-for'];
    const ua = req.headers['user-agent'];
    return this.monetizationService.claimReferralCode(user.sub, dto, ip, ua);
  }

  /**
   * Legacy Compatibility: Feature Listing Placement
   */
  @Post('feature-listing')
  @UseGuards(JwtAuthGuard)
  async applyFeaturedPlacement(
    @Body() dto: FeatureListingPlacementDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.monetizationService.applyFeaturedPlacement(user.sub, dto);
  }

  /**
   * Legacy Compatibility: Locality Sponsorship
   */
  @Post('locality-sponsorship')
  @UseGuards(JwtAuthGuard)
  async registerLocalitySponsorship(
    @Body() dto: LocalitySponsorshipDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.monetizationService.registerLocalitySponsorship(user.sub, dto);
  }

  // ==========================================
  // ADMIN CRM & COMMERCIAL CONSOLE ENDPOINTS
  // ==========================================

  /**
   * Admin CRM: Get Paginated Leads
   */
  @Get('admin/leads')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getAdminLeads(
    @Query('status') status?: LeadStatus,
    @Query('source') source?: LeadSource,
    @Query('leadType') leadType?: LeadType,
    @Query('assignedToId') assignedToId?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.monetizationService.getLeads({
      status: status as any,
      source: source as any,
      leadType: leadType as any,
      assignedToId,
      search,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  /**
   * Admin CRM: Lead Details
   */
  @Get('admin/leads/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getAdminLeadById(@Param('id') id: string) {
    return this.monetizationService.getLeadById(id);
  }

  /**
   * Admin CRM: Update Lead Status
   */
  @Patch('admin/leads/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async updateAdminLeadStatus(
    @Param('id') id: string,
    @Body() dto: UpdateLeadStatusDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.monetizationService.updateLeadStatus(id, dto, user.sub);
  }

  /**
   * Admin CRM: Log Contact Attempt
   */
  @Post('admin/leads/:id/attempts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async logAdminContactAttempt(
    @Param('id') id: string,
    @Body() dto: LogContactAttemptDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.monetizationService.logContactAttempt(id, dto, user.sub);
  }

  /**
   * Admin CRM: Add Lead Note
   */
  @Post('admin/leads/:id/notes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async addAdminLeadNote(
    @Param('id') id: string,
    @Body() dto: AddLeadNoteDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.monetizationService.addLeadNote(id, dto, user.sub);
  }

  /**
   * Admin CRM: Assign Lead
   */
  @Patch('admin/leads/:id/assign')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async assignAdminLead(
    @Param('id') id: string,
    @Body() dto: AssignLeadDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.monetizationService.assignLead(id, dto, user.sub);
  }

  /**
   * Admin Campaigns: Create Campaign
   */
  @Post('admin/campaigns')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async createAdminCampaign(@Body() dto: CreateCampaignDto) {
    return this.monetizationService.createCampaign(dto);
  }

  /**
   * Admin Campaigns: List Campaigns
   */
  @Get('admin/campaigns')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getAdminCampaigns() {
    return this.monetizationService.getCampaigns();
  }

  /**
   * Admin Campaigns: Single Campaign Details
   */
  @Get('admin/campaigns/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getAdminCampaignById(@Param('id') id: string) {
    return this.monetizationService.getCampaignById(id);
  }

  /**
   * Admin Campaigns: Update Campaign
   */
  @Patch('admin/campaigns/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async updateAdminCampaign(@Param('id') id: string, @Body() dto: UpdateCampaignDto) {
    return this.monetizationService.updateCampaign(id, dto);
  }

  /**
   * Admin Campaigns: Add Variant
   */
  @Post('admin/campaigns/:id/variants')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async createAdminCampaignVariant(@Param('id') id: string, @Body() dto: CreateCampaignVariantDto) {
    return this.monetizationService.createCampaignVariant(id, dto);
  }

  /**
   * Admin Campaigns: Performance Stats
   */
  @Get('admin/campaigns/:id/performance')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getAdminCampaignPerformance(@Param('id') id: string) {
    return this.monetizationService.getCampaignPerformance(id);
  }

  /**
   * Admin Promo Codes: Create Promo Code
   */
  @Post('admin/promo-codes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async createAdminPromoCode(@Body() dto: CreatePromoCodeDto) {
    return this.monetizationService.createPromoCode(dto);
  }

  /**
   * Admin Promotions: Create Package
   */
  @Post('admin/promotions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async createAdminPromotion(@Body() dto: CreatePromotionDto) {
    return this.monetizationService.createPromotion(dto);
  }

  /**
   * Admin Plans: Create Plan
   */
  @Post('admin/plans')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async createAdminPlan(@Body() dto: CreateSubscriptionPlanDto) {
    return this.monetizationService.createSubscriptionPlan(dto);
  }

  /**
   * Admin Invoices: Process Refund
   */
  @Post('admin/invoices/:id/refund')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async processAdminRefund(
    @Param('id') id: string,
    @Body() dto: ProcessRefundDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.monetizationService.processRefund(id, dto, user.sub);
  }

  /**
   * Admin Commercial & Revenue Overview
   */
  @Get('admin/commercial/overview')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getAdminCommercialOverview() {
    return this.monetizationService.getCommercialOverview();
  }
}
