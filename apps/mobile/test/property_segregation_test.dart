import 'package:flutter_test/flutter_test.dart';
import 'package:rental_peshawar_mobile/core/models/property_model.dart';
import 'package:rental_peshawar_mobile/core/models/user_model.dart';

void main() {
  group('Non-Negotiable Student vs Family Segregation Rules', () {
    final studentListing = PropertyModel(
      id: 'p-student-1',
      title: 'University Town Student Hostel Single Room',
      slug: 'uop-hostel-room-1',
      eligibility: PropertyEligibility.studentsOnly,
      propertyType: PropertyType.singleRoom,
      monthlyRentPkr: 16000,
      securityDepositPkr: 16000,
      bedrooms: 1,
      bathrooms: 1,
      localityName: 'University Town',
      latitude: 33.9982,
      longitude: 71.4883,
    );

    final familyListing = PropertyModel(
      id: 'p-family-1',
      title: 'Hayatabad Phase 3 Upper Portion for Family',
      slug: 'hayatabad-phase3-portion',
      eligibility: PropertyEligibility.familiesOnly,
      propertyType: PropertyType.upperPortion,
      monthlyRentPkr: 45000,
      securityDepositPkr: 90000,
      bedrooms: 3,
      bathrooms: 3,
      localityName: 'Hayatabad',
      latitude: 33.9875,
      longitude: 71.4332,
    );

    final mixedInventory = [studentListing, familyListing];

    test('Student mode filter rejects all family listings with zero crossover', () {
      final currentMode = TenantType.student;
      final expectedEligibility = currentMode == TenantType.student
          ? PropertyEligibility.studentsOnly
          : PropertyEligibility.familiesOnly;

      final studentFeed = mixedInventory
          .where((p) => p.eligibility == expectedEligibility)
          .toList();

      expect(studentFeed.length, 1);
      expect(studentFeed.first.id, 'p-student-1');
      expect(studentFeed.first.eligibility, PropertyEligibility.studentsOnly);
      expect(studentFeed.any((p) => p.eligibility == PropertyEligibility.familiesOnly), isFalse);
    });

    test('Family mode filter rejects all student listings with zero crossover', () {
      final currentMode = TenantType.family;
      final expectedEligibility = currentMode == TenantType.student
          ? PropertyEligibility.studentsOnly
          : PropertyEligibility.familiesOnly;

      final familyFeed = mixedInventory
          .where((p) => p.eligibility == expectedEligibility)
          .toList();

      expect(familyFeed.length, 1);
      expect(familyFeed.first.id, 'p-family-1');
      expect(familyFeed.first.eligibility, PropertyEligibility.familiesOnly);
      expect(familyFeed.any((p) => p.eligibility == PropertyEligibility.studentsOnly), isFalse);
    });

    test('Property label returns expected text for students and families', () {
      expect(studentListing.eligibilityLabel, 'Students Only');
      expect(familyListing.eligibilityLabel, 'Families Only');
    });
  });
}
