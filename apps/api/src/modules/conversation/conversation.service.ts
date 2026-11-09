import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  UnprocessableEntityException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { NotificationService } from '../notification/notification.service';
import { RateLimiterService } from '../../common/guards/rate-limiter.service';
import { GetMessagesQueryDto, ReportConversationRequestDto } from './dto/conversation.dto';
import { NotificationType, ErrorCode, InquiryStatus } from '@rental-peshawar/shared-types';
import { generateWhatsAppDeepLink } from '../../common/util/whatsapp.util';

@Injectable()
export class ConversationService {
  private readonly logger = new Logger(ConversationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly notificationService: NotificationService,
    private readonly rateLimiter: RateLimiterService,
  ) {}

  /**
   * Creates a dedicated conversation for an inquiry.
   */
  async createForInquiry(
    inquiryId: string,
    propertyId: string,
    tenantId: string,
    landlordId: string,
  ) {
    const existing = await this.prisma.conversation.findUnique({
      where: { inquiryId },
    });

    if (existing) {
      return existing;
    }

    const conversation = await this.prisma.conversation.create({
      data: {
        inquiryId,
        propertyId,
        participants: {
          create: [{ userId: tenantId }, { userId: landlordId }],
        },
      },
      include: {
        participants: {
          include: {
            user: { select: { id: true, fullName: true, email: true, phoneNumber: true } },
          },
        },
      },
    });

    this.logger.log(
      `Created conversation ${conversation.id} for inquiry ${inquiryId} between tenant ${tenantId} and landlord ${landlordId}`,
    );
    return conversation;
  }

  /**
   * Retrieves all conversations for the current user.
   */
  async getUserConversations(userId: string) {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        participants: {
          some: { userId },
        },
      },
      include: {
        property: {
          include: {
            locality: true,
            images: {
              where: { moderationStatus: 'APPROVED' },
              orderBy: { sortOrder: 'asc' },
              take: 1,
            },
          },
        },
        inquiry: {
          select: {
            id: true,
            status: true,
            proposedRentPkr: true,
            proposedMoveInDate: true,
          },
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                phoneNumber: true,
                landlordProfile: {
                  select: { whatsappNumber: true, whatsappEnabled: true },
                },
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: { select: { id: true, fullName: true } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return Promise.all(
      conversations.map(async (conv) => {
        // Count unread messages for this user
        const unreadCount = await this.prisma.message.count({
          where: {
            conversationId: conv.id,
            senderId: { not: userId },
            isRead: false,
          },
        });

        // WhatsApp authorization check:
        // Available if inquiry is ACCEPTED or landlord explicitly enables it
        let whatsappUrl: string | null = null;
        let canContactWhatsapp = false;

        const otherParticipant = conv.participants.find((p) => p.userId !== userId)?.user;
        const isOtherLandlord = !!otherParticipant?.landlordProfile;
        const inquiryAccepted = conv.inquiry?.status === InquiryStatus.ACCEPTED;

        if (
          isOtherLandlord &&
          (inquiryAccepted || otherParticipant?.landlordProfile?.whatsappEnabled)
        ) {
          const targetPhone =
            otherParticipant.landlordProfile?.whatsappNumber || otherParticipant.phoneNumber;
          if (targetPhone) {
            whatsappUrl = generateWhatsAppDeepLink(targetPhone, conv.property?.title);
            canContactWhatsapp = true;
          }
        }

        return {
          id: conv.id,
          inquiryId: conv.inquiryId,
          propertyId: conv.propertyId,
          property: conv.property,
          isBlocked: conv.isBlocked,
          blockedById: conv.blockedById,
          blockedAt: conv.blockedAt?.toISOString() || null,
          lastMessageAt: conv.lastMessageAt?.toISOString() || null,
          createdAt: conv.createdAt.toISOString(),
          updatedAt: conv.updatedAt.toISOString(),
          unreadCount,
          inquiryStatus: conv.inquiry?.status || null,
          whatsappUrl,
          canContactWhatsapp,
          participants: conv.participants.map((p) => ({
            id: p.id,
            userId: p.userId,
            fullName: p.user.fullName,
            lastReadAt: p.lastReadAt?.toISOString() || null,
            joinedAt: p.joinedAt.toISOString(),
          })),
          lastMessage: conv.messages[0]
            ? {
                id: conv.messages[0].id,
                conversationId: conv.messages[0].conversationId,
                senderId: conv.messages[0].senderId,
                content: conv.messages[0].content,
                isRead: conv.messages[0].isRead,
                readAt: conv.messages[0].readAt?.toISOString() || null,
                createdAt: conv.messages[0].createdAt.toISOString(),
                sender: conv.messages[0].sender,
              }
            : null,
        };
      }),
    );
  }

  /**
   * Verifies that a user is an authorized participant in the conversation.
   */
  async verifyParticipant(conversationId: string, userId: string) {
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
    });

    if (!participant) {
      throw new ForbiddenException({
        code: ErrorCode.NOT_CONVERSATION_PARTICIPANT,
        message: 'You are not a participant in this conversation.',
      });
    }

    return participant;
  }

