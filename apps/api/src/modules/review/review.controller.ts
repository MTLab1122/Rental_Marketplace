import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ReviewService } from './review.service';
import { ReputationService } from './reputation.service';
import {
  CreateReviewDto,
  UpdateReviewDto,
  CreateReviewReplyDto,
  ReportReviewDto,
  ModerateReviewDto,
  QueryReviewsDto,
} from './dto/review.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@rental-peshawar/shared-types';
import { Request } from 'express';

@Controller()
export class ReviewController {
  constructor(
    private readonly reviewService: ReviewService,
    private readonly reputationService: ReputationService,
  ) {}

  /**
   * Submit Review for a Property
   * Only tenants with an accepted inquiry can review.
   */
  @Post('properties/:id/reviews')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TENANT, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async createReview(
    @Param('id') propertyId: string,
    @Body() dto: CreateReviewDto,
    @CurrentUser() user: { sub: string },
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.reviewService.createReview(user.sub, propertyId, dto, ipAddress, userAgent);
  }

  /**
   * Public list of approved reviews and rating breakdown for a property
   */
  @Get('properties/:id/reviews')
  async getPropertyReviews(@Param('id') propertyId: string, @Query() query: QueryReviewsDto) {
    return this.reviewService.getPropertyReviews(propertyId, query);
  }

  /**
   * Get all reviews written by the currently authenticated tenant
   */
  @Get('reviews/my')
  @UseGuards(JwtAuthGuard)
  async getMyReviews(@CurrentUser() user: { sub: string }) {
    return this.reviewService.getTenantReviews(user.sub);
  }

  /**
   * Edit a review (72h window strictly enforced)
   */
  @Patch('reviews/:id')
  @UseGuards(JwtAuthGuard)
  async updateReview(
    @Param('id') reviewId: string,
    @Body() dto: UpdateReviewDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.reviewService.updateReview(user.sub, reviewId, dto);
  }

  /**
   * Delete a review (72h window strictly enforced)
   */
  @Delete('reviews/:id')
  @UseGuards(JwtAuthGuard)
  async deleteReview(@Param('id') reviewId: string, @CurrentUser() user: { sub: string }) {
    return this.reviewService.deleteReview(user.sub, reviewId);
  }

  /**
   * Landlord reply to a review (once per review, own property only)
   */
  @Post('reviews/:id/reply')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.LANDLORD, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async replyToReview(
    @Param('id') reviewId: string,
    @Body() dto: CreateReviewReplyDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.reviewService.replyToReview(user.sub, reviewId, dto);
  }

  /**
   * Community report against an abusive or fraudulent review
   */
  @Post('reviews/:id/report')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async reportReview(
    @Param('id') reviewId: string,
    @Body() dto: ReportReviewDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.reviewService.reportReview(user.sub, reviewId, dto);
  }

  /**
   * Admin Review Moderation Queue
   */
  @Get('admin/reviews')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MODERATOR)
  async getAdminReviews(@Query() query: QueryReviewsDto) {
    return this.reviewService.getAdminReviews(query);
  }

  /**
   * Admin Review Moderation Action (APPROVE, REJECT, HIDE, RESTORE, REMOVE)
   */
  @Patch('admin/reviews/:id/moderate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MODERATOR)
  async moderateReview(
    @Param('id') reviewId: string,
    @Body() dto: ModerateReviewDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.reviewService.moderateReview(user.sub, reviewId, dto);
  }

  /**
   * Public Landlord Reputation & Trust Profile
   */
  @Get('landlords/:id/reputation')
  async getLandlordReputation(@Param('id') landlordId: string) {
    return this.reputationService.calculateLandlordReputation(landlordId);
  }

  /**
   * Property Quality Score & Trust Badges
   */
  @Get('properties/:id/quality')
  async getPropertyQuality(@Param('id') propertyId: string) {
    return this.reputationService.calculatePropertyQuality(propertyId);
  }

  /**
   * Admin Trigger: Generate Daily Reputation Snapshots
   */
  @Post('admin/reputation/snapshots')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async triggerDailySnapshots() {
    return this.reputationService.generateDailySnapshots();
  }
}
