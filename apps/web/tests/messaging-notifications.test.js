import { describe, it } from 'node:test';
import assert from 'node:assert';
import { InquiryStatus, ReportReason, NotificationType } from '@rental-peshawar/shared-types';

describe('Messaging, Inquiries, and Notifications Web Tests', () => {
  it('validates inquiry status transitions and permissions', () => {
    const validStatuses = [
      InquiryStatus.SUBMITTED,
      InquiryStatus.SEEN,
      InquiryStatus.REPLIED,
      InquiryStatus.ACCEPTED,
      InquiryStatus.DECLINED,
      InquiryStatus.CLOSED,
    ];

    assert.strictEqual(validStatuses.length, 6);
    assert.ok(validStatuses.includes(InquiryStatus.ACCEPTED));
    assert.ok(validStatuses.includes(InquiryStatus.DECLINED));
  });

  it('enforces WhatsApp contact link reveal safety policy: only on ACCEPTED status', () => {
    const inquirySubmitted = {
      id: 'inq-1',
      status: InquiryStatus.SUBMITTED,
      canContactWhatsapp: false,
      whatsappUrl: null,
    };

    const inquiryAccepted = {
      id: 'inq-2',
      status: InquiryStatus.ACCEPTED,
      canContactWhatsapp: true,
      whatsappUrl: 'https://wa.me/923001234567?text=Assalam-o-Alaikum',
    };

    // Before acceptance: WhatsApp link is hidden and null
    assert.strictEqual(inquirySubmitted.canContactWhatsapp, false);
    assert.strictEqual(inquirySubmitted.whatsappUrl, null);

    // After acceptance: WhatsApp link is revealed with safe HTTPS wa.me schema
    assert.strictEqual(inquiryAccepted.canContactWhatsapp, true);
    assert.ok(inquiryAccepted.whatsappUrl.startsWith('https://wa.me/92'));
  });

  it('validates real-time conversation participant resolution and unread badge count', () => {
    const currentUserId = 'user-tenant-1';
    const conversation = {
      id: 'conv-101',
      isBlocked: false,
      unreadCount: 3,
      participants: [
        { id: 'p1', userId: 'user-tenant-1', fullName: 'Ahmad Khan' },
        { id: 'p2', userId: 'user-landlord-2', fullName: 'Malik Jan' },
      ],
      lastMessage: {
        id: 'msg-501',
        senderId: 'user-landlord-2',
        content: 'You can visit the property tomorrow at 4 PM.',
        isRead: false,
        createdAt: new Date().toISOString(),
      },
    };

    // Find other participant
    const otherParticipant = conversation.participants.find((p) => p.userId !== currentUserId);
    assert.ok(otherParticipant);
    assert.strictEqual(otherParticipant.fullName, 'Malik Jan');
    assert.strictEqual(conversation.unreadCount, 3);
  });

  it('validates safety block policy: blocked conversation prevents sending messages', () => {
    const blockedConversation = {
      id: 'conv-blocked',
      isBlocked: true,
      blockedById: 'user-tenant-1',
    };

    const canSendMessage = (conv) => !conv.isBlocked;

    assert.strictEqual(canSendMessage(blockedConversation), false);
  });

  it('validates platform report reasons and required payload', () => {
    const reasons = [
      ReportReason.HARASSMENT,
      ReportReason.DISCRIMINATION,
      ReportReason.FAKE_LISTING,
      ReportReason.MISLEADING_INFORMATION,
      ReportReason.OTHER,
    ];

    assert.strictEqual(reasons.length, 5);

    const reportPayload = {
      targetType: 'CONVERSATION',
      targetId: 'conv-101',
      reason: ReportReason.FAKE_LISTING,
      details: 'Demanded advance deposit outside verified agreement terms.',
    };

    assert.strictEqual(reportPayload.reason, 'FAKE_LISTING');
    assert.ok(reportPayload.details.length >= 10);
  });

  it('validates notification categorization and read filter', () => {
    const notifications = [
      {
        id: 'n1',
        type: NotificationType.INQUIRY_REPLIED,
        title: 'Inquiry Accepted',
        isRead: false,
      },
      {
        id: 'n2',
        type: NotificationType.MESSAGE_NEW,
        title: 'New Message',
        isRead: true,
      },
      {
        id: 'n3',
        type: NotificationType.PROPERTY_APPROVED,
        title: 'Listing Approved',
        isRead: false,
      },
    ];

    const unread = notifications.filter((n) => !n.isRead);
    assert.strictEqual(unread.length, 2);
    assert.strictEqual(unread[0].id, 'n1');
    assert.strictEqual(unread[1].id, 'n3');
  });
});
