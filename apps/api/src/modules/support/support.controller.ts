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
} from '@nestjs/common';
import { SupportService } from './support.service';
import {
  CreateTicketDto,
  AddTicketMessageDto,
  UpdateTicketStatusDto,
  SubmitAppealDto,
  TakedownListingDto,
} from './support.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@rental-peshawar/shared-types';

@Controller('support')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  /**
   * Create a support ticket
   */
  @Post('tickets')
  @HttpCode(HttpStatus.CREATED)
  async createTicket(@Body() dto: CreateTicketDto, @CurrentUser() user: { sub: string }) {
    return this.supportService.createTicket(user.sub, dto);
  }

  /**
   * List tickets
   */
  @Get('tickets')
  async getTickets(
    @CurrentUser() user: { sub: string; roles: string[] },
    @Query('status') status?: string,
  ) {
    const isAdmin =
      user.roles.includes(UserRole.ADMIN) ||
      user.roles.includes(UserRole.SUPER_ADMIN) ||
      user.roles.includes(UserRole.SUPPORT);
    return this.supportService.getTickets(user.sub, isAdmin, status);
  }

  /**
   * Get ticket by ID
   */
  @Get('tickets/:id')
  async getTicket(@Param('id') id: string, @CurrentUser() user: { sub: string; roles: string[] }) {
    const isAdmin =
      user.roles.includes(UserRole.ADMIN) ||
      user.roles.includes(UserRole.SUPER_ADMIN) ||
      user.roles.includes(UserRole.SUPPORT);
    return this.supportService.getTicketById(id, user.sub, isAdmin);
  }

  /**
   * Add message to ticket thread
   */
  @Post('tickets/:id/messages')
  @HttpCode(HttpStatus.OK)
  async addMessage(
    @Param('id') id: string,
    @Body() dto: AddTicketMessageDto,
    @CurrentUser() user: { sub: string; roles: string[] },
  ) {
    const isAdmin =
      user.roles.includes(UserRole.ADMIN) ||
      user.roles.includes(UserRole.SUPER_ADMIN) ||
      user.roles.includes(UserRole.SUPPORT);
    return this.supportService.addTicketMessage(id, user.sub, dto, isAdmin);
  }

  /**
   * Update ticket status (Admin / Support only)
   */
  @Patch('tickets/:id/status')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SUPPORT)
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateTicketStatusDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.supportService.updateTicketStatus(id, user.sub, dto);
  }

  /**
   * Submit an official appeal against suspensions or rejections
   */
  @Post('appeals')
  @HttpCode(HttpStatus.CREATED)
  async submitAppeal(@Body() dto: SubmitAppealDto, @CurrentUser() user: { sub: string }) {
    return this.supportService.submitAppeal(user.sub, dto);
  }

  /**
   * Listing takedown workflow (Admin / Moderator only)
   */
  @Post('listings/takedown')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MODERATOR)
  @HttpCode(HttpStatus.OK)
  async takedownListing(@Body() dto: TakedownListingDto, @CurrentUser() user: { sub: string }) {
    return this.supportService.takedownListing(user.sub, dto);
  }
}
