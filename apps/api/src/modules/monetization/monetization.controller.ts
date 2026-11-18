import { Controller, Get, Post, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { MonetizationService } from './monetization.service';
import { FeatureListingPlacementDto, LocalitySponsorshipDto } from './monetization.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@rental-peshawar/shared-types';

@Controller('monetization')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MonetizationController {
  constructor(private readonly monetizationService: MonetizationService) {}

  /**
   * Promote property to Featured Placement
   */
  @Post('featured-placement')
  @Roles(UserRole.LANDLORD, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async applyFeaturedPlacement(
    @Body() dto: FeatureListingPlacementDto,
    @CurrentUser() user: { sub: string; roles: string[] },
  ) {
    const isAdmin =
      user.roles.includes(UserRole.ADMIN) || user.roles.includes(UserRole.SUPER_ADMIN);
    return this.monetizationService.applyFeaturedPlacement(user.sub, dto, isAdmin);
  }

  /**
   * Register locality sponsorship
   */
  @Post('locality-sponsorship')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.LANDLORD)
  @HttpCode(HttpStatus.OK)
  async registerLocalitySponsorship(
    @Body() dto: LocalitySponsorshipDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.monetizationService.registerLocalitySponsorship(user.sub, dto);
  }

  /**
   * Get landlord monetization & feature status
   */
  @Get('status')
  @Roles(UserRole.LANDLORD, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getStatus(@CurrentUser() user: { sub: string }) {
    return this.monetizationService.getMonetizationStatus(user.sub);
  }
}
