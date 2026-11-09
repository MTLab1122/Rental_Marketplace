import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { VerificationService } from './verification.service';
import { SubmitVerificationRequestDto } from './dto/verification.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@rental-peshawar/shared-types';

@Controller('landlord/verification')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.LANDLORD, UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class LandlordVerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Post()
  async submit(@Body() dto: SubmitVerificationRequestDto, @CurrentUser() user: { sub: string }) {
    return this.verificationService.submitVerification(user.sub, dto);
  }

  @Get()
  async getStatus(@CurrentUser() user: { sub: string }) {
    return this.verificationService.getLandlordVerification(user.sub);
  }
}
