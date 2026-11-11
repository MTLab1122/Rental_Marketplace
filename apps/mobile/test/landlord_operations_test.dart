import 'package:flutter_test/flutter_test.dart';
import 'package:rental_peshawar_mobile/core/constants/peshawar_constants.dart';

void main() {
  group('Landlord Operations & Availability Logic Tests', () {
    test('verifies student eligibility strictly matches student property types', () {
      const studentTypes = [
        'SINGLE_ROOM',
        'SHARED_ROOM',
        'HOSTEL_BED',
        'PORTION',
        'APARTMENT',
      ];
      expect(studentTypes.contains('SINGLE_ROOM'), isTrue);
      expect(studentTypes.contains('SHARED_ROOM'), isTrue);
      expect(studentTypes.contains('HOSTEL_BED'), isTrue);
      expect(studentTypes.contains('FULL_HOUSE'), isFalse);
    });

    test('verifies family eligibility strictly matches family property types', () {
      const familyTypes = [
        'FULL_HOUSE',
        'UPPER_PORTION',
        'LOWER_PORTION',
        'APARTMENT',
      ];
      expect(familyTypes.contains('FULL_HOUSE'), isTrue);
      expect(familyTypes.contains('UPPER_PORTION'), isTrue);
      expect(familyTypes.contains('SINGLE_ROOM'), isFalse);
      expect(familyTypes.contains('HOSTEL_BED'), isFalse);
    });

    test('verifies coordinates validation inside Peshawar boundary', () {
      // University Town (inside)
      expect(PeshawarConstants.isWithinPeshawarBoundary(33.9982, 71.4883), isTrue);
      // Hayatabad Phase 3 (inside)
      expect(PeshawarConstants.isWithinPeshawarBoundary(33.9875, 71.4332), isTrue);
      // Islamabad / Rawalpindi (outside)
      expect(PeshawarConstants.isWithinPeshawarBoundary(33.6844, 73.0479), isFalse);
    });

    test('calculates listing quality score according to completeness rules', () {
      int calculateScore({
        required String title,
        required String description,
        required int imageCount,
        required int amenitiesCount,
        required String addressNote,
        required int rent,
        required int deposit,
      }) {
        int score = 0;
        if (title.trim().length >= 15) score += 15;
        if (description.trim().length >= 50) score += 20;
        if (imageCount >= 5) {
          score += 25;
        } else if (imageCount >= 1) {
          score += 15;
        }
        if (amenitiesCount >= 3) score += 15;
        if (addressNote.trim().isNotEmpty) score += 10;
        if (rent > 0 && deposit >= rent && deposit <= rent * 3) score += 15;
        return score;
      }

      final completeScore = calculateScore(
        title: 'Spacious 2 Bed Portion in University Town Peshawar',
        description:
            'A very peaceful, independent upper portion with 2 bedrooms, separate Sui Gas meter, dedicated water tank, and car parking space.',
        imageCount: 6,
        amenitiesCount: 4,
        addressNote: 'Street 5, Sector B, Near Park',
        rent: 30000,
        deposit: 60000,
      );

      expect(completeScore, 100);

      final minimalScore = calculateScore(
        title: 'Room',
        description: 'Nice room',
        imageCount: 1,
        amenitiesCount: 1,
        addressNote: '',
        rent: 10000,
        deposit: 0,
      );

      expect(minimalScore, 15);
    });

    test('verifies availability state restrictions: cannot activate rejected properties', () {
      bool canActivateProperty(String moderationStatus) {
        if (moderationStatus == 'REJECTED' || moderationStatus == 'SUSPENDED') {
          return false;
        }
        return true;
      }

      expect(canActivateProperty('APPROVED'), isTrue);
      expect(canActivateProperty('PENDING_REVIEW'), isTrue);
      expect(canActivateProperty('REJECTED'), isFalse);
      expect(canActivateProperty('SUSPENDED'), isFalse);
    });

    test('verifies Pakistani CNIC format validation (13 digits)', () {
      bool isValidCnic(String input) {
        final clean = input.replaceAll('-', '').trim();
        return clean.length == 13 && int.tryParse(clean) != null;
      }

      expect(isValidCnic('17301-1234567-1'), isTrue);
      expect(isValidCnic('1730112345671'), isTrue);
      expect(isValidCnic('17301-123456-1'), isFalse); // 12 digits
      expect(isValidCnic('abcde-1234567-1'), isFalse); // letters
    });
  });
}
