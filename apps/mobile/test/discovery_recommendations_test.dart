import 'package:flutter_test/flutter_test.dart';
import 'package:rental_peshawar_mobile/core/models/saved_search_model.dart';
import 'package:rental_peshawar_mobile/core/models/property_model.dart';
import 'package:rental_peshawar_mobile/core/models/user_model.dart';

void main() {
  group('Phase 12: Mobile Saved Searches, Alerts & Discovery Tests', () {
    test('SavedSearchModel deserializes and serializes with correct frequency', () {
      final json = {
        'id': 'search-1',
        'userId': 'user-1',
        'name': 'University Town 2-Bed',
        'filters': {
          'localityId': 'loc-1',
          'propertyType': 'APARTMENT',
          'bedrooms': 2,
        },
        'filterSignature': 'sig-12345',
        'alertsEnabled': true,
        'frequency': 'DAILY',
        'createdAt': '2026-02-22T10:00:00.000Z',
      };

      final model = SavedSearchModel.fromJson(json);

      expect(model.id, 'search-1');
      expect(model.name, 'University Town 2-Bed');
      expect(model.alertsEnabled, isTrue);
      expect(model.frequency, AlertFrequency.daily);
      expect(model.filters['bedrooms'], 2);

      final outJson = model.toJson();
      expect(outJson['frequency'], 'DAILY');
    });

    test('AlertFrequency extension parses all values and fallback correctly', () {
      expect(AlertFrequencyExt.fromString('INSTANT'), AlertFrequency.instant);
      expect(AlertFrequencyExt.fromString('DAILY'), AlertFrequency.daily);
      expect(AlertFrequencyExt.fromString('WEEKLY'), AlertFrequency.weekly);
      expect(AlertFrequencyExt.fromString('UNKNOWN'), AlertFrequency.instant);
    });

    test('NotificationPreferenceModel handles default and custom settings', () {
      final defaultPrefs = NotificationPreferenceModel();
      expect(defaultPrefs.inAppAlerts, isTrue);
      expect(defaultPrefs.pushAlerts, isTrue);
      expect(defaultPrefs.emailAlerts, isTrue);
      expect(defaultPrefs.dailyDigest, isTrue);

      final customJson = {
        'inAppAlerts': true,
        'pushAlerts': false,
        'emailAlerts': false,
        'instantAlerts': true,
        'dailyDigest': false,
        'weeklyDigest': true,
        'recommendations': true,
      };

      final customModel = NotificationPreferenceModel.fromJson(customJson);
      expect(customModel.pushAlerts, isFalse);
      expect(customModel.emailAlerts, isFalse);
      expect(customModel.weeklyDigest, isTrue);
    });

    test('Strict recommendation segregation: student properties vs family properties', () {
      final studentProperty = PropertyModel(
        id: 'p1',
        title: 'Single Room for Student',
        slug: 'single-room-student',
        eligibility: PropertyEligibility.studentsOnly,
        propertyType: PropertyType.singleRoom,
        monthlyRentPkr: 15000,
        securityDepositPkr: 15000,
        bedrooms: 1,
        bathrooms: 1,
        localityName: 'University Town',
        latitude: 34.0,
        longitude: 71.5,
      );

      final familyProperty = PropertyModel(
        id: 'p2',
        title: 'Family Portion in Hayatabad',
        slug: 'family-portion-hayatabad',
        eligibility: PropertyEligibility.familiesOnly,
        propertyType: PropertyType.upperPortion,
        monthlyRentPkr: 45000,
        securityDepositPkr: 45000,
        bedrooms: 3,
        bathrooms: 2,
        localityName: 'Hayatabad',
        latitude: 33.9,
        longitude: 71.4,
      );

      final recommendations = [
        RecommendationItemModel(
          property: studentProperty,
          reason: 'because_you_viewed',
          reasonLabel: 'Because you viewed listings in University Town',
          score: 95,
        ),
        RecommendationItemModel(
          property: familyProperty,
          reason: 'popular_in_locality',
          reasonLabel: 'Popular in Hayatabad',
          score: 88,
        ),
      ];

      // Student view: filter by student eligibility
      final studentFiltered = recommendations
          .where((r) => r.property.eligibility == PropertyEligibility.studentsOnly)
          .toList();

      expect(studentFiltered.length, 1);
      expect(studentFiltered.first.property.id, 'p1');
      expect(studentFiltered.any((r) => r.property.eligibility == PropertyEligibility.familiesOnly), isFalse);

      // Family view: filter by family eligibility
      final familyFiltered = recommendations
          .where((r) => r.property.eligibility == PropertyEligibility.familiesOnly)
          .toList();

      expect(familyFiltered.length, 1);
      expect(familyFiltered.first.property.id, 'p2');
      expect(familyFiltered.any((r) => r.property.eligibility == PropertyEligibility.studentsOnly), isFalse);
    });
  });
}
