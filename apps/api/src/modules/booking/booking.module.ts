import { Module, forwardRef } from '@nestjs/common';
import { BookingController } from './booking.controller';
import { AgreementController } from './agreement.controller';
import { DisputeController } from './dispute.controller';
import { AdminTransactionController } from './admin-transaction.controller';
import { BookingService } from './booking.service';
import { LedgerService } from './ledger.service';
import { AgreementService } from './agreement.service';
import { DisputeService } from './dispute.service';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { NotificationModule } from '../notification/notification.module';
import { PaymentModule } from '../payment/payment.module';

@Module({
  imports: [NotificationModule, forwardRef(() => PaymentModule)],
  controllers: [
    BookingController,
    AgreementController,
    DisputeController,
    AdminTransactionController,
  ],
  providers: [
    BookingService,
    LedgerService,
    AgreementService,
    DisputeService,
    PrismaService,
    AuditService,
  ],
  exports: [BookingService, LedgerService, AgreementService, DisputeService],
})
export class BookingModule {}
