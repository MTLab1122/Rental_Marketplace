import 'package:flutter_test/flutter_test.dart';
import 'package:rental_peshawar_mobile/core/constants/peshawar_constants.dart';

void main() {
  group('Peshawar Municipal Boundary Verification Tests', () {
    test('Verified localities inside Peshawar return true', () {
      // University Town (33.9982, 71.4883)
      expect(PeshawarConstants.isWithinPeshawarBoundary(33.9982, 71.4883), isTrue);

      // Hayatabad (33.9875, 71.4332)
      expect(PeshawarConstants.isWithinPeshawarBoundary(33.9875, 71.4332), isTrue);

      // Saddar (34.0086, 71.5583)
      expect(PeshawarConstants.isWithinPeshawarBoundary(34.0086, 71.5583), isTrue);

      // Gulbahar (34.0162, 71.5912)
      expect(PeshawarConstants.isWithinPeshawarBoundary(34.0162, 71.5912), isTrue);
    });

    test('Coordinates outside Peshawar municipal boundary are rejected', () {
      // Islamabad / Rawalpindi (33.6844, 73.0479)
      expect(PeshawarConstants.isWithinPeshawarBoundary(33.6844, 73.0479), isFalse);

      // Lahore (31.5204, 74.3587)
      expect(PeshawarConstants.isWithinPeshawarBoundary(31.5204, 74.3587), isFalse);

      // Karachi (24.8607, 67.0011)
      expect(PeshawarConstants.isWithinPeshawarBoundary(24.8607, 67.0011), isFalse);
    });

    test('Peshawar localities list contains exactly 15 verified entries', () {
      expect(PeshawarConstants.localities.length, 15);
      expect(PeshawarConstants.localities.contains('University Town'), isTrue);
      expect(PeshawarConstants.localities.contains('Hayatabad'), isTrue);
      expect(PeshawarConstants.localities.contains('Regi Model Town'), isTrue);
    });
  });
}
