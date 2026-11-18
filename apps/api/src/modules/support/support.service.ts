import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateTicketDto,
  AddTicketMessageDto,
  UpdateTicketStatusDto,
  SubmitAppealDto,
  TakedownListingDto,
} from './support.dto';
import { PropertyStatus } from '@prisma/client';

@Injectable()
export class SupportService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Submit support ticket
   */
  async createTicket(userId: string, dto: CreateTicketDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const ticketId = `TICK-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

    await this.prisma.auditLog.create({
      data: {
        actorId: userId,
        action: 'SUPPORT_TICKET_CREATED',
        targetType: 'SupportTicket',
        targetId: ticketId,
        after: {
          ticketId,
          userId,
          userEmail: user.email,
          userFullName: user.fullName,
          subject: dto.subject,
          category: dto.category,
          priority: dto.priority || 'MEDIUM',
          description: dto.description,
          propertyId: dto.propertyId || null,
          status: 'OPEN',
          messages: [
            {
              senderId: userId,
              senderName: user.fullName,
              content: dto.description,
              timestamp: new Date().toISOString(),
            },
          ],
          createdAt: new Date().toISOString(),
        },
      },
    });

    return {
      ticketId,
      status: 'OPEN',
      subject: dto.subject,
      category: dto.category,
      message: 'Support ticket submitted. Peshawar operations team will reply within SLA window.',
    };
  }

  /**
   * List tickets for user or administrative oversight
   */
  async getTickets(userId: string, isAdmin: boolean, statusFilter?: string) {
    const where: any = {
      targetType: 'SupportTicket',
      action: 'SUPPORT_TICKET_CREATED',
    };

    if (!isAdmin) {
      where.actorId = userId;
    }

    const logs = await this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    let tickets = logs.map((l: any) => ({
      id: l.targetId,
      createdAt: l.createdAt,
      ...(l.after as Record<string, any>),
    }));

    if (statusFilter) {
      tickets = tickets.filter((t: any) => t.status === statusFilter);
    }

    return tickets;
  }

  /**
   * Get ticket details
   */
  async getTicketById(ticketId: string, userId: string, isAdmin: boolean) {
    const log = await this.prisma.auditLog.findFirst({
      where: {
        targetType: 'SupportTicket',
        targetId: ticketId,
        action: 'SUPPORT_TICKET_CREATED',
      },
    });

    if (!log) {
      throw new NotFoundException(`Ticket ${ticketId} not found`);
    }

    const data = log.after as Record<string, any>;
    if (!isAdmin && data?.userId !== userId) {
      throw new ForbiddenException('Access denied to this ticket');
    }

    return {
      id: log.targetId,
      createdAt: log.createdAt,
      ...data,
    };
  }

  /**
   * Add response message to ticket thread
   */
  async addTicketMessage(
    ticketId: string,
    userId: string,
    dto: AddTicketMessageDto,
    isAdmin: boolean,
  ) {
    const log = await this.prisma.auditLog.findFirst({
      where: {
        targetType: 'SupportTicket',
        targetId: ticketId,
        action: 'SUPPORT_TICKET_CREATED',
      },
    });

    if (!log) throw new NotFoundException('Ticket not found');

    const data = log.after as Record<string, any>;
    if (!isAdmin && data?.userId !== userId) {
      throw new ForbiddenException('Access denied to this ticket');
    }

    const sender = await this.prisma.user.findUnique({ where: { id: userId } });

    const messages = Array.isArray(data?.messages) ? data.messages : [];
    messages.push({
      senderId: userId,
      senderName: sender?.fullName || (isAdmin ? 'Peshawar Support Team' : 'User'),
      isAdmin,
      content: dto.content,
      timestamp: new Date().toISOString(),
    });

    const updatedData = {
      ...data,
      messages,
      status: isAdmin ? 'WAITING_USER' : 'IN_PROGRESS',
      updatedAt: new Date().toISOString(),
    };

    await this.prisma.auditLog.update({
      where: { id: log.id },
      data: { after: updatedData },
    });

    return {
      ticketId,
      messagesCount: messages.length,
      latestMessage: messages[messages.length - 1],
    };
  }

  /**
   * Update ticket status (Admin/Support only)
   */
  async updateTicketStatus(ticketId: string, adminUserId: string, dto: UpdateTicketStatusDto) {
    const log = await this.prisma.auditLog.findFirst({
      where: {
        targetType: 'SupportTicket',
        targetId: ticketId,
        action: 'SUPPORT_TICKET_CREATED',
      },
    });

    if (!log) throw new NotFoundException('Ticket not found');

    const data = log.after as Record<string, any>;
    const updatedData = {
      ...data,
      status: dto.status,
      resolutionNotes: dto.resolutionNotes || data?.resolutionNotes,
      resolvedAt:
        dto.status === 'RESOLVED' || dto.status === 'CLOSED' ? new Date().toISOString() : null,
      resolvedById: adminUserId,
      updatedAt: new Date().toISOString(),
    };

    await this.prisma.auditLog.update({
      where: { id: log.id },
      data: { after: updatedData },
    });

    return {
      ticketId,
      status: dto.status,
      resolutionNotes: dto.resolutionNotes,
      message: `Ticket status transitioned to ${dto.status}.`,
    };
  }

  /**
   * Submit an official appeal (e.g. against listing takedown or account suspension)
   */
  async submitAppeal(userId: string, dto: SubmitAppealDto) {
    const appealId = `APPL-${Date.now().toString(36).toUpperCase()}`;

    await this.prisma.auditLog.create({
      data: {
        actorId: userId,
        action: 'APPEAL_SUBMITTED',
        targetType: 'Appeal',
        targetId: appealId,
        after: {
          appealId,
          userId,
          targetType: dto.targetType,
          targetId: dto.targetId,
          appealReason: dto.appealReason,
          supportingEvidence: dto.supportingEvidence || null,
          status: 'PENDING_REVIEW',
          submittedAt: new Date().toISOString(),
        },
      },
    });

    return {
      appealId,
      status: 'PENDING_REVIEW',
      message: 'Appeal registered. Platform Ombudsman will review within 24 hours.',
    };
  }

  /**
   * Takedown listing with audit justification and landlord alert
   */
  async takedownListing(adminUserId: string, dto: TakedownListingDto) {
    const property = await this.prisma.property.findUnique({
      where: { id: dto.propertyId },
      include: { landlord: true },
    });

    if (!property) throw new NotFoundException('Property not found');

    const updated = await this.prisma.property.update({
      where: { id: property.id },
      data: {
        status: PropertyStatus.SUSPENDED,
        isAvailable: false,
        suspensionReason: dto.reason,
      },
    });

    // Create Notification for Landlord
    if (dto.notifyLandlord !== false) {
      await this.prisma.notification.create({
        data: {
          userId: property.landlordId,
          type: 'LISTING_SUSPENDED',
          title: 'Listing Suspended by Moderation',
          body: `Your property listing "${property.title}" has been taken down. Reason: ${dto.reason}. You may submit an appeal via Support.`,
          data: { propertyId: property.id, reason: dto.reason },
        },
      });
    }

    // Immutable Audit Trail
    await this.prisma.auditLog.create({
      data: {
        actorId: adminUserId,
        action: 'LISTING_TAKEDOWN',
        targetType: 'Property',
        targetId: property.id,
        before: { status: property.status, isAvailable: property.isAvailable },
        after: {
          status: PropertyStatus.SUSPENDED,
          isAvailable: false,
          suspensionReason: dto.reason,
        },
      },
    });

    return {
      propertyId: updated.id,
      status: updated.status,
      suspensionReason: updated.suspensionReason,
      message: 'Property listing taken down successfully from public search.',
    };
  }
}
