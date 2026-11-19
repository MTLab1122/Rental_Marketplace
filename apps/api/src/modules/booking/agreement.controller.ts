import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AgreementService } from './agreement.service';
import { SignAgreementRequestDto } from './dto/booking-request.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Request } from 'express';

@Controller('agreements')
@UseGuards(JwtAuthGuard)
export class AgreementController {
  constructor(private readonly agreementService: AgreementService) {}

  @Get('booking/:bookingId')
  async getAgreementForBooking(@Param('bookingId') bookingId: string) {
    const agreement = await this.agreementService.getOrCreateAgreementForBooking(bookingId);
    return { success: true, data: agreement };
  }

  @Get(':id')
  async getAgreementById(
    @Param('id') id: string,
    @CurrentUser() user: { sub: string; roles?: string[] },
  ) {
    const agreement = await this.agreementService.getAgreementById(id, user.sub, user.roles || []);
    return { success: true, data: agreement };
  }

  @Post(':id/sign')
  @HttpCode(HttpStatus.OK)
  async signAgreement(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: SignAgreementRequestDto,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || (req.headers['x-forwarded-for'] as string) || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'RentalAppClient/1.0';

    const agreement = await this.agreementService.signAgreement(id, userId, dto, {
      ipAddress,
      userAgent,
    });
    return { success: true, data: agreement };
  }
}