  /**
   * Retrieves messages for a conversation with pagination.
   */
  async getMessages(conversationId: string, userId: string, query: GetMessagesQueryDto) {
    await this.verifyParticipant(conversationId, userId);

    const limit = Math.min(query.limit || 50, 100);

    const where: any = { conversationId, deletedAt: null };
    if (query.cursor) {
      where.createdAt = { lt: new Date(query.cursor) };
    }

    const messages = await this.prisma.message.findMany({
      where,
      include: {
        sender: {
          select: { id: true, fullName: true, email: true },
        },
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });

    return messages.map((m) => ({
      id: m.id,
      conversationId: m.conversationId,
      senderId: m.senderId,
      content: m.content,
      isRead: m.isRead,
      readAt: m.readAt?.toISOString() || null,
      createdAt: m.createdAt.toISOString(),
      sender: m.sender,
    }));
  }

  /**
   * Sends and persists a message in a conversation.
   */
  async sendMessage(conversationId: string, senderId: string, rawContent: string) {
    // 1. Rate-limit check: 30 messages per minute per user
    await this.rateLimiter.enforceRateLimit(
      'message',
      senderId,
      30,
      60,
      'Message rate limit exceeded. Maximum 30 messages per minute.',
    );

    // 2. Verify participant
    await this.verifyParticipant(conversationId, senderId);

    // 3. Check if conversation is blocked
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: { select: { userId: true } },
        property: { select: { title: true } },
      },
    });

    if (!conversation) {
      throw new NotFoundException(`Conversation '${conversationId}' not found.`);
    }

    if (conversation.isBlocked) {
      throw new ForbiddenException({
        code: ErrorCode.CONVERSATION_BLOCKED,
        message: 'This conversation is blocked. No further messages can be sent.',
      });
    }

    // 4. Sanitize message content
    const sanitizedContent = rawContent.replace(/<[^>]*>/g, '').trim();
    if (!sanitizedContent || sanitizedContent.length === 0) {
      throw new UnprocessableEntityException({
        code: ErrorCode.MESSAGE_EMPTY,
        message: 'Message content cannot be blank.',
      });
    }

    // 5. Persist message and update lastMessageAt
    const [message] = await this.prisma.$transaction([
      this.prisma.message.create({
        data: {
          conversationId,
          senderId,
          content: sanitizedContent,
          isRead: false,
        },
        include: {
          sender: { select: { id: true, fullName: true, email: true } },
        },
      }),
      this.prisma.conversation.update({
        where: { id: conversationId },
        data: {
          lastMessageAt: new Date(),
          updatedAt: new Date(),
        },
      }),
    ]);

    // 6. Notify recipient participant
    const recipient = conversation.participants.find((p) => p.userId !== senderId);
    if (recipient) {
      await this.notificationService.notify(
        recipient.userId,
        NotificationType.MESSAGE_RECEIVED,
        'New Message',
        `New message from ${message.sender.fullName}: "${sanitizedContent.substring(0, 80)}"`,
        { conversationId, messageId: message.id },
      );
    }

    return message;
  }

  /**
   * Marks unread messages in a conversation as read.
   */
  async markAsRead(conversationId: string, userId: string) {
    await this.verifyParticipant(conversationId, userId);

    const now = new Date();

    const [updateMessages] = await this.prisma.$transaction([
      this.prisma.message.updateMany({
        where: {
          conversationId,
          senderId: { not: userId },
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: now,
        },
      }),
      this.prisma.conversationParticipant.update({
        where: {
          conversationId_userId: { conversationId, userId },
        },
        data: { lastReadAt: now },
      }),
    ]);

    return {
      success: true,
      updatedCount: updateMessages.count,
      readAt: now.toISOString(),
    };
  }

  /**
   * Blocks a conversation.
   */
  async blockConversation(conversationId: string, userId: string, reason?: string) {
    await this.verifyParticipant(conversationId, userId);

    const updated = await this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        isBlocked: true,
        blockedById: userId,
        blockedAt: new Date(),
      },
    });

    await this.auditService.log({
      actorId: userId,
      action: 'conversation:block',
      targetType: 'conversation',
      targetId: conversationId,
      after: { isBlocked: true, reason },
    });

    this.logger.log(`Conversation ${conversationId} blocked by user ${userId}`);
    return updated;
  }

  /**
   * Reports a conversation for abuse, harassment, or spam.
   */
  async reportConversation(
    conversationId: string,
    reporterId: string,
    dto: ReportConversationRequestDto,
  ) {
    await this.verifyParticipant(conversationId, reporterId);

    const report = await this.prisma.report.create({
      data: {
        reporterId,
        targetType: 'CONVERSATION',
        targetId: conversationId,
        reason: dto.reason,
        details: dto.details,
      },
    });

    await this.auditService.log({
      actorId: reporterId,
      action: 'conversation:report',
      targetType: 'report',
      targetId: report.id,
      after: { conversationId, reason: dto.reason },
    });

    this.logger.log(
      `Conversation ${conversationId} reported by user ${reporterId} for reason ${dto.reason}`,
    );
    return report;
  }
}
