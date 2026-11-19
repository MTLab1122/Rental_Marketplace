import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { NotificationService } from '../notification/notification.service';
import { LedgerService } from './ledger.service';
import {
  CreateDisputeDto,
  ResolveDisputeDto,
  DisputeCategory,
  DisputeStatus,
  BookingStatus,
  NotificationType,
  LedgerEntryType,
} from '@rental-peshawar/shared-types';
import { Prisma } from '@prisma/client';

@Injectable()
export class DisputeService {
  private readonly logger = new Logger(DisputeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly notificationService: NotificationService,
    private readonly ledgerService: LedgerService,
  ) {}

  /**
   * Opens a new dispute for a booking.
   */
  async createDispute(userId: string, dto: CreateDisputeDto) {
    this.logger.log(`User ${userId} creating dispute for booking ${dto.bookingId}`);
    const booking = await this.prisma.booking.findUnique({
      where: { id: dto.bookingId },
      include: { tenant: true, landlord: true },
    });

    if (!booking) {
      throw new NotFoundException(`Booking ${dto.bookingId} not found`);
    }

    const isTenant = booking.tenantId === userId;
    const isLandlord = booking.landlordId === userId;

    if (!isTenant && !isLandlord) {
      throw new ForbiddenException(
        'Only the tenant or landlord of this booking can raise a dispute',
      );
    }

    const respondentId = isTenant ? booking.landlordId : booking.tenantId;

    // Check if an open dispute already exists for this booking
    const activeDispute = await this.prisma.dispute.findFirst({
      where: {
        bookingId: booking.id,
        status: { in: [DisputeStatus.OPEN, DisputeStatus.UNDER_REVIEW, DisputeStatus.ESCALATED] },
      },
    });

    if (activeDispute) {
      throw new BadRequestException('There is already an active dispute open for this booking');
    }

    const amountPkr = dto.amountDisputedPkr ?? dto.amountDisputed;

    // Create dispute
    const dispute = await this.prisma.dispute.create({
      data: {
        bookingId: booking.id,
        initiatorId: userId,
        respondentId,
        category: dto.category,
        status: DisputeStatus.OPEN,
        description: dto.description,
        amountDisputedPkr: amountPkr ? new Prisma.Decimal(amountPkr) : undefined,
        evidenceUrls: dto.evidenceUrls ? (dto.evidenceUrls as Prisma.InputJsonValue) : undefined,
      },
      include: {
        booking: true,
        initiator: { select: { id: true, fullName: true, email: true } },
        respondent: { select: { id: true, fullName: true, email: true } },
      },
    });

    // Mark booking as DISPUTED
    await this.prisma.booking.update({
      where: { id: booking.id },
      data: { status: BookingStatus.DISPUTED },
    });

    // If an amount is disputed, log a dispute hold entry in the ledger
    if (amountPkr && amountPkr > 0) {
      await this.ledgerService.recordEntry({
        bookingId: booking.id,
        type: LedgerEntryType.DISPUTE_HOLD,
        debitAccount: 'ESCROW_OPERATIONS',
        creditAccount: 'ESCROW_DISPUTE_HOLD',
        amountPkr,
        description: `Dispute hold for booking ${booking.id} (${dto.category})`,
        metadata: { disputeId: dispute.id, initiatorId: userId },
      });
    }

    // Notify respondent
    await this.notificationService.notify(
      respondentId,
      NotificationType.DISPUTE_OPENED,
      'Rental Dispute Raised',
      `A dispute has been raised regarding booking for property ${booking.propertyId}. Category: ${dto.category}`,
      { disputeId: dispute.id, bookingId: booking.id },
    );

    // Audit log
    await this.auditService.log({
      actorId: userId,
      action: 'DISPUTE_OPENED',
      targetType: 'DISPUTE',
      targetId: dispute.id,
      after: {
        category: dto.category,
        bookingId: booking.id,
        amountDisputedPkr: amountPkr,
      },
    });

    return dispute;
  }

