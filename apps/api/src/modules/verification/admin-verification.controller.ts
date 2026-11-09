import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { VerificationService } from './verification.service';
import { ReviewVerificationRequestDto } from './dto/verification.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole, VerificationStatus } from '@rental-peshawar/shared-types';

@Controller('admin/verifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class AdminVerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Get()
  async getVerifications(@Query('status') status?: VerificationStatus) {
    return this.verificationService.getVerificationsForAdmin(status);
  }

  @Post(':id/review')
  @HttpCode(HttpStatus.OK)
  async reviewVerification(
    @Param('id') id: string,
    @Body() dto: ReviewVerificationRequestDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.verificationService.reviewVerification(id, user.sub, dto);
  }
}
