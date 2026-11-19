import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { NotificationService } from '../notification/notification.service';
import { AgreementService } from './agreement.service';
import {
  CreateBookingDto,
  UpdateBookingStatusDto,
  CancelBookingDto,
  BookingStatus,
  InquiryStatus,
  NotificationType,
  PropertyStatus,
} from '@rental-peshawar/shared-types';
import { Prisma } from '@prisma/client';

@Injectable()
export class BookingService {
  private readonly logger = new Logger(BookingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly notificationService: NotificationService,
    private readonly agreementService: AgreementService,
  ) {}

  /**
   * Tenant submits booking request.
   * Requirement: Tenant MUST have an ACCEPTED inquiry for this property.
   * Double-booking prevention: Property must not have another active booking.
   */
  async createBookingRequest(tenantId: string, dto: CreateBookingDto) {
    this.logger.log(`Creating booking request for inquiry ${dto.inquiryId} by tenant ${tenantId}`);
    // 1. Validate inquiry is ACCEPTED and belongs to this tenant and property
    const inquiry = await this.prisma.inquiry.findUnique({
      where: { id: dto.inquiryId },
      include: { property: true },
    });

    if (!inquiry) {
      throw new NotFoundException(`Inquiry ${dto.inquiryId} not found`);
    }

    if (inquiry.tenantId !== tenantId) {
      throw new ForbiddenException('You can only create booking requests for your own inquiries');
    }

    if (inquiry.propertyId !== dto.propertyId) {
      throw new BadRequestException('Inquiry does not match the requested property');
    }

    if (inquiry.status !== InquiryStatus.ACCEPTED) {
      throw new BadRequestException(
        `Cannot create booking request: inquiry status is ${inquiry.status}. Inquiries must be ACCEPTED by landlord first.`,
      );
    }

    // 2. Validate property status and active Peshawar boundary
    const property = inquiry.property;
    if (property.status !== PropertyStatus.APPROVED) {
      throw new BadRequestException('Property is not in APPROVED status');
    }

    // 3. Prevent Double-Booking: check if there is any active conflicting booking
    const activeConflictingBooking = await this.prisma.booking.findFirst({
      where: {
        propertyId: dto.propertyId,
        status: {
          in: [
            BookingStatus.AWAITING_PAYMENT,
            BookingStatus.PAYMENT_PENDING,
            BookingStatus.CONFIRMED,
            BookingStatus.ACTIVE,
          ],
        },
      },
    });

    if (activeConflictingBooking) {
      throw new ConflictException(
        'Property already has an active reservation or confirmed booking. Double-booking is strictly prohibited.',
      );
    }

    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    if (startDate >= endDate) {
      throw new BadRequestException('End date must be after start date');
    }

    const monthlyRent = Number(property.monthlyRentPkr);
    const securityDeposit = Number(property.securityDepositPkr || property.monthlyRentPkr);
    const totalInitial = monthlyRent + securityDeposit;

    // Use a transaction to create the booking request and booking entity together
    return this.prisma
      .$transaction(async (tx) => {
        // Create BookingRequest record
        const bookingRequest = await tx.bookingRequest.create({
          data: {
            inquiryId: inquiry.id,
            propertyId: property.id,
            tenantId,
            landlordId: property.landlordId,
            startDate,
            endDate,
            tenantCount: dto.tenantCount || 1,
            proposedRentPkr: new Prisma.Decimal(monthlyRent),
            proposedDepositPkr: new Prisma.Decimal(securityDeposit),
            notes: dto.notes,
            status: 'REQUESTED',
          },
        });

        // Create Booking record
        const booking = await tx.booking.create({
          data: {
            bookingRequestId: bookingRequest.id,
            inquiryId: inquiry.id,
            propertyId: property.id,
            tenantId,
            landlordId: property.landlordId,
            status: BookingStatus.REQUESTED,
            startDate,
            endDate,
            monthlyRentPkr: new Prisma.Decimal(monthlyRent),
            securityDepositPkr: new Prisma.Decimal(securityDeposit),
            totalInitialAmountPkr: new Prisma.Decimal(totalInitial),
            notes: dto.notes,
          },
          include: {
            property: { select: { id: true, title: true, address: true, localityId: true } },
            tenant: { select: { id: true, fullName: true, email: true, phoneNumber: true } },
            landlord: { select: { id: true, fullName: true, email: true, phoneNumber: true } },
          },
        });

        return booking;
      })
      .then(async (booking) => {
        // Post-transaction notifications and audit
        await this.notificationService.notify(
          property.landlordId,
          NotificationType.BOOKING_STATUS_CHANGED,
          'New Rental Booking Request',
          `A new booking request has been submitted for ${property.title} by tenant.`,
          { bookingId: booking.id, propertyId: property.id },
        );

        await this.auditService.log({
          actorId: tenantId,
          action: 'BOOKING_REQUEST_CREATED',
          targetType: 'BOOKING',
          targetId: booking.id,
          after: {
            propertyId: property.id,
            monthlyRentPkr: monthlyRent,
            securityDepositPkr: securityDeposit,
          },
        });

        return booking;
      });
  }

