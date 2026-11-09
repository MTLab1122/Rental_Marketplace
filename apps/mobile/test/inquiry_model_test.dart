import 'package:flutter_test/flutter_test.dart';
import 'package:rental_peshawar_mobile/core/models/inquiry_model.dart';

void main() {
  group('InquiryModel Tests', () {
    test('Parses inquiry response with status and nested property details', () {
      final json = {
        'id': 'inq-999',
        'propertyId': 'prop-123',
        'landlordId': 'landlord-456',
        'tenantId': 'tenant-789',
        'status': 'PENDING',
        'message': 'Hello, I want to rent this room starting next Monday.',
        'proposedRentPkr': 18000,
        'proposedMoveInDate': '2026-03-01',
        'preferredContactMethod': 'PHONE',
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
      expect(inquiry.status, InquiryStatus.pending);
      expect(inquiry.statusLabel, 'Pending Review');
      expect(inquiry.proposedRentPkr, 18000);
      expect(inquiry.preferredContactMethod, 'PHONE');
    });

    test('Correctly maps all inquiry statuses', () {
      expect(InquiryModel.fromJson({'id': '1', 'propertyId': 'p', 'landlordId': 'l', 'tenantId': 't', 'status': 'ACCEPTED'}).statusLabel, 'Accepted');
      expect(InquiryModel.fromJson({'id': '1', 'propertyId': 'p', 'landlordId': 'l', 'tenantId': 't', 'status': 'REJECTED'}).statusLabel, 'Declined');
      expect(InquiryModel.fromJson({'id': '1', 'propertyId': 'p', 'landlordId': 'l', 'tenantId': 't', 'status': 'EXPIRED'}).statusLabel, 'Expired');
      expect(InquiryModel.fromJson({'id': '1', 'propertyId': 'p', 'landlordId': 'l', 'tenantId': 't', 'status': 'CANCELLED'}).statusLabel, 'Cancelled');
    });
  });
}
