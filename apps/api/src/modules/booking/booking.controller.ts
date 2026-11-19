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
import { BookingService } from './booking.service';
import {
  CreateBookingRequestDto,
  UpdateBookingStatusRequestDto,
  CancelBookingRequestDto,
} from './dto/booking-request.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('bookings')
@UseGuards(JwtAuthGuard)
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createBooking(@CurrentUser('sub') tenantId: string, @Body() dto: CreateBookingRequestDto) {
    const booking = await this.bookingService.createBookingRequest(tenantId, dto);
    return { success: true, data: booking };
  }

  @Get('my')
  async getMyBookings(
    @CurrentUser('sub') userId: string,
    @Query('role') role?: 'TENANT' | 'LANDLORD',
  ) {
    const bookings = await this.bookingService.getUserBookings(userId, role);
    return { success: true, data: bookings };
  }

  @Get(':id')
  async getBookingById(
    @Param('id') id: string,
    @CurrentUser() user: { sub: string; roles?: string[] },
  ) {
    const booking = await this.bookingService.getBookingById(id, user.sub, user.roles || []);
    return { success: true, data: booking };
  }

  @Patch(':id/status')
  async updateBookingStatus(
    @Param('id') id: string,
    @CurrentUser('sub') landlordId: string,
    @Body() dto: UpdateBookingStatusRequestDto,
  ) {
    const booking = await this.bookingService.updateBookingStatus(id, landlordId, dto);
    return { success: true, data: booking };
  }

  @Post(':id/cancel')
  async cancelBooking(
    @Param('id') id: string,
    @CurrentUser('sub') tenantId: string,
    @Body() dto: CancelBookingRequestDto,
  ) {
    const booking = await this.bookingService.cancelBooking(id, tenantId, dto);
    return { success: true, data: booking };
  }

  @Post('cron/expire')
  async expireOverdue() {
    const result = await this.bookingService.expireOverdueBookings();
    return { success: true, data: result };
  }
}
