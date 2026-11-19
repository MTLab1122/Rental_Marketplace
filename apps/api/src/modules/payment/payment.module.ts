import { Module, forwardRef } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { PaymentProviderFactory } from './providers/payment-provider.factory';
import { ManualBankTransferProvider } from './providers/manual-bank-transfer.provider';
import { JazzCashProvider } from './providers/jazzcash.provider';
import { EasypaisaProvider } from './providers/easypaisa.provider';
import { StripeProvider } from './providers/stripe.provider';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { NotificationModule } from '../notification/notification.module';
import { BookingModule } from '../booking/booking.module';

@Module({
  imports: [NotificationModule, forwardRef(() => BookingModule)],
  controllers: [PaymentController],
  providers: [
    PaymentService,
    PaymentProviderFactory,
    ManualBankTransferProvider,
    JazzCashProvider,
    EasypaisaProvider,
    StripeProvider,
    PrismaService,
    AuditService,
  ],
  exports: [PaymentService, PaymentProviderFactory],
})
export class PaymentModule {}
