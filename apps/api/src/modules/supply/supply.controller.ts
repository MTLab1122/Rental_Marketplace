import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SupplyService } from './supply.service';
import { InviteLandlordDto, ImportPropertiesBatchDto } from './supply.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@rental-peshawar/shared-types';

@Controller('supply')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SupplyController {
  constructor(private readonly supplyService: SupplyService) {}

  /**
   * Invite a new landlord or hostel manager
   */
  @Post('invitations')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.LANDLORD)
  @HttpCode(HttpStatus.OK)
  async inviteLandlord(@Body() dto: InviteLandlordDto, @CurrentUser() user: { sub: string }) {
    return this.supplyService.inviteLandlord(dto, user.sub);
  }

  /**
   * Get personalized referral tracking link for landlords
   */
  @Get('referral-link')
  @Roles(UserRole.LANDLORD, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getReferralLink(@CurrentUser() user: { sub: string }) {
    return this.supplyService.getLandlordReferralLink(user.sub);
  }

  /**
   * Locality-specific supply targets and platform acquisition progress
   */
  @Get('targets')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MODERATOR)
  async getSupplyTargets() {
    return this.supplyService.getSupplyTargets();
  }

  /**
   * Bulk property import from verified internal operators
   */
  @Post('import-batch')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async importBatch(@Body() dto: ImportPropertiesBatchDto, @CurrentUser() user: { sub: string }) {
    return this.supplyService.importPropertiesBatch(dto, user.sub);
  }

  /**
   * Comprehensive listing-quality checklist and publish readiness
   */
  @Get('quality-check/:propertyId')
  @Roles(UserRole.LANDLORD, UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MODERATOR)
  async getQualityCheck(@Param('propertyId') propertyId: string) {
    return this.supplyService.calculateListingQuality(propertyId);
  }
}
