import {
  Controller,
  Get,
  Post,
  Patch,
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
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MODERATOR)
export class AdminVerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Get()
  async getVerifications(@Query('status') status?: VerificationStatus) {
    return this.verificationService.getVerificationsForAdmin(status);
  }

  @Get(':id')
  async getVerificationDetail(@Param('id') id: string) {
    return this.verificationService.getVerificationById(id);
  }

  @Patch(':id/approve')
  async approveVerification(
    @Param('id') id: string,
    @CurrentUser() user: { sub: string },
    @Body('reviewNotes') reviewNotes?: string,
  ) {
    return this.verificationService.reviewVerification(id, user.sub, {
      status: VerificationStatus.VERIFIED,
      reviewNotes: reviewNotes || 'Identity verified by administrator',
    });
  }

  @Patch(':id/reject')
  async rejectVerification(
    @Param('id') id: string,
    @CurrentUser() user: { sub: string },
    @Body('reason') reason?: string,
    @Body('reviewNotes') reviewNotes?: string,
  ) {
    return this.verificationService.reviewVerification(id, user.sub, {
      status: VerificationStatus.REJECTED,
      reviewNotes: reason || reviewNotes || 'Documents rejected due to quality or mismatch.',
    });
  }

  @Patch(':id/expire')
  async expireVerification(
    @Param('id') id: string,
    @CurrentUser() user: { sub: string },
    @Body('reviewNotes') reviewNotes?: string,
  ) {
    return this.verificationService.reviewVerification(id, user.sub, {
      status: VerificationStatus.EXPIRED,
      reviewNotes: reviewNotes || 'Verification period expired.',
    });
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
