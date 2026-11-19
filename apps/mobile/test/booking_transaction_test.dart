import 'package:flutter_test/flutter_test.dart';
import 'package:rental_peshawar_mobile/core/models/booking_model.dart';

void main() {
  group('Phase 13: Mobile Booking, Payment & Dispute Model Tests', () {
    test('BookingModel correctly deserializes JSON and maps statuses', () {
      final json = {
        'id': 'booking-123',
        'inquiryId': 'inq-456',
        'propertyId': 'prop-789',
        'property': {
          'title': 'University Town Apartment',
          'address': 'Jamrud Road, Peshawar',
        },
        'tenantId': 'tenant-1',
        'landlordId': 'landlord-2',
        'status': 'CONFIRMED',
        'startDate': '2026-03-01T00:00:00.000Z',
        'endDate': '2027-02-28T00:00:00.000Z',
        'monthlyRentPkr': 45000,
        'securityDepositPkr': 90000,
        'totalInitialAmountPkr': 135000,
        'lockExpiresAt': '2026-03-02T10:00:00.000Z',
        'notes': 'Requested early morning key handover',
        'createdAt': '2026-02-23T12:00:00.000Z',
      };

      final model = BookingModel.fromJson(json);

      expect(model.id, 'booking-123');
      expect(model.propertyTitle, 'University Town Apartment');
      expect(model.status, BookingStatus.confirmed);
      expect(model.monthlyRentPkr, 45000.0);
      expect(model.securityDepositPkr, 90000.0);
      expect(model.totalInitialAmountPkr, 135000.0);
      expect(model.lockExpiresAt, isNotNull);

      final outJson = model.toJson();
      expect(outJson['status'], 'CONFIRMED');
      expect(outJson['monthlyRentPkr'], 45000.0);
    });

    test('PaymentModel correctly deserializes and maps payment methods', () {
      final json = {
        'id': 'pay-1',
        'bookingId': 'booking-123',
        'payerId': 'tenant-1',
        'recipientId': 'landlord-2',
        'amountPkr': 135000,
        'currency': 'PKR',
        'status': 'SUCCEEDED',
        'paymentMethodType': 'MANUAL_BANK_TRANSFER',
        'providerTransactionId': 'BOK-987654',
        'receiptUrl': 'https://storage.example.com/slip.jpg',
        'createdAt': '2026-02-23T14:00:00.000Z',
      };

      final payment = PaymentModel.fromJson(json);

      expect(payment.id, 'pay-1');
      expect(payment.amountPkr, 135000.0);
      expect(payment.status, PaymentStatus.succeeded);
      expect(payment.methodType, PaymentMethodType.manualBankTransfer);
      expect(payment.providerTransactionId, 'BOK-987654');
    });

    test('RentalAgreementModel deserializes terms and signature timestamps', () {
      final json = {
        'id': 'agr-1',
        'bookingId': 'booking-123',
        'title': 'Residential Tenancy Agreement',
        'termsHtml': '<p>Terms of Tenancy</p>',
        'version': 1,
        'status': 'ACTIVE',
        'signedByTenantAt': '2026-02-23T15:00:00.000Z',
        'signedByLandlordAt': '2026-02-23T16:00:00.000Z',
      };

      final agreement = RentalAgreementModel.fromJson(json);

      expect(agreement.id, 'agr-1');
      expect(agreement.status, AgreementStatus.active);
      expect(agreement.signedByTenantAt, isNotNull);
      expect(agreement.signedByLandlordAt, isNotNull);
    });

    test('DisputeModel deserializes category and escrow hold amount', () {
      final json = {
        'id': 'disp-1',
        'bookingId': 'booking-123',
        'initiatorId': 'tenant-1',
        'respondentId': 'landlord-2',
        'category': 'PROPERTY_NOT_AS_DESCRIBED',
        'status': 'OPEN',
        'description': 'Portion water supply motor non-functional',
        'amountDisputedPkr': 45000,
        'createdAt': '2026-02-23T17:00:00.000Z',
      };

      final dispute = DisputeModel.fromJson(json);

      expect(dispute.id, 'disp-1');
      expect(dispute.category, DisputeCategory.propertyNotAsDescribed);
      expect(dispute.status, DisputeStatus.open);
      expect(dispute.amountDisputedPkr, 45000.0);
    });
  });
}

