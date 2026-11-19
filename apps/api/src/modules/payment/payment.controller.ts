import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Headers,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import {
  CreatePaymentIntentRequestDto,
  SubmitManualSlipRequestDto,
  VerifyManualPaymentRequestDto,
  RefundRequestDto,
} from '../booking/dto/booking-request.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@rental-peshawar/shared-types';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('intent')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createPaymentIntent(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreatePaymentIntentRequestDto,
  ) {
    const intent = await this.paymentService.createPaymentIntent(userId, dto);
    return { success: true, data: intent };
  }

  @Post('manual-slip')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async submitManualSlip(
    @CurrentUser('sub') userId: string,
    @Body() dto: SubmitManualSlipRequestDto,
  ) {
    const payment = await this.paymentService.submitManualPaymentSlip(userId, dto.bookingId, dto);
    return { success: true, data: payment };
  }

  @Post(':id/verify-manual')
  @UseGuards(JwtAuthGuard)
  async verifyManualPayment(
    @Param('id') id: string,
    @CurrentUser('sub') verifierId: string,
    @Body() dto: VerifyManualPaymentRequestDto,
  ) {
    const payment = await this.paymentService.verifyManualPayment(verifierId, id, dto);
    return { success: true, data: payment };
  }

  @Post('webhook/:provider')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Param('provider') provider: string,
    @Body() payload: any,
    @Headers('x-signature') signatureHeader?: string,
    @Headers('stripe-signature') stripeSignature?: string,
  ) {
    const sig = signatureHeader || stripeSignature || '';
    const result = await this.paymentService.handleWebhook(provider, payload, sig);
    return result;
  }

  @Post(':id/refund')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async refundPayment(
    @Param('id') id: string,
    @CurrentUser('sub') adminId: string,
    @Body() dto: RefundRequestDto,
  ) {
    const refund = await this.paymentService.processRefund(adminId, id, dto.amountPkr, dto.reason);
    return { success: true, data: refund };
  }

  @Get('receipts/:receiptNumber')
  async getReceipt(@Param('receiptNumber') receiptNumber: string) {
    const receipt = await this.paymentService.getReceiptByNumber(receiptNumber);
    return { success: true, data: receipt };
  }

  @Get(':id/receipt')
  @UseGuards(JwtAuthGuard)
  async getReceiptByPaymentId(@Param('id') id: string) {
    const receipt = await this.paymentService.getReceiptByPaymentId(id);
    return { success: true, data: receipt };
  }
}
