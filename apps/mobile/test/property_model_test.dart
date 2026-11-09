import 'package:flutter_test/flutter_test.dart';
import 'package:rental_peshawar_mobile/core/models/property_model.dart';

void main() {
  group('PropertyModel Deserialization & Formatting', () {
    test('Correctly parses API json response with PKR currency formatting', () {
      final json = {
        'id': 'prop-123',
        'title': 'Furnished Room near Khyber Medical College',
        'slug': 'furnished-room-kmc',
        'description': 'Walking distance to campus, backup generator available.',
        'eligibility': 'STUDENTS_ONLY',
        'propertyType': 'SINGLE_ROOM',
        'monthlyRentPkr': 18500,
        'securityDepositPkr': 20000,
        'bedrooms': 1,
        'bathrooms': 1,
        'areaSqFt': 220,
        'furnishing': 'Furnished',
        'locality': {
          'id': 'loc-1',
          'name': 'University Town',
          'slug': 'university-town',
        },
        'coordinates': {
          'latitude': 33.9982,
          'longitude': 71.4883,
        },
        'isAvailable': true,
        'isFeatured': true,
        'images': [
          {
            'id': 'img-1',
            'url': 'https://res.cloudinary.com/rental/image/upload/v1/room.webp',
            'caption': 'Front Bedroom',
            'isPrimary': true,
            'sortOrder': 0,
          }
        ],
        'amenities': [
          {
            'id': 'am-1',
            'name': 'WiFi',
            'code': 'wifi',
          }
        ],
      };

      final property = PropertyModel.fromJson(json);

      expect(property.id, 'prop-123');
      expect(property.title, 'Furnished Room near Khyber Medical College');
      expect(property.eligibility, PropertyEligibility.studentsOnly);
      expect(property.propertyType, PropertyType.singleRoom);
      expect(property.localityName, 'University Town');
      expect(property.formattedRent, 'PKR 18,500/mo');
      expect(property.formattedDeposit, 'PKR 20,000');
      expect(property.isFeatured, isTrue);
      expect(property.images.length, 1);
      expect(property.images.first.url, contains('cloudinary.com'));
      expect(property.amenities.length, 1);
      expect(property.amenities.first.name, 'WiFi');
      expect(property.latitude, 33.9982);
      expect(property.longitude, 71.4883);
    });

    test('Defaults localityName and coordinates when nested object missing', () {
      final minimalJson = {
        'id': 'prop-min',
        'title': 'Basic Apartment',
        'slug': 'basic-apt',
        'eligibility': 'FAMILIES_ONLY',
        'propertyType': 'APARTMENT',
        'monthlyRentPkr': 35000,
        'securityDepositPkr': 70000,
        'bedrooms': 2,
        'bathrooms': 2,
      };

      final prop = PropertyModel.fromJson(minimalJson);
      expect(prop.id, 'prop-min');
      expect(prop.eligibility, PropertyEligibility.familiesOnly);
      expect(prop.localityName, 'Peshawar');
      expect(prop.monthlyRentPkr, 35000);
      expect(prop.formattedRent, 'PKR 35,000/mo');
    });
  });
}
