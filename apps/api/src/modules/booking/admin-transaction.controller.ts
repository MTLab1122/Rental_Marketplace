import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { BookingService } from './booking.service';
import { LedgerService } from './ledger.service';
import { DisputeService } from './dispute.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  UserRole,
  BookingStatus,
  DisputeStatus,
  DisputeCategory,
} from '@rental-peshawar/shared-types';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MODERATOR)
export class AdminTransactionController {
  constructor(
    private readonly bookingService: BookingService,
    private readonly ledgerService: LedgerService,
    private readonly disputeService: DisputeService,
  ) {}

  @Get('bookings')
  async getAllBookings(
    @Query('status') status?: BookingStatus,
    @Query('propertyId') propertyId?: string,
  ) {
    const bookings = await this.bookingService.getAllBookingsAdmin({ status, propertyId });
    return { success: true, data: bookings };
  }

  @Get('ledger')
  async getLedgerReconciliation(
    @Query('bookingId') bookingId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const report = await this.ledgerService.getReconciliationReport({
      bookingId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
    return { success: true, data: report };
  }

  @Post('ledger/adjust')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async postAdjustment(
    @CurrentUser('sub') adminId: string,
    @Body()
    dto: {
      bookingId?: string;
      paymentId?: string;
      amountPkr: number;
      description: string;
      reason: string;
    },
  ) {
    const entry = await this.ledgerService.recordAdjustment({
      adminId,
      bookingId: dto.bookingId,
      paymentId: dto.paymentId,
      amountPkr: dto.amountPkr,
      description: dto.description,
      reason: dto.reason,
    });
    return { success: true, data: entry };
  }

  @Get('disputes')
  async getAllDisputes(
    @Query('status') status?: DisputeStatus,
    @Query('category') category?: DisputeCategory,
  ) {
    const disputes = await this.disputeService.getAllDisputesAdmin({ status, category });
    return { success: true, data: disputes };
  }
}
