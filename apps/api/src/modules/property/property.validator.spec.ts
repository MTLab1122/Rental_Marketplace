import {
  validateEligibilityAndPropertyType,
  validatePeshawarCoordinates,
  calculateHaversineDistanceKm,
} from './property.validator';
import { PropertyEligibility, PropertyType, ErrorCode } from '@rental-peshawar/shared-types';
import { HttpException } from '@nestjs/common';

describe('PropertyValidator', () => {
  describe('validateEligibilityAndPropertyType', () => {
    it('accepts all valid STUDENTS_ONLY property types', () => {
      const allowedStudentTypes = [
        PropertyType.SINGLE_ROOM,
        PropertyType.SHARED_ROOM,
        PropertyType.HOSTEL,
        PropertyType.PORTION,
        PropertyType.APARTMENT,
      ];

      for (const pType of allowedStudentTypes) {
        expect(() =>
          validateEligibilityAndPropertyType(PropertyEligibility.STUDENTS_ONLY, pType),
        ).not.toThrow();
      }
    });

    it('rejects invalid STUDENTS_ONLY property types with 422', () => {
      const forbiddenStudentTypes = [PropertyType.HOUSE, PropertyType.RESIDENTIAL_UNIT];

      for (const pType of forbiddenStudentTypes) {
        try {
          validateEligibilityAndPropertyType(PropertyEligibility.STUDENTS_ONLY, pType);
          fail(`Should have thrown for ${pType}`);
        } catch (err: unknown) {
          const httpErr = err as HttpException;
          expect(httpErr.getStatus()).toBe(422);
          const response = httpErr.getResponse() as Record<string, unknown>;
          expect(response['code']).toBe(ErrorCode.INVALID_ELIGIBILITY_PROPERTY_TYPE);
        }
      }
    });

    it('accepts all valid FAMILIES_ONLY property types', () => {
      const allowedFamilyTypes = [
        PropertyType.HOUSE,
        PropertyType.PORTION,
        PropertyType.APARTMENT,
        PropertyType.RESIDENTIAL_UNIT,
      ];

      for (const pType of allowedFamilyTypes) {
        expect(() =>
          validateEligibilityAndPropertyType(PropertyEligibility.FAMILIES_ONLY, pType),
        ).not.toThrow();
      }
    });

    it('rejects invalid FAMILIES_ONLY property types with 422', () => {
      const forbiddenFamilyTypes = [
        PropertyType.SINGLE_ROOM,
        PropertyType.SHARED_ROOM,
        PropertyType.HOSTEL,
      ];

      for (const pType of forbiddenFamilyTypes) {
        try {
          validateEligibilityAndPropertyType(PropertyEligibility.FAMILIES_ONLY, pType);
          fail(`Should have thrown for ${pType}`);
        } catch (err: unknown) {
          const httpErr = err as HttpException;
          expect(httpErr.getStatus()).toBe(422);
          const response = httpErr.getResponse() as Record<string, unknown>;
          expect(response['code']).toBe(ErrorCode.INVALID_ELIGIBILITY_PROPERTY_TYPE);
        }
      }
    });
  });

  describe('validatePeshawarCoordinates', () => {
    it('accepts coordinates inside Peshawar (University Town, Saddar, Hayatabad)', () => {
      // University Town
      expect(() => validatePeshawarCoordinates(33.9982, 71.4883)).not.toThrow();
      // Saddar
      expect(() => validatePeshawarCoordinates(34.0086, 71.5583)).not.toThrow();
      // Hayatabad
      expect(() => validatePeshawarCoordinates(33.9875, 71.4332)).not.toThrow();
    });

    it('rejects coordinates outside Peshawar with 422 LOCATION_OUTSIDE_PESHAWAR', () => {
      const outsidePoints = [
        { name: 'Islamabad', lat: 33.6844, lng: 73.0479 },
        { name: 'Lahore', lat: 31.5204, lng: 74.3587 },
        { name: 'London', lat: 51.5074, lng: -0.1278 },
      ];

      for (const pt of outsidePoints) {
        try {
          validatePeshawarCoordinates(pt.lat, pt.lng);
          fail(`Should have thrown for ${pt.name}`);
        } catch (err: unknown) {
          const httpErr = err as HttpException;
          expect(httpErr.getStatus()).toBe(422);
          const response = httpErr.getResponse() as Record<string, unknown>;
          expect(response['code']).toBe(ErrorCode.LOCATION_OUTSIDE_PESHAWAR);
        }
      }
    });
  });

  describe('calculateHaversineDistanceKm', () => {
    it('calculates approximately correct distance in km', () => {
      // University Town (33.9982, 71.4883) to Saddar (34.0086, 71.5583) ~ 6.5 km
      const distance = calculateHaversineDistanceKm(33.9982, 71.4883, 34.0086, 71.5583);
      expect(distance).toBeGreaterThan(5);
      expect(distance).toBeLessThan(8);
    });
  });
});
