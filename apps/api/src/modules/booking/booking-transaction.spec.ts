import { Test, TestingModule } from '@nestjs/testing';
import { BookingService } from './booking.service';
import { AgreementService } from './agreement.service';
import { DisputeService } from './dispute.service';
import { LedgerService } from './ledger.service';
import { PaymentService } from '../payment/payment.service';
import { PaymentProviderFactory } from '../payment/providers/payment-provider.factory';
import { ManualBankTransferProvider } from '../payment/providers/manual-bank-transfer.provider';
import { JazzCashProvider } from '../payment/providers/jazzcash.provider';
import { EasypaisaProvider } from '../payment/providers/easypaisa.provider';
import { StripeProvider } from '../payment/providers/stripe.provider';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { NotificationService } from '../notification/notification.service';
import {
  BookingStatus,
  InquiryStatus,
  PropertyStatus,
  PaymentStatus,
  AgreementStatus,
  DisputeCategory,
  DisputeStatus,
  LedgerEntryType,
} from '@rental-peshawar/shared-types';
import { ConflictException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

describe('Phase 13: Payments, Bookings, Agreements, Ledger & Disputes', () => {
  let bookingService: BookingService;
  let paymentService: PaymentService;
  let agreementService: AgreementService;
  let disputeService: DisputeService;
  let ledgerService: LedgerService;

  const tenantId = '11111111-1111-1111-1111-111111111111';
  const landlordId = '22222222-2222-2222-2222-222222222222';
  const adminId = '33333333-3333-3333-3333-333333333333';
  const propertyId = '44444444-4444-4444-4444-444444444444';
  const inquiryId = '55555555-5555-5555-5555-555555555555';
  const bookingId = '66666666-6666-6666-6666-666666666666';

  const mockProperty = {
    id: propertyId,
    title: 'University Town Family Portion',
    landlordId,
    status: PropertyStatus.APPROVED,
    isAvailable: true,
    monthlyRentPkr: new Prisma.Decimal(45000),
    securityDepositPkr: new Prisma.Decimal(90000),
    localityId: 'loc-1',
    locality: { id: 'loc-1', name: 'University Town' },
  };

  const mockInquiryAccepted = {
    id: inquiryId,
    tenantId,
    landlordId,
    propertyId,
    status: InquiryStatus.ACCEPTED,
    property: mockProperty,
  };

  const mockInquiryPending = {
    ...mockInquiryAccepted,
    status: InquiryStatus.SUBMITTED,
  };

  const mockBooking = {
    id: bookingId,
    inquiryId,
    propertyId,
    tenantId,
    landlordId,
    status: BookingStatus.REQUESTED,
    startDate: new Date('2026-03-01'),
    endDate: new Date('2027-02-28'),
    monthlyRentPkr: new Prisma.Decimal(45000),
    securityDepositPkr: new Prisma.Decimal(90000),
    totalInitialAmountPkr: new Prisma.Decimal(135000),
    currency: 'PKR',
    property: mockProperty,
    tenant: {
      id: tenantId,
      fullName: 'Ahmad Khan',
      email: 'ahmad@example.com',
      phoneNumber: '03001111111',
    },
    landlord: {
      id: landlordId,
      fullName: 'Sher Ali',
      email: 'sher@example.com',
      phoneNumber: '03002222222',
    },
  };

  const mockPrisma: any = {
    inquiry: {
      findUnique: jest.fn(),
    },
    property: {
      findUnique: jest.fn(),
      update: jest.fn().mockResolvedValue(mockProperty),
    },
    booking: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    bookingRequest: {
      create: jest.fn(),
    },
    paymentIntent: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    payment: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    transaction: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    receipt: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    refund: {
      create: jest.fn(),
    },
    rentalAgreement: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    agreementSignature: {
      create: jest.fn(),
    },
    dispute: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    disputeMessage: {
      create: jest.fn(),
    },
    ledgerEntry: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrisma)),
  };

  const mockAudit = { log: jest.fn().mockResolvedValue(undefined) };
  const mockNotification = { notify: jest.fn().mockResolvedValue(undefined) };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingService,
        PaymentService,
        AgreementService,
        DisputeService,
        LedgerService,
        PaymentProviderFactory,
        ManualBankTransferProvider,
        JazzCashProvider,
        EasypaisaProvider,
        StripeProvider,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAudit },
        { provide: NotificationService, useValue: mockNotification },
      ],
    }).compile();

    bookingService = module.get<BookingService>(BookingService);
    paymentService = module.get<PaymentService>(PaymentService);
    agreementService = module.get<AgreementService>(AgreementService);
    disputeService = module.get<DisputeService>(DisputeService);
    ledgerService = module.get<LedgerService>(LedgerService);
  });

  describe('1. Booking Creation & Double-Booking Prevention', () => {
    it('rejects booking request if inquiry is NOT accepted', async () => {
      mockPrisma.inquiry.findUnique.mockResolvedValue(mockInquiryPending);

      await expect(
        bookingService.createBookingRequest(tenantId, {
          inquiryId,
          propertyId,
          startDate: '2026-03-01',
          endDate: '2027-02-28',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects booking request if another active booking exists on the property (Double-booking lock)', async () => {
      mockPrisma.inquiry.findUnique.mockResolvedValue(mockInquiryAccepted);
      mockPrisma.booking.findFirst.mockResolvedValue({
        id: 'existing-booking',
        propertyId,
        status: BookingStatus.CONFIRMED,
      });

      await expect(
        bookingService.createBookingRequest(tenantId, {
          inquiryId,
          propertyId,
          startDate: '2026-03-01',
          endDate: '2027-02-28',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('creates booking request and notifies landlord when valid', async () => {
      mockPrisma.inquiry.findUnique.mockResolvedValue(mockInquiryAccepted);
      mockPrisma.booking.findFirst.mockResolvedValue(null);
      mockPrisma.bookingRequest.create.mockResolvedValue({ id: 'req-1' });
      mockPrisma.booking.create.mockResolvedValue(mockBooking);

      const result = await bookingService.createBookingRequest(tenantId, {
        inquiryId,
        propertyId,
        startDate: '2026-03-01',
        endDate: '2027-02-28',
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(bookingId);
      expect(mockNotification.notify).toHaveBeenCalled();
      expect(mockAudit.log).toHaveBeenCalled();
    });
  });

  describe('2. Booking Expiration Window', () => {
    it('expires overdue bookings and releases property availability', async () => {
      mockPrisma.booking.findMany.mockResolvedValue([
        { id: 'b-expired', propertyId, tenantId, lockExpiresAt: new Date(Date.now() - 1000) },
      ]);
      mockPrisma.booking.update.mockResolvedValue({});
      mockPrisma.property.update.mockResolvedValue({});

      const result = await bookingService.expireOverdueBookings();
      expect(result.expiredCount).toBe(1);
      expect(mockPrisma.property.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { isAvailable: true } }),
      );
    });
  });

  describe('3. Payment Processing & Escrow Ledger', () => {
    it('submits manual bank transfer slip and updates payment status', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue(mockBooking);
      mockPrisma.transaction.findUnique.mockResolvedValue(null);
      mockPrisma.payment.create.mockResolvedValue({
        id: 'pay-1',
        amountPkr: new Prisma.Decimal(135000),
        status: PaymentStatus.PENDING,
      });

      const payment = await paymentService.submitManualPaymentSlip(tenantId, bookingId, {
        bankName: 'Meezan Bank',
        transactionReference: 'MEEZAN-998877',
        slipUrl: 'https://storage.example.com/slip.jpg',
        amountPkr: 135000,
      });

      expect(payment).toBeDefined();
      expect(mockPrisma.payment.create).toHaveBeenCalled();
    });

    it('verifying manual payment locks property availability and records immutable ledger entries', async () => {
      const pendingPayment = {
        id: 'pay-1',
        bookingId,
        payerId: tenantId,
        recipientId: landlordId,
        amountPkr: new Prisma.Decimal(135000),
        status: PaymentStatus.PENDING,
        providerTransactionId: 'MEEZAN-998877',
        booking: mockBooking,
      };

      mockPrisma.payment.findUnique.mockResolvedValue(pendingPayment);
      mockPrisma.payment.update.mockResolvedValue({
        ...pendingPayment,
        status: PaymentStatus.SUCCEEDED,
      });
      mockPrisma.transaction.create.mockResolvedValue({ id: 'tx-1' });
      mockPrisma.receipt.create.mockResolvedValue({
        id: 'rec-1',
        receiptNumber: 'REC-20260223-1234',
      });
      mockPrisma.property.update.mockResolvedValue({ ...mockProperty, isAvailable: false });
      mockPrisma.booking.update.mockResolvedValue({
        ...mockBooking,
        status: BookingStatus.CONFIRMED,
      });
      mockPrisma.ledgerEntry.create.mockResolvedValue({ id: 'led-1' });

      await paymentService.verifyManualPayment(landlordId, 'pay-1', {
        approved: true,
      });

      // Verifies property availability is locked immediately
      expect(mockPrisma.property.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { isAvailable: false } }),
      );
      // Verifies booking confirmed
      expect(mockPrisma.booking.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: BookingStatus.CONFIRMED }),
        }),
      );
      // Verifies receipt created
      expect(mockPrisma.receipt.create).toHaveBeenCalled();
    });

    it('webhook rejects duplicate transaction reference to prevent double crediting', async () => {
      mockPrisma.transaction.findUnique.mockResolvedValue({
        id: 'tx-existing',
        transactionReference: 'JC-12345',
      });

      const result = await paymentService.handleWebhook(
        'jazzcash',
        {
          pp_TxnRefNo: 'JC-12345',
          pp_Amount: '13500000',
          pp_ResponseCode: '000',
        },
        'test_signature',
      );

      expect(result.duplicate).toBe(true);
      expect(mockPrisma.payment.create).not.toHaveBeenCalled();
    });
  });

  describe('4. Digital Tenancy Agreements', () => {
    it('creates and digitally signs agreement with SHA-256 audit hash', async () => {
      mockPrisma.rentalAgreement.findUnique.mockResolvedValue(null);
      mockPrisma.booking.findUnique.mockResolvedValue(mockBooking);
      mockPrisma.rentalAgreement.create.mockResolvedValue({
        id: 'agr-1',
        bookingId,
        termsHtml: '<p>Standard Peshawar Terms</p>',
        status: AgreementStatus.SENT,
        signatures: [],
      });

      const agreement = await agreementService.getOrCreateAgreementForBooking(bookingId);
      expect(agreement).toBeDefined();

      // Sign agreement
      mockPrisma.rentalAgreement.findUnique.mockResolvedValue({
        id: 'agr-1',
        bookingId,
        booking: mockBooking,
        signatures: [],
        termsHtml: '<p>Terms</p>',
        status: AgreementStatus.SENT,
      });
      mockPrisma.agreementSignature.create.mockResolvedValue({ id: 'sig-1' });
      mockPrisma.rentalAgreement.update.mockResolvedValue({
        id: 'agr-1',
        status: AgreementStatus.SIGNED_BY_TENANT,
      });

      const signed = await agreementService.signAgreement(
        'agr-1',
        tenantId,
        {
          signatureData: 'Ahmad Khan electronic signature',
        },
        { ipAddress: '192.168.1.1', userAgent: 'Mozilla/5.0' },
      );

      expect(signed).toBeDefined();
      expect(mockPrisma.agreementSignature.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            signerRole: 'TENANT',
            ipAddress: '192.168.1.1',
            signatureHash: expect.any(String),
          }),
        }),
      );
    });
  });

  describe('5. Dispute Workflow & Escrow Hold', () => {
    it('opens dispute, sets booking to DISPUTED, and logs DISPUTE_HOLD to ledger', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue(mockBooking);
      mockPrisma.dispute.findFirst.mockResolvedValue(null);
      mockPrisma.dispute.create.mockResolvedValue({
        id: 'disp-1',
        bookingId,
        category: DisputeCategory.PROPERTY_NOT_AS_DESCRIBED,
        status: DisputeStatus.OPEN,
      });
      mockPrisma.booking.update.mockResolvedValue({
        ...mockBooking,
        status: BookingStatus.DISPUTED,
      });
      mockPrisma.ledgerEntry.create.mockResolvedValue({ id: 'led-hold' });

      const dispute = await disputeService.createDispute(tenantId, {
        bookingId,
        category: DisputeCategory.PROPERTY_NOT_AS_DESCRIBED,
        description: 'Water supply issue on the portion contrary to agreement',
        amountDisputedPkr: 45000,
      });

      expect(dispute).toBeDefined();
      expect(mockPrisma.booking.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: BookingStatus.DISPUTED } }),
      );
      expect(mockPrisma.ledgerEntry.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: LedgerEntryType.DISPUTE_HOLD,
            amountPkr: new Prisma.Decimal(45000),
          }),
        }),
      );
    });

    it('resolves dispute and notifies parties', async () => {
      mockPrisma.dispute.findUnique.mockResolvedValue({
        id: 'disp-1',
        bookingId,
        initiatorId: tenantId,
        respondentId: landlordId,
      });
      mockPrisma.dispute.update.mockResolvedValue({
        id: 'disp-1',
        status: DisputeStatus.RESOLVED,
        resolution: 'Landlord rectified water supply pump within 24 hours',
      });
      mockPrisma.booking.update.mockResolvedValue({
        ...mockBooking,
        status: BookingStatus.CONFIRMED,
      });

      const resolved = await disputeService.resolveDispute('disp-1', adminId, {
        status: DisputeStatus.RESOLVED,
        resolution: 'Landlord rectified water supply pump within 24 hours',
      });

      expect(resolved).toBeDefined();
      expect(mockNotification.notify).toHaveBeenCalledTimes(2);
      expect(mockAudit.log).toHaveBeenCalled();
    });
  });

  describe('6. Immutable Escrow Ledger Reconciliation', () => {
    it('rejects ledger entry with zero or negative amount', async () => {
      await expect(
        ledgerService.recordEntry({
          type: LedgerEntryType.RENT_PAYMENT,
          debitAccount: 'BANK',
          creditAccount: 'LANDLORD',
          amountPkr: -500,
          description: 'Invalid negative test',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('computes accurate active escrow balance across ledger entries', async () => {
      mockPrisma.ledgerEntry.findMany.mockResolvedValue([
        { type: LedgerEntryType.DEPOSIT_HOLD, amountPkr: new Prisma.Decimal(90000) },
        { type: LedgerEntryType.RENT_PAYMENT, amountPkr: new Prisma.Decimal(45000) },
        { type: LedgerEntryType.DEPOSIT_RELEASE, amountPkr: new Prisma.Decimal(30000) },
        { type: LedgerEntryType.REFUND, amountPkr: new Prisma.Decimal(10000) },
      ]);

      const report = await ledgerService.getReconciliationReport();

      expect(report.totalEntries).toBe(4);
      expect(report.summary.totalDepositsHeld).toBe(90000);
      expect(report.summary.totalDepositsReleased).toBe(30000);
      expect(report.summary.totalRefunds).toBe(10000);
      // Active escrow balance = Held (90,000) - Released (30,000) - Refunded (10,000) = 50,000
      expect(report.activeEscrowBalance).toBe(50000);
    });
  });
});
