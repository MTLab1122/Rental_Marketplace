import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { LedgerEntryType } from '@rental-peshawar/shared-types';
import { Prisma } from '@prisma/client';

export interface CreateLedgerEntryParams {
  bookingId?: string;
  paymentId?: string;
  type: LedgerEntryType;
  debitAccount: string;
  creditAccount: string;
  amountPkr: number;
  description: string;
  metadata?: Record<string, any>;
}

export interface CreateAdjustmentParams {
  adminId: string;
  bookingId?: string;
  paymentId?: string;
  amountPkr: number;
  description: string;
  reason: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class LedgerService {
  private readonly logger = new Logger(LedgerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Appends an immutable ledger entry.
   * Updates and deletes on ledger_entries table are strictly forbidden.
   */
  async recordEntry(params: CreateLedgerEntryParams) {
    if (params.amountPkr <= 0) {
      throw new BadRequestException('Ledger entry amount must be strictly greater than zero');
    }

    const entry = await this.prisma.ledgerEntry.create({
      data: {
        bookingId: params.bookingId,
        paymentId: params.paymentId,
        type: params.type,
        debitAccount: params.debitAccount,
        creditAccount: params.creditAccount,
        amountPkr: new Prisma.Decimal(params.amountPkr),
        description: params.description,
        isImmutable: true,
        metadata: params.metadata ? (params.metadata as Prisma.InputJsonValue) : undefined,
      },
    });

    this.logger.log(
      `[Ledger] Recorded ${params.type} entry ${entry.id} for amount PKR ${params.amountPkr} (Debit: ${params.debitAccount}, Credit: ${params.creditAccount})`,
    );

    return entry;
  }

  /**
   * Admin-only adjustment entry.
   * Adjustments do not modify previous records; they post an opposing or balancing entry.
   */
  async recordAdjustment(params: CreateAdjustmentParams) {
    if (params.amountPkr === 0) {
      throw new BadRequestException('Adjustment amount cannot be zero');
    }

    const isCredit = params.amountPkr > 0;
    const absAmount = Math.abs(params.amountPkr);

    const entry = await this.prisma.ledgerEntry.create({
      data: {
        bookingId: params.bookingId,
        paymentId: params.paymentId,
        type: LedgerEntryType.ADJUSTMENT,
        debitAccount: isCredit ? 'ESCROW_ADJUSTMENT' : 'ESCROW_LIABILITY',
        creditAccount: isCredit ? 'ESCROW_LIABILITY' : 'ESCROW_ADJUSTMENT',
        amountPkr: new Prisma.Decimal(absAmount),
        description: `Admin adjustment: ${params.description} (Reason: ${params.reason})`,
        isImmutable: true,
        metadata: {
          adminId: params.adminId,
          reason: params.reason,
          adjustedAt: new Date().toISOString(),
          ...params.metadata,
        },
      },
    });

    await this.auditService.log({
      actorId: params.adminId,
      action: 'LEDGER_ADJUSTMENT_POSTED',
      targetType: 'LEDGER_ENTRY',
      targetId: entry.id,
      after: {
        amountPkr: params.amountPkr,
        bookingId: params.bookingId,
        reason: params.reason,
      },
    });

    return entry;
  }

  /**
   * Returns all ledger entries for a booking in chronological order.
   */
  async getBookingLedger(bookingId: string) {
    return this.prisma.ledgerEntry.findMany({
      where: { bookingId },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Generates a reconciliation report of held deposits, payments, and balances.
   */
  async getReconciliationReport(filter?: { startDate?: Date; endDate?: Date; bookingId?: string }) {
    const whereClause: Prisma.LedgerEntryWhereInput = {};
    if (filter?.bookingId) {
      whereClause.bookingId = filter.bookingId;
    }
    if (filter?.startDate || filter?.endDate) {
      whereClause.createdAt = {};
      if (filter.startDate) whereClause.createdAt.gte = filter.startDate;
      if (filter.endDate) whereClause.createdAt.lte = filter.endDate;
    }

    const entries = await this.prisma.ledgerEntry.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });

    let totalDepositsHeld = 0;
    let totalDepositsReleased = 0;
    let totalRentPaid = 0;
    let totalRefunds = 0;
    let totalPlatformFees = 0;
    let totalDisputeHolds = 0;

    for (const e of entries) {
      const amt = Number(e.amountPkr);
      switch (e.type) {
        case LedgerEntryType.DEPOSIT_HOLD:
          totalDepositsHeld += amt;
          break;
        case LedgerEntryType.DEPOSIT_RELEASE:
          totalDepositsReleased += amt;
          break;
        case LedgerEntryType.RENT_PAYMENT:
          totalRentPaid += amt;
          break;
        case LedgerEntryType.REFUND:
          totalRefunds += amt;
          break;
        case LedgerEntryType.PLATFORM_FEE:
          totalPlatformFees += amt;
          break;
        case LedgerEntryType.DISPUTE_HOLD:
          totalDisputeHolds += amt;
          break;
        default:
          break;
      }
    }

    const activeEscrowBalance = totalDepositsHeld - totalDepositsReleased - totalRefunds;

    return {
      totalEntries: entries.length,
      activeEscrowBalance,
      summary: {
        totalDepositsHeld,
        totalDepositsReleased,
        totalRentPaid,
        totalRefunds,
        totalPlatformFees,
        totalDisputeHolds,
      },
      entries,
    };
  }
}