  /**
   * Landlord updates booking status (e.g. Accept -> AWAITING_PAYMENT, Decline -> CANCELLED, Activate, Complete).
   */
  async updateBookingStatus(bookingId: string, landlordId: string, dto: UpdateBookingStatusDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { property: true, tenant: true },
    });

    if (!booking) {
      throw new NotFoundException(`Booking ${bookingId} not found`);
    }

    if (booking.landlordId !== landlordId) {
      throw new ForbiddenException(
        'Only the landlord of this property can update the booking status',
      );
    }

    const previousStatus = booking.status;
    let lockExpiresAt = booking.lockExpiresAt;

    // Landlord accepts -> AWAITING_PAYMENT with 24h lock
    if (dto.status === BookingStatus.AWAITING_PAYMENT) {
      lockExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours lock
    }

    // Landlord completes or cancels -> release property availability
    if (dto.status === BookingStatus.COMPLETED || dto.status === BookingStatus.CANCELLED) {
      await this.prisma.property.update({
        where: { id: booking.propertyId },
        data: { isAvailable: true },
      });
    }

    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: dto.status,
        lockExpiresAt,
        notes: dto.notes || booking.notes,
      },
      include: {
        property: { select: { id: true, title: true, address: true } },
        tenant: { select: { id: true, fullName: true, email: true } },
        landlord: { select: { id: true, fullName: true, email: true } },
      },
    });

    // When landlord accepts, auto-generate digital rental agreement
    if (dto.status === BookingStatus.AWAITING_PAYMENT) {
      await this.agreementService.getOrCreateAgreementForBooking(bookingId);
    }

    // Notify tenant of status update
    await this.notificationService.notify(
      booking.tenantId,
      NotificationType.BOOKING_STATUS_CHANGED,
      `Booking Status Updated: ${dto.status}`,
      `Your booking for ${booking.property.title} has been updated to ${dto.status}.`,
      { bookingId, previousStatus, status: dto.status },
    );

    await this.auditService.log({
      actorId: landlordId,
      action: 'BOOKING_STATUS_UPDATED',
      targetType: 'BOOKING',
      targetId: bookingId,
      before: { status: previousStatus },
      after: { status: dto.status, lockExpiresAt },
    });

    return updated;
  }

  /**
   * Tenant cancels booking before payment or confirmation.
   */
  async cancelBooking(bookingId: string, tenantId: string, dto: CancelBookingDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { property: true },
    });

    if (!booking) {
      throw new NotFoundException(`Booking ${bookingId} not found`);
    }

    if (booking.tenantId !== tenantId) {
      throw new ForbiddenException('Only the tenant who created the booking can cancel it');
    }

    if (booking.status === BookingStatus.CONFIRMED || booking.status === BookingStatus.ACTIVE) {
      throw new BadRequestException(
        'Cannot directly cancel a confirmed or active booking. Please initiate a Dispute or Refund request.',
      );
    }

    const cancellationReason = dto.cancellationReason || dto.reason || 'Cancelled by tenant';
    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.CANCELLED,
        cancelledAt: new Date(),
        cancellationReason,
      },
    });

    // Release property availability if it was locked
    await this.prisma.property.update({
      where: { id: booking.propertyId },
      data: { isAvailable: true },
    });

    // Notify landlord
    await this.notificationService.notify(
      booking.landlordId,
      NotificationType.BOOKING_STATUS_CHANGED,
      'Booking Request Cancelled',
      `Booking request for ${booking.property.title} has been cancelled by the tenant.`,
      { bookingId, reason: cancellationReason },
    );

    await this.auditService.log({
      actorId: tenantId,
      action: 'BOOKING_CANCELLED_BY_TENANT',
      targetType: 'BOOKING',
      targetId: bookingId,
      after: { reason: cancellationReason },
    });

    return updated;
  }

  /**
   * Checks and expires unpaid bookings where lockExpiresAt has elapsed.
   */
  async expireOverdueBookings() {
    const now = new Date();
    const expiredBookings = await this.prisma.booking.findMany({
      where: {
        status: { in: [BookingStatus.AWAITING_PAYMENT, BookingStatus.PAYMENT_PENDING] },
        lockExpiresAt: { lte: now },
      },
    });

    for (const b of expiredBookings) {
      await this.prisma.booking.update({
        where: { id: b.id },
        data: {
          status: BookingStatus.EXPIRED,
          cancellationReason: 'Payment lock window expired (24 hours)',
        },
      });

      // Release property availability
      await this.prisma.property.update({
        where: { id: b.propertyId },
        data: { isAvailable: true },
      });

      await this.notificationService.notify(
        b.tenantId,
        NotificationType.BOOKING_STATUS_CHANGED,
        'Booking Reservation Expired',
        `Your reservation for booking ${b.id} has expired due to non-payment within 24 hours.`,
        { bookingId: b.id },
      );
    }

    return { expiredCount: expiredBookings.length };
  }

  /**
   * Gets booking by ID with participant or admin check.
   */
  async getBookingById(bookingId: string, userId: string, roles: string[] = []) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        property: {
          include: {
            locality: true,
            images: { where: { isPrimary: true }, take: 1 },
          },
        },
        tenant: { select: { id: true, fullName: true, email: true, phoneNumber: true } },
        landlord: { select: { id: true, fullName: true, email: true, phoneNumber: true } },
        payments: {
          include: {
            receipt: true,
            transactions: true,
          },
        },
        agreement: {
          include: { signatures: true },
        },
        disputes: true,
      },
    });

    if (!booking) {
      throw new NotFoundException(`Booking ${bookingId} not found`);
    }

    const isAdmin = roles.some((r) => ['ADMIN', 'SUPER_ADMIN', 'MODERATOR'].includes(r));
    const isParticipant = booking.tenantId === userId || booking.landlordId === userId;

    if (!isAdmin && !isParticipant) {
      throw new ForbiddenException('Not authorized to view this booking');
    }

    return booking;
  }

  /**
   * Retrieves bookings for a user (either as tenant or landlord).
   */
  async getUserBookings(userId: string, role?: 'TENANT' | 'LANDLORD') {
    const where: Prisma.BookingWhereInput = {};
    if (role === 'LANDLORD') {
      where.landlordId = userId;
    } else if (role === 'TENANT') {
      where.tenantId = userId;
    } else {
      where.OR = [{ tenantId: userId }, { landlordId: userId }];
    }

    return this.prisma.booking.findMany({
      where,
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
            monthlyRentPkr: true,
            locality: { select: { name: true } },
            images: { where: { isPrimary: true }, take: 1 },
          },
        },
        tenant: { select: { id: true, fullName: true, email: true } },
        landlord: { select: { id: true, fullName: true, email: true } },
        payments: { select: { id: true, status: true, amountPkr: true } },
        agreement: { select: { id: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Admin-level listing of all bookings.
   */
  async getAllBookingsAdmin(filter?: { status?: BookingStatus; propertyId?: string }) {
    const where: Prisma.BookingWhereInput = {};
    if (filter?.status) where.status = filter.status;
    if (filter?.propertyId) where.propertyId = filter.propertyId;

    return this.prisma.booking.findMany({
      where,
      include: {
        property: { select: { id: true, title: true, address: true } },
        tenant: { select: { id: true, fullName: true, email: true } },
        landlord: { select: { id: true, fullName: true, email: true } },
        payments: true,
        disputes: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
