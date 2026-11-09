import 'package:flutter_test/flutter_test.dart';
import 'package:rental_peshawar_mobile/core/models/inquiry_model.dart';
import 'package:rental_peshawar_mobile/core/models/message_model.dart';
import 'package:rental_peshawar_mobile/core/models/conversation_model.dart';
import 'package:rental_peshawar_mobile/core/models/notification_model.dart';

void main() {
  group('InquiryModel Tests', () {
    test('Parses inquiry response with status and nested property details', () {
      final json = {
        'id': 'inq-999',
        'propertyId': 'prop-123',
        'landlordId': 'landlord-456',
        'tenantId': 'tenant-789',
        'status': 'SUBMITTED',
        'message': 'Hello, I want to rent this room starting next Monday.',
        'proposedRentPkr': 18000,
        'proposedMoveInDate': '2026-03-01',
        'preferredContactMethod': 'PHONE',
        'conversationId': 'conv-111',
        'canContactWhatsapp': true,
        'whatsappUrl': 'https://wa.me/923001234567?text=Assalam-o-Alaikum',
        'createdAt': '2026-02-15T12:00:00.000Z',
        'property': {
          'title': 'Furnished Room near KMC',
          'locality': {'name': 'University Town'},
          'images': [
            {'url': 'https://example.com/image.jpg'}
          ],
        },
      };

      final inquiry = InquiryModel.fromJson(json);

      expect(inquiry.id, 'inq-999');
      expect(inquiry.propertyId, 'prop-123');
      expect(inquiry.propertyTitle, 'Furnished Room near KMC');
      expect(inquiry.propertyLocality, 'University Town');
      expect(inquiry.status, InquiryStatus.submitted);
      expect(inquiry.statusLabel, 'Submitted');
      expect(inquiry.proposedRentPkr, 18000);
      expect(inquiry.preferredContactMethod, 'PHONE');
      expect(inquiry.conversationId, 'conv-111');
      expect(inquiry.canContactWhatsapp, true);
      expect(inquiry.whatsappUrl, 'https://wa.me/923001234567?text=Assalam-o-Alaikum');
    });

    test('Correctly maps all inquiry statuses', () {
      expect(InquiryModel.fromJson({'id': '1', 'propertyId': 'p', 'landlordId': 'l', 'tenantId': 't', 'status': 'SUBMITTED'}).statusLabel, 'Submitted');
      expect(InquiryModel.fromJson({'id': '1', 'propertyId': 'p', 'landlordId': 'l', 'tenantId': 't', 'status': 'SEEN'}).statusLabel, 'Seen by Landlord');
      expect(InquiryModel.fromJson({'id': '1', 'propertyId': 'p', 'landlordId': 'l', 'tenantId': 't', 'status': 'REPLIED'}).statusLabel, 'Landlord Replied');
      expect(InquiryModel.fromJson({'id': '1', 'propertyId': 'p', 'landlordId': 'l', 'tenantId': 't', 'status': 'ACCEPTED'}).statusLabel, 'Accepted');
      expect(InquiryModel.fromJson({'id': '1', 'propertyId': 'p', 'landlordId': 'l', 'tenantId': 't', 'status': 'DECLINED'}).statusLabel, 'Declined');
      expect(InquiryModel.fromJson({'id': '1', 'propertyId': 'p', 'landlordId': 'l', 'tenantId': 't', 'status': 'CLOSED'}).statusLabel, 'Closed');
    });
  });

  group('Messaging & Notifications Models Tests', () {
    test('Parses MessageModel correctly', () {
      final json = {
        'id': 'msg-1',
        'conversationId': 'conv-1',
        'senderId': 'user-1',
        'content': 'Assalam-o-Alaikum, is the room available?',
        'isRead': true,
        'readAt': '2026-02-18T10:00:00.000Z',
        'createdAt': '2026-02-18T09:30:00.000Z',
        'sender': {'id': 'user-1', 'fullName': 'Tariq Khan'},
      };

      final msg = MessageModel.fromJson(json);
      expect(msg.id, 'msg-1');
      expect(msg.senderId, 'user-1');
      expect(msg.content, 'Assalam-o-Alaikum, is the room available?');
      expect(msg.isRead, true);
      expect(msg.senderName, 'Tariq Khan');
    });

    test('Parses ConversationModel with participants and safety block', () {
      final json = {
        'id': 'conv-101',
        'propertyId': 'prop-55',
        'isBlocked': true,
        'blockedById': 'user-1',
        'unreadCount': 2,
        'canContactWhatsapp': true,
        'whatsappUrl': 'https://wa.me/923001234567?text=Assalam',
        'participants': [
          {'id': 'part-1', 'userId': 'user-tenant', 'fullName': 'Ahmad Tenant'},
          {'id': 'part-2', 'userId': 'user-landlord', 'fullName': 'Gul Landlord'},
        ],
        'property': {
          'title': 'Hayatabad Luxury Portion',
          'locality': {'name': 'Hayatabad'},
        },
      };

      final conv = ConversationModel.fromJson(json);
      expect(conv.id, 'conv-101');
      expect(conv.isBlocked, true);
      expect(conv.unreadCount, 2);
      expect(conv.canContactWhatsapp, true);
      expect(conv.propertyTitle, 'Hayatabad Luxury Portion');
      expect(conv.propertyLocality, 'Hayatabad');
      expect(conv.getOtherParticipantName('user-tenant'), 'Gul Landlord');
      expect(conv.getOtherParticipantName('user-landlord'), 'Ahmad Tenant');
    });

    test('Parses NotificationModel correctly', () {
      final json = {
        'id': 'notif-1',
        'userId': 'user-tenant',
        'type': 'INQUIRY_REPLIED',
        'title': 'Inquiry Accepted',
        'body': 'Your inquiry for University Town room was accepted.',
        'isRead': false,
        'createdAt': '2026-02-18T12:00:00.000Z',
        'data': {'inquiryId': 'inq-999', 'conversationId': 'conv-101'},
      };

      final notif = NotificationModel.fromJson(json);
      expect(notif.id, 'notif-1');
      expect(notif.type, 'INQUIRY_REPLIED');
      expect(notif.isRead, false);
      expect(notif.data?['inquiryId'], 'inq-999');
    });
  });
}
