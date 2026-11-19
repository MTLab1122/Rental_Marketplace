import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { NotificationService } from '../notification/notification.service';
import { LedgerService } from '../booking/ledger.service';
import { PaymentProviderFactory } from './providers/payment-provider.factory';
import {
  CreatePaymentIntentDto,
  ManualPaymentVerificationDto,
  PaymentStatus,
  BookingStatus,
  NotificationType,
  LedgerEntryType,
  PaymentMethodType,
} from '@rental-peshawar/shared-types';
import { Prisma } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly notificationService: NotificationService,
    private readonly ledgerService: LedgerService,
    private readonly providerFactory: PaymentProviderFactory,
  ) {}

  /**
   * Initializes a payment intent for a booking.
   */
  async createPaymentIntent(userId: string, dto: CreatePaymentIntentDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: dto.bookingId },
      include: { tenant: true, landlord: true, property: true },
    });

    if (!booking) {
      throw new NotFoundException(`Booking ${dto.bookingId} not found`);
    }

    if (booking.tenantId !== userId) {
      throw new ForbiddenException('Only the booking tenant can initialize payments');
    }

    if (
      booking.status !== BookingStatus.AWAITING_PAYMENT &&
      booking.status !== BookingStatus.REQUESTED &&
      booking.status !== BookingStatus.PAYMENT_PENDING
    ) {
      throw new BadRequestException(`Booking cannot accept payment in status: ${booking.status}`);
    }

    // Amount validation
    const expectedInitialAmount = Number(booking.totalInitialAmountPkr);
    if (dto.amountPkr && Math.abs(dto.amountPkr - expectedInitialAmount) > 0.01) {
      throw new BadRequestException(
        `Amount mismatch: expected PKR ${expectedInitialAmount}, got PKR ${dto.amountPkr}`,
      );
    }

    const amountToCharge = dto.amountPkr || expectedInitialAmount;
    const idempotencyKey = dto.idempotencyKey || `idem_${crypto.randomUUID()}`;

    // Check for existing active payment intent with same idempotency key
    const existingIntent = await this.prisma.paymentIntent.findUnique({
      where: { idempotencyKey },
    });

    if (existingIntent) {
      return {
        paymentIntentId: existingIntent.id,
        clientSecret: existingIntent.clientSecret,
        status: existingIntent.status,
        amountPkr: Number(existingIntent.amountPkr),
        expiresAt: existingIntent.expiresAt,
      };
    }

    const provider = this.providerFactory.getProvider(dto.paymentMethodType);
    const intentResult = await provider.createPaymentIntent({
      amountPkr: amountToCharge,
      currency: 'PKR',
      bookingId: booking.id,
      userId,
      idempotencyKey,
      metadata: dto.metadata,
    });

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hour expiry

    const paymentIntent = await this.prisma.paymentIntent.create({
      data: {
        bookingId: booking.id,
        userId,
        amountPkr: new Prisma.Decimal(amountToCharge),
        currency: 'PKR',
        paymentMethodType: dto.paymentMethodType,
        idempotencyKey,
        clientSecret: intentResult.clientSecret,
        status: intentResult.status,
        expiresAt,
        metadata: {
          ...dto.metadata,
          provider: provider.providerName,
          instructions: intentResult.instructions,
          redirectUrl: intentResult.redirectUrl,
        },
      },
    });

    // Update booking to PAYMENT_PENDING
    await this.prisma.booking.update({
      where: { id: booking.id },
      data: { status: BookingStatus.PAYMENT_PENDING },
    });

    return {
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.clientSecret,
      status: paymentIntent.status,
      amountPkr: Number(paymentIntent.amountPkr),
      expiresAt: paymentIntent.expiresAt,
      instructions: intentResult.instructions,
      redirectUrl: intentResult.redirectUrl,
    };
  }

  /**
   * Submits offline/manual bank transfer slip for verification.
   */
  async submitManualPaymentSlip(
    userId: string,
    bookingId: string,
    dto: {
      bankName: string;
      transactionReference: string;
      slipUrl: string;
      amountPkr: number;
      accountTitle?: string;
    },
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { tenant: true, landlord: true },
    });

    if (!booking) {
      throw new NotFoundException(`Booking ${bookingId} not found`);
    }

    if (booking.tenantId !== userId) {
      throw new ForbiddenException('Only the booking tenant can submit payment slips');
    }

    // Check duplicate transaction reference
    const duplicateTx = await this.prisma.transaction.findUnique({
      where: { transactionReference: dto.transactionReference },
    });
    if (duplicateTx) {
      throw new ConflictException(
        `Transaction reference ${dto.transactionReference} has already been submitted`,
      );
    }

    // Create payment in PENDING status
    const payment = await this.prisma.payment.create({
      data: {
        bookingId: booking.id,
        payerId: userId,
        recipientId: booking.landlordId,
        amountPkr: new Prisma.Decimal(dto.amountPkr),
        currency: 'PKR',
        status: PaymentStatus.PENDING,
        paymentMethodType: PaymentMethodType.MANUAL_BANK_TRANSFER,
        provider: 'manual_bank_transfer',
        providerTransactionId: dto.transactionReference,
        receiptUrl: dto.slipUrl,
        metadata: {
          bankName: dto.bankName,
          accountTitle: dto.accountTitle,
          submittedAt: new Date().toISOString(),
        },
      },
    });

    // Notify landlord and admins
    await this.notificationService.notify(
      booking.landlordId,
      NotificationType.PAYMENT_RECEIVED,
      'Bank Transfer Slip Submitted',
      `${booking.tenant.fullName} has uploaded a bank transfer slip (Ref: ${dto.transactionReference}) for verification.`,
      { bookingId: booking.id, paymentId: payment.id },
    );

    await this.auditService.log({
      actorId: userId,
      action: 'PAYMENT_SLIP_SUBMITTED',
      targetType: 'PAYMENT',
      targetId: payment.id,
      after: {
        bookingId: booking.id,
        transactionReference: dto.transactionReference,
        amountPkr: dto.amountPkr,
      },
    });

    return payment;
  }

  /**
   * Verifies manual payment slip (Landlord or Admin action).
   */
  async verifyManualPayment(
    verifierId: string,
    paymentId: string,
    dto: ManualPaymentVerificationDto,
  ) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        booking: {
          include: { tenant: true, landlord: true, property: true },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException(`Payment ${paymentId} not found`);
    }

    if (payment.status === PaymentStatus.SUCCEEDED) {
      return payment; // Idempotent return
    }

    if (!dto.approved) {
      const updated = await this.prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.FAILED,
          metadata: {
            ...((payment.metadata as Record<string, any>) || {}),
            rejectionReason: dto.rejectionReason,
            verifiedById: verifierId,
            verifiedAt: new Date().toISOString(),
          },
        },
      });

      await this.notificationService.notify(
        payment.payerId,
        NotificationType.SYSTEM,
        'Payment Slip Rejected',
        `Your payment slip for booking ${payment.bookingId} was rejected. Reason: ${dto.rejectionReason || 'Details mismatch'}`,
        { paymentId, bookingId: payment.bookingId },
      );

      return updated;
    }

    // Approved: Execute confirmation transaction
    return this.completeSuccessfulPayment({
      paymentId,
      booking: payment.booking,
      payerId: payment.payerId,
      recipientId: payment.recipientId,
      amountPkr: Number(payment.amountPkr),
      providerTransactionId: payment.providerTransactionId || `ibft_${payment.id.substring(0, 8)}`,
      providerName: 'manual_bank_transfer',
      verifierId,
    });
  }

  /**
   * Handles incoming webhooks (JazzCash, Easypaisa, Stripe).
   */
  async handleWebhook(providerName: string, payload: any, signature: string) {
    const provider = this.providerFactory.getProvider(providerName);
    const verification = await provider.verifyWebhook(payload, signature);

    if (!verification.isValid) {
      this.logger.warn(`Invalid signature received on webhook for ${providerName}`);
      throw new BadRequestException('Invalid webhook signature');
    }

    // Check duplicate transaction reference to prevent double crediting
    const existingTx = await this.prisma.transaction.findUnique({
      where: { transactionReference: verification.providerTransactionId },
    });
    if (existingTx) {
      this.logger.log(`Webhook already processed for tx ${verification.providerTransactionId}`);
      return { received: true, duplicate: true };
    }

    if (verification.status === PaymentStatus.SUCCEEDED) {
      // Find corresponding payment intent or booking
      const bookingId = payload.bookingId || payload.pp_MerchantRef || payload.orderRefNumber;
      if (!bookingId) {
        throw new BadRequestException('Booking ID missing from webhook payload');
      }

      const booking = await this.prisma.booking.findUnique({
        where: { id: bookingId },
        include: { tenant: true, landlord: true, property: true },
      });

      if (!booking) {
        throw new NotFoundException(`Booking ${bookingId} not found`);
      }

      // Create payment and record completion
      const payment = await this.prisma.payment.create({
        data: {
          bookingId: booking.id,
          payerId: booking.tenantId,
          recipientId: booking.landlordId,
          amountPkr: new Prisma.Decimal(verification.amountPkr),
          currency: verification.currency,
          status: PaymentStatus.PENDING,
          paymentMethodType: PaymentMethodType.JAZZCASH,
          provider: providerName,
          providerTransactionId: verification.providerTransactionId,
        },
      });

      await this.completeSuccessfulPayment({
        paymentId: payment.id,
        booking,
        payerId: booking.tenantId,
        recipientId: booking.landlordId,
        amountPkr: verification.amountPkr,
        providerTransactionId: verification.providerTransactionId,
        providerName,
        rawPayload: payload,
      });
    }

    return { received: true, status: verification.status };
  }

  /**
   * Completes a successful payment:
   * 1. Updates Payment to SUCCEEDED
   * 2. Writes Transaction log
   * 3. Writes immutable Ledger entries (Security Deposit & Rent)
   * 4. Generates sequential Receipt
   * 5. Locks Property availability (isAvailable = false) to prevent double booking!
   * 6. Updates Booking to CONFIRMED
   * 7. Dispatches notifications & audits
   */
  private async completeSuccessfulPayment(params: {
    paymentId: string;
    booking: any;
    payerId: string;
    recipientId: string;
    amountPkr: number;
    providerTransactionId: string;
    providerName: string;
    verifierId?: string;
    rawPayload?: any;
  }) {
    const {
      paymentId,
      booking,
      payerId,
      recipientId,
      amountPkr,
      providerTransactionId,
      providerName,
    } = params;

    return this.prisma
      .$transaction(async (tx) => {
        // 1. Update payment
        const payment = await tx.payment.update({
          where: { id: paymentId },
          data: {
            status: PaymentStatus.SUCCEEDED,
            providerTransactionId,
          },
        });

        // 2. Record transaction
        await tx.transaction.create({
          data: {
            paymentId,
            provider: providerName,
            transactionReference: providerTransactionId,
            amountPkr: new Prisma.Decimal(amountPkr),
            status: 'SUCCESS',
            rawPayload: params.rawPayload
              ? (params.rawPayload as Prisma.InputJsonValue)
              : undefined,
            verifiedAt: new Date(),
          },
        });

        // 3. Generate sequential receipt
        const receiptNumber = `REC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
        const receipt = await tx.receipt.create({
          data: {
            paymentId,
            receiptNumber,
            metadata: {
              bookingId: booking.id,
              propertyTitle: booking.property?.title,
              amountPkr,
              paidAt: new Date().toISOString(),
            },
          },
        });

        // 4. Lock property availability immediately to prevent any concurrent double-booking!
        await tx.property.update({
          where: { id: booking.propertyId },
          data: { isAvailable: false },
        });

        // 5. Update booking status to CONFIRMED
        const updatedBooking = await tx.booking.update({
          where: { id: booking.id },
          data: {
            status: BookingStatus.CONFIRMED,
            confirmedAt: new Date(),
          },
        });

        // 6. Record immutable ledger entries
        const securityDeposit = Number(booking.securityDepositPkr);
        const rentPortion = Math.max(0, amountPkr - securityDeposit);

        if (securityDeposit > 0) {
          await tx.ledgerEntry.create({
            data: {
              bookingId: booking.id,
              paymentId,
              type: LedgerEntryType.DEPOSIT_HOLD,
              debitAccount: 'ESCROW_BANK_ACCOUNT',
              creditAccount: 'ESCROW_DEPOSIT_LIABILITY',
              amountPkr: new Prisma.Decimal(securityDeposit),
              description: `Security deposit held for booking ${booking.id}`,
              isImmutable: true,
            },
          });
        }

        if (rentPortion > 0) {
          await tx.ledgerEntry.create({
            data: {
              bookingId: booking.id,
              paymentId,
              type: LedgerEntryType.RENT_PAYMENT,
              debitAccount: 'ESCROW_BANK_ACCOUNT',
              creditAccount: 'LANDLORD_PAYABLE',
              amountPkr: new Prisma.Decimal(rentPortion),
              description: `Initial advance rent for booking ${booking.id}`,
              isImmutable: true,
            },
          });
        }

        return { payment, booking: updatedBooking, receipt };
      })
      .then(async (result) => {
        // Post-transaction notifications and audit
        await this.notificationService.notify(
          payerId,
          NotificationType.PAYMENT_RECEIVED,
          'Payment Confirmed & Receipt Issued',
          `Your payment of PKR ${amountPkr.toLocaleString()} has been confirmed. Booking is now CONFIRMED. Receipt #${result.receipt.receiptNumber}.`,
          { bookingId: booking.id, receiptNumber: result.receipt.receiptNumber },
        );

        await this.notificationService.notify(
          recipientId,
          NotificationType.BOOKING_STATUS_CHANGED,
          'Payment Received for Booking',
          `Booking ${booking.id} is confirmed with paid advance/deposit of PKR ${amountPkr.toLocaleString()}.`,
          { bookingId: booking.id, status: BookingStatus.CONFIRMED },
        );

        await this.auditService.log({
          actorId: params.verifierId || payerId,
          action: 'PAYMENT_COMPLETED',
          targetType: 'PAYMENT',
          targetId: paymentId,
          after: {
            bookingId: booking.id,
            amountPkr,
            receiptNumber: result.receipt.receiptNumber,
          },
        });

        return result.payment;
      });
  }

  /**
   * Processes a refund for an existing payment.
   */
  async processRefund(adminId: string, paymentId: string, amountPkr: number, reason: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { booking: true },
    });

    if (!payment) {
      throw new NotFoundException(`Payment ${paymentId} not found`);
    }

    if (payment.status !== PaymentStatus.SUCCEEDED) {
      throw new BadRequestException('Only SUCCEEDED payments can be refunded');
    }

    if (amountPkr <= 0 || amountPkr > Number(payment.amountPkr)) {
      throw new BadRequestException(`Refund amount must be between 1 and ${payment.amountPkr}`);
    }

    const provider = this.providerFactory.getProvider(payment.provider);
    const refundResult = await provider.processRefund({
      paymentId,
      providerTransactionId: payment.providerTransactionId || undefined,
      amountPkr,
      reason,
    });

    // Record refund record and ledger entry
    const refund = await this.prisma.refund.create({
      data: {
        paymentId,
        bookingId: payment.bookingId,
        amountPkr: new Prisma.Decimal(amountPkr),
        reason,
        status: refundResult.status,
        adminId,
      },
    });

    await this.ledgerService.recordEntry({
      bookingId: payment.bookingId,
      paymentId,
      type: LedgerEntryType.REFUND,
      debitAccount: 'ESCROW_LIABILITY',
      creditAccount: 'ESCROW_BANK_ACCOUNT',
      amountPkr,
      description: `Refund of PKR ${amountPkr} for payment ${paymentId}. Reason: ${reason}`,
      metadata: { adminId, refundId: refund.id },
    });

    // If fully refunded, release property availability
    if (amountPkr >= Number(payment.amountPkr)) {
      await this.prisma.booking.update({
        where: { id: payment.bookingId },
        data: { status: BookingStatus.REFUNDED },
      });

      await this.prisma.property.update({
        where: { id: payment.booking.propertyId },
        data: { isAvailable: true },
      });
    }

    // Notify tenant
    await this.notificationService.notify(
      payment.payerId,
      NotificationType.SYSTEM,
      'Payment Refund Processed',
      `A refund of PKR ${amountPkr.toLocaleString()} has been processed for booking ${payment.bookingId}.`,
      { refundId: refund.id, bookingId: payment.bookingId },
    );

    await this.auditService.log({
      actorId: adminId,
      action: 'PAYMENT_REFUNDED',
      targetType: 'PAYMENT',
      targetId: paymentId,
      after: {
        refundId: refund.id,
        amountPkr,
        reason,
      },
    });

    return refund;
  }

  async getReceiptByPaymentId(paymentId: string) {
    const receipt = await this.prisma.receipt.findUnique({
      where: { paymentId },
      include: {
        payment: {
          include: {
            booking: {
              include: {
                property: { select: { id: true, title: true, address: true } },
                tenant: { select: { id: true, fullName: true, email: true, phoneNumber: true } },
                landlord: { select: { id: true, fullName: true, email: true, phoneNumber: true } },
              },
            },
          },
        },
      },
    });

    if (!receipt) {
      throw new NotFoundException(`Receipt for payment ${paymentId} not found`);
    }

    return receipt;
  }

  async getReceiptByNumber(receiptNumber: string) {
    const receipt = await this.prisma.receipt.findUnique({
      where: { receiptNumber },
      include: {
        payment: {
          include: {
            booking: {
              include: {
                property: { select: { id: true, title: true, address: true } },
                tenant: { select: { id: true, fullName: true, email: true } },
                landlord: { select: { id: true, fullName: true, email: true } },
              },
            },
          },
        },
      },
    });

    if (!receipt) {
      throw new NotFoundException(`Receipt ${receiptNumber} not found`);
    }

    return receipt;
  }
}