  /**
   * Adds a message to an active dispute thread.
   */
  async addMessage(
    disputeId: string,
    userId: string,
    message: string,
    attachmentUrls?: string[],
    userRoles: string[] = [],
  ) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
      include: { booking: true },
    });

    if (!dispute) {
      throw new NotFoundException(`Dispute ${disputeId} not found`);
    }

    const isAdmin = userRoles.some((r) => ['ADMIN', 'SUPER_ADMIN', 'MODERATOR'].includes(r));
    const isInitiator = dispute.initiatorId === userId;
    const isRespondent = dispute.respondentId === userId;

    if (!isAdmin && !isInitiator && !isRespondent) {
      throw new ForbiddenException('Not authorized to contribute to this dispute thread');
    }

    const senderRole = isAdmin ? 'ADMIN' : isInitiator ? 'INITIATOR' : 'RESPONDENT';

    const disputeMessage = await this.prisma.disputeMessage.create({
      data: {
        disputeId,
        senderId: userId,
        senderRole,
        message,
        attachmentUrls: attachmentUrls ? (attachmentUrls as Prisma.InputJsonValue) : undefined,
      },
      include: {
        sender: { select: { id: true, fullName: true, roles: true } },
      },
    });

    // Notify counter-parties
    const recipients = [dispute.initiatorId, dispute.respondentId].filter((id) => id !== userId);
    for (const rId of recipients) {
      await this.notificationService.notify(
        rId,
        NotificationType.SYSTEM,
        'New Message in Dispute',
        message.length > 80 ? `${message.substring(0, 77)}...` : message,
        { disputeId, messageId: disputeMessage.id },
      );
    }

    return disputeMessage;
  }

  /**
   * Admin resolution of a dispute.
   */
  async resolveDispute(disputeId: string, adminId: string, dto: ResolveDisputeDto) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
      include: { booking: true },
    });

    if (!dispute) {
      throw new NotFoundException(`Dispute ${disputeId} not found`);
    }

    const updated = await this.prisma.dispute.update({
      where: { id: disputeId },
      data: {
        status: dto.status,
        resolution: dto.resolution,
        resolvedById: adminId,
        resolvedAt: new Date(),
      },
      include: {
        booking: true,
        initiator: true,
        respondent: true,
      },
    });

    // If resolved, restore booking to active or completed
    const finalBookingStatus =
      dto.status === DisputeStatus.RESOLVED ? BookingStatus.CONFIRMED : BookingStatus.ACTIVE;
    await this.prisma.booking.update({
      where: { id: dispute.bookingId },
      data: { status: finalBookingStatus },
    });

    // Notify both parties
    const notifyMsg = `Dispute ${disputeId} has been marked as ${dto.status}. Resolution: ${dto.resolution}`;
    await this.notificationService.notify(
      dispute.initiatorId,
      NotificationType.SYSTEM,
      'Dispute Resolved',
      notifyMsg,
      { disputeId, status: dto.status },
    );
    await this.notificationService.notify(
      dispute.respondentId,
      NotificationType.SYSTEM,
      'Dispute Resolved',
      notifyMsg,
      { disputeId, status: dto.status },
    );

    await this.auditService.log({
      actorId: adminId,
      action: 'DISPUTE_RESOLVED',
      targetType: 'DISPUTE',
      targetId: disputeId,
      after: {
        status: dto.status,
        resolution: dto.resolution,
      },
    });

    return updated;
  }

  async getDisputesForUser(userId: string) {
    return this.prisma.dispute.findMany({
      where: {
        OR: [{ initiatorId: userId }, { respondentId: userId }],
      },
      include: {
        booking: {
          include: {
            property: { select: { id: true, title: true, localityId: true } },
          },
        },
        initiator: { select: { id: true, fullName: true } },
        respondent: { select: { id: true, fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDisputeById(disputeId: string, userId: string, roles: string[] = []) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        booking: {
          include: {
            property: { select: { id: true, title: true, localityId: true } },
            tenant: { select: { id: true, fullName: true, email: true } },
            landlord: { select: { id: true, fullName: true, email: true } },
          },
        },
        initiator: { select: { id: true, fullName: true, email: true } },
        respondent: { select: { id: true, fullName: true, email: true } },
        resolvedBy: { select: { id: true, fullName: true } },
        messages: {
          include: { sender: { select: { id: true, fullName: true, roles: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!dispute) {
      throw new NotFoundException(`Dispute ${disputeId} not found`);
    }

    const isAdmin = roles.some((r) => ['ADMIN', 'SUPER_ADMIN', 'MODERATOR'].includes(r));
    const isParticipant = dispute.initiatorId === userId || dispute.respondentId === userId;

    if (!isAdmin && !isParticipant) {
      throw new ForbiddenException('Not authorized to view this dispute');
    }

    return dispute;
  }

  async getAllDisputesAdmin(filter?: { status?: DisputeStatus; category?: DisputeCategory }) {
    const where: Prisma.DisputeWhereInput = {};
    if (filter?.status) where.status = filter.status;
    if (filter?.category) where.category = filter.category;

    return this.prisma.dispute.findMany({
      where,
      include: {
        booking: {
          include: {
            property: { select: { id: true, title: true } },
          },
        },
        initiator: { select: { id: true, fullName: true } },
        respondent: { select: { id: true, fullName: true } },
        _count: { select: { messages: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
