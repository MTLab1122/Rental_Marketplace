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
import { DisputeService } from './dispute.service';
import {
  CreateDisputeRequestDto,
  DisputeMessageRequestDto,
  ResolveDisputeRequestDto,
} from './dto/booking-request.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@rental-peshawar/shared-types';

@Controller('disputes')
@UseGuards(JwtAuthGuard)
export class DisputeController {
  constructor(private readonly disputeService: DisputeService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createDispute(@CurrentUser('sub') userId: string, @Body() dto: CreateDisputeRequestDto) {
    const dispute = await this.disputeService.createDispute(userId, dto);
    return { success: true, data: dispute };
  }

  @Get('my')
  async getMyDisputes(@CurrentUser('sub') userId: string) {
    const disputes = await this.disputeService.getDisputesForUser(userId);
    return { success: true, data: disputes };
  }

  @Get(':id')
  async getDisputeById(
    @Param('id') id: string,
    @CurrentUser() user: { sub: string; roles?: string[] },
  ) {
    const dispute = await this.disputeService.getDisputeById(id, user.sub, user.roles || []);
    return { success: true, data: dispute };
  }

  @Post(':id/messages')
  @HttpCode(HttpStatus.CREATED)
  async addMessage(
    @Param('id') id: string,
    @CurrentUser() user: { sub: string; roles?: string[] },
    @Body() dto: DisputeMessageRequestDto,
  ) {
    const message = await this.disputeService.addMessage(
      id,
      user.sub,
      dto.message,
      dto.attachmentUrls,
      user.roles,
    );
    return { success: true, data: message };
  }

  @Patch(':id/resolve')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MODERATOR)
  async resolveDispute(
    @Param('id') id: string,
    @CurrentUser('sub') adminId: string,
    @Body() dto: ResolveDisputeRequestDto,
  ) {
    const dispute = await this.disputeService.resolveDispute(id, adminId, dto);
    return { success: true, data: dispute };
  }
}
