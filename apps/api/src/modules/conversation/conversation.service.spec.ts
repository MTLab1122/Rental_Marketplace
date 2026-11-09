import { Test, TestingModule } from '@nestjs/testing';
import { ConversationService } from './conversation.service';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { NotificationService } from '../notification/notification.service';
import { RateLimiterService } from '../../common/guards/rate-limiter.service';
import { ReportReason, NotificationType } from '@rental-peshawar/shared-types';
import { ForbiddenException, UnprocessableEntityException } from '@nestjs/common';

describe('ConversationService', () => {
  let service: ConversationService;

  const tenantId = '11111111-1111-1111-1111-111111111111';
  const landlordId = '22222222-2222-2222-2222-222222222222';
  const strangerId = '33333333-3333-3333-3333-333333333333';
  const conversationId = '44444444-4444-4444-4444-444444444444';
  const inquiryId = '55555555-5555-5555-5555-555555555555';
  const messageId = '77777777-7777-7777-7777-777777777777';

  const mockConversation = {
    id: conversationId,
    inquiryId,
    propertyId: 'prop-1',
    isBlocked: false,
    blockedById: null,
    blockedAt: null,
    lastMessageAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    participants: [
      { id: 'part-1', conversationId, userId: tenantId },
      { id: 'part-2', conversationId, userId: landlordId },
    ],
    property: { id: 'prop-1', title: 'University Town Room' },
  };

  const mockPrismaService = {
    conversation: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    conversationParticipant: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    message: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      updateMany: jest.fn(),
    },
    report: {
      create: jest.fn(),
    },
    $transaction: jest.fn((promises) => Promise.all(promises)),
  };

  const mockAuditService = {
    log: jest.fn().mockResolvedValue({ id: 'audit-1' }),
  };

  const mockNotificationService = {
    notify: jest.fn().mockResolvedValue({ id: 'notif-1' }),
  };

  const mockRateLimiter = {
    enforceRateLimit: jest.fn().mockResolvedValue({ allowed: true }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConversationService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: AuditService, useValue: mockAuditService },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: RateLimiterService, useValue: mockRateLimiter },
      ],
    }).compile();

    service = module.get<ConversationService>(ConversationService);
  });

  describe('verifyParticipant & Access Control', () => {
    it('throws ForbiddenException if user is not a participant in the conversation', async () => {
      mockPrismaService.conversationParticipant.findUnique.mockResolvedValue(null);

      await expect(service.verifyParticipant(conversationId, strangerId)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('passes if user is a valid participant', async () => {
      mockPrismaService.conversationParticipant.findUnique.mockResolvedValue({
        id: 'part-1',
        conversationId,
        userId: tenantId,
      });

      const participant = await service.verifyParticipant(conversationId, tenantId);
      expect(participant.userId).toBe(tenantId);
    });
  });

  describe('sendMessage', () => {
    it('enforces 30 messages/min rate limit', async () => {
      mockPrismaService.conversationParticipant.findUnique.mockResolvedValue({
        id: 'part-1',
        conversationId,
        userId: tenantId,
      });

      mockPrismaService.conversation.findUnique.mockResolvedValue(mockConversation);
      mockPrismaService.message.create.mockResolvedValue({
        id: messageId,
        conversationId,
        senderId: tenantId,
        content: 'Salam!',
        isRead: false,
        createdAt: new Date(),
        sender: { id: tenantId, fullName: 'Tenant' },
      });
      mockPrismaService.conversation.update.mockResolvedValue(mockConversation);

      await service.sendMessage(conversationId, tenantId, 'Salam!');

      expect(mockRateLimiter.enforceRateLimit).toHaveBeenCalledWith(
        'message',
        tenantId,
        30,
        60,
        expect.any(String),
      );
    });

    it('throws ForbiddenException if conversation is blocked', async () => {
      mockPrismaService.conversationParticipant.findUnique.mockResolvedValue({
        id: 'part-1',
        conversationId,
        userId: tenantId,
      });

      mockPrismaService.conversation.findUnique.mockResolvedValue({
        ...mockConversation,
        isBlocked: true,
        blockedById: landlordId,
      });

      await expect(service.sendMessage(conversationId, tenantId, 'Hello?')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('rejects blank or empty message content', async () => {
      mockPrismaService.conversationParticipant.findUnique.mockResolvedValue({
        id: 'part-1',
        conversationId,
        userId: tenantId,
      });

      mockPrismaService.conversation.findUnique.mockResolvedValue(mockConversation);

      await expect(service.sendMessage(conversationId, tenantId, '   ')).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    it('persists message, updates lastMessageAt, and sends notification to other participant', async () => {
      mockPrismaService.conversationParticipant.findUnique.mockResolvedValue({
        id: 'part-1',
        conversationId,
        userId: tenantId,
      });

      mockPrismaService.conversation.findUnique.mockResolvedValue(mockConversation);
      mockPrismaService.message.create.mockResolvedValue({
        id: messageId,
        conversationId,
        senderId: tenantId,
        content: 'When can I visit the property?',
        isRead: false,
        createdAt: new Date(),
        sender: { id: tenantId, fullName: 'Tenant' },
      });
      mockPrismaService.conversation.update.mockResolvedValue(mockConversation);

      const msg = await service.sendMessage(
        conversationId,
        tenantId,
        'When can I visit the property?',
      );

      expect(msg.id).toBe(messageId);
      expect(mockNotificationService.notify).toHaveBeenCalledWith(
        landlordId,
        NotificationType.MESSAGE_RECEIVED,
        'New Message',
        expect.stringContaining('When can I visit the property?'),
        expect.objectContaining({ conversationId, messageId }),
      );
    });
  });

  describe('markAsRead', () => {
    it('marks unread messages as read and updates participant lastReadAt', async () => {
      mockPrismaService.conversationParticipant.findUnique.mockResolvedValue({
        id: 'part-2',
        conversationId,
        userId: landlordId,
      });

      mockPrismaService.message.updateMany.mockResolvedValue({ count: 3 });
      mockPrismaService.conversationParticipant.update.mockResolvedValue({
        id: 'part-2',
        lastReadAt: new Date(),
      });

      const result = await service.markAsRead(conversationId, landlordId);

      expect(result.success).toBe(true);
      expect(result.updatedCount).toBe(3);
      expect(result.readAt).toBeDefined();
    });
  });

  describe('blockConversation', () => {
    it('sets isBlocked to true and logs audit record', async () => {
      mockPrismaService.conversationParticipant.findUnique.mockResolvedValue({
        id: 'part-1',
        conversationId,
        userId: tenantId,
      });

      mockPrismaService.conversation.update.mockResolvedValue({
        ...mockConversation,
        isBlocked: true,
        blockedById: tenantId,
      });

      const blocked = await service.blockConversation(conversationId, tenantId, 'Spam');

      expect(blocked.isBlocked).toBe(true);
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          actorId: tenantId,
          action: 'conversation:block',
          targetId: conversationId,
        }),
      );
    });
  });

  describe('reportConversation', () => {
    it('creates abuse report for admin review and logs audit record', async () => {
      mockPrismaService.conversationParticipant.findUnique.mockResolvedValue({
        id: 'part-1',
        conversationId,
        userId: tenantId,
      });

      mockPrismaService.report.create.mockResolvedValue({
        id: 'rep-1',
        reporterId: tenantId,
        targetType: 'CONVERSATION',
        targetId: conversationId,
        reason: ReportReason.HARASSMENT,
        details: 'Offensive language used in conversation',
      });

      const report = await service.reportConversation(conversationId, tenantId, {
        reason: ReportReason.HARASSMENT,
        details: 'Offensive language used in conversation',
      });

      expect(report.id).toBe('rep-1');
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          actorId: tenantId,
          action: 'conversation:report',
        }),
      );
    });
  });
});
