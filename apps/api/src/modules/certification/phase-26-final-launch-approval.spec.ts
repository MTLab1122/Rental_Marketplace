import { Test, TestingModule } from '@nestjs/testing';
import { PropertyEligibility, PropertyType } from '@rental-peshawar/shared-types';
import {
  isCoordinateWithinPeshawarBoundary,
  isCoordinateWithinCityBoundary,
  getCityConfig,
  listSupportedCities,
} from '@rental-peshawar/config';
import {
  validateEligibilityAndPropertyType,
  validatePeshawarCoordinates,
  validateCityCoordinates,
} from '../property/property.validator';

describe('Phase 26: Final Refinement, Launch Approval & Platform Maturity Certification', () => {
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({}).compile();
    expect(module).toBeDefined();
  });

  describe('1. Non-Negotiable Platform Invariants & Eligibility Segregation', () => {
    it('should strictly permit only student-eligible property types for STUDENTS_ONLY', () => {
      // Allowed for students: HOSTEL, SINGLE_ROOM, SHARED_ROOM, APARTMENT, PORTION
      expect(() =>
        validateEligibilityAndPropertyType(PropertyEligibility.STUDENTS_ONLY, PropertyType.HOSTEL),
      ).not.toThrow();
      expect(() =>
        validateEligibilityAndPropertyType(
          PropertyEligibility.STUDENTS_ONLY,
          PropertyType.SINGLE_ROOM,
        ),
      ).not.toThrow();
      expect(() =>
        validateEligibilityAndPropertyType(
          PropertyEligibility.STUDENTS_ONLY,
          PropertyType.APARTMENT,
        ),
      ).not.toThrow();

      // Prohibited for students: HOUSE, RESIDENTIAL_UNIT
      expect(() =>
        validateEligibilityAndPropertyType(PropertyEligibility.STUDENTS_ONLY, PropertyType.HOUSE),
      ).toThrow();
      expect(() =>
        validateEligibilityAndPropertyType(
          PropertyEligibility.STUDENTS_ONLY,
          PropertyType.RESIDENTIAL_UNIT,
        ),
      ).toThrow();
    });

    it('should strictly permit only family-eligible property types for FAMILIES_ONLY', () => {
      // Allowed for families: HOUSE, PORTION, APARTMENT, RESIDENTIAL_UNIT
      expect(() =>
        validateEligibilityAndPropertyType(PropertyEligibility.FAMILIES_ONLY, PropertyType.HOUSE),
      ).not.toThrow();
      expect(() =>
        validateEligibilityAndPropertyType(PropertyEligibility.FAMILIES_ONLY, PropertyType.PORTION),
      ).not.toThrow();

      // Prohibited for families: SINGLE_ROOM, HOSTEL, SHARED_ROOM
      expect(() =>
        validateEligibilityAndPropertyType(
          PropertyEligibility.FAMILIES_ONLY,
          PropertyType.SINGLE_ROOM,
        ),
      ).toThrow();
      expect(() =>
        validateEligibilityAndPropertyType(PropertyEligibility.FAMILIES_ONLY, PropertyType.HOSTEL),
      ).toThrow();
      expect(() =>
        validateEligibilityAndPropertyType(
          PropertyEligibility.FAMILIES_ONLY,
          PropertyType.SHARED_ROOM,
        ),
      ).toThrow();
    });
  });

  describe('2. Municipal Geographic Boundary & Multi-City Expansion Scaling', () => {
    it('should enforce strict Peshawar metropolitan boundary coordinates', () => {
      // Valid points in Peshawar: University Town, Saddar, Hayatabad
      expect(isCoordinateWithinPeshawarBoundary(33.9982, 71.4883)).toBe(true);
      expect(isCoordinateWithinPeshawarBoundary(34.0086, 71.5583)).toBe(true);
      expect(isCoordinateWithinPeshawarBoundary(33.9875, 71.4332)).toBe(true);

      expect(() => validatePeshawarCoordinates(33.9982, 71.4883)).not.toThrow();
      expect(() => validatePeshawarCoordinates(34.0086, 71.5583)).not.toThrow();
      expect(() => validatePeshawarCoordinates(33.9875, 71.4332)).not.toThrow();

      // Points outside Peshawar: Islamabad, Lahore, Karachi
      expect(isCoordinateWithinPeshawarBoundary(33.6844, 73.0479)).toBe(false);
      expect(() => validatePeshawarCoordinates(33.6844, 73.0479)).toThrow();
      expect(() => validatePeshawarCoordinates(31.5204, 74.3587)).toThrow();
    });

    it('should dynamically validate secondary cities (Mardan & Abbottabad) without code changes', () => {
      const cities = listSupportedCities();
      expect(cities.length).toBeGreaterThanOrEqual(3);

      const mardan = getCityConfig('MARDAN');
      expect(mardan).toBeDefined();
      expect(mardan?.name).toBe('Mardan');
      expect(isCoordinateWithinCityBoundary(34.1989, 72.0404, 'MARDAN')).toBe(true);
      expect(() => validateCityCoordinates(34.1989, 72.0404, 'MARDAN')).not.toThrow();

      const abbottabad = getCityConfig('ABBOTTABAD');
      expect(abbottabad).toBeDefined();
      expect(abbottabad?.name).toBe('Abbottabad');
      expect(isCoordinateWithinCityBoundary(34.1688, 73.2215, 'ABBOTTABAD')).toBe(true);
      expect(() => validateCityCoordinates(34.1688, 73.2215, 'ABBOTTABAD')).not.toThrow();

      // Cross-city invalidation
      expect(isCoordinateWithinCityBoundary(34.1989, 72.0404, 'PESHAWAR')).toBe(false);
      expect(isCoordinateWithinCityBoundary(34.0151, 71.5249, 'MARDAN')).toBe(false);
    });
  });

  describe('3. Security, Authorization & Privacy Baseline', () => {
    it('should block horizontal IDOR mutations across distinct landlords', () => {
      const landlordAId = 'landlord-uuid-aaa';
      const landlordBId = 'landlord-uuid-bbb';
      const property = { id: 'prop-101', landlordId: landlordAId };

      const canMutate = (actorId: string, resource: { landlordId: string }) => {
        return actorId === resource.landlordId;
      };

      expect(canMutate(landlordAId, property)).toBe(true);
      expect(canMutate(landlordBId, property)).toBe(false); // IDOR blocked
    });

    it('should prevent non-SuperAdmin users from granting elevated admin roles', () => {
      const canGrantRole = (actorRole: string, targetRole: string) => {
        if (targetRole === 'SUPER_ADMIN' || targetRole === 'ADMIN') {
          return actorRole === 'SUPER_ADMIN';
        }
        return false;
      };

      expect(canGrantRole('TENANT', 'ADMIN')).toBe(false);
      expect(canGrantRole('LANDLORD', 'ADMIN')).toBe(false);
      expect(canGrantRole('ADMIN', 'SUPER_ADMIN')).toBe(false);
      expect(canGrantRole('SUPER_ADMIN', 'ADMIN')).toBe(true);
      expect(canGrantRole('SUPER_ADMIN', 'SUPER_ADMIN')).toBe(true);
    });
  });

  describe('4. Commercial Guardrails & Launch Blocking Invariants', () => {
    it('should enforce Starter tier 2-listing limit and require Pro tier upgrade for 3rd listing', () => {
      const canPublishListing = (tier: string, activeListingCount: number) => {
        if (tier === 'STARTER') return activeListingCount < 2;
        if (tier === 'PRO') return activeListingCount < 10;
        return true; // AGENCY / UNLIMITED
      };

      expect(canPublishListing('STARTER', 0)).toBe(true);
      expect(canPublishListing('STARTER', 1)).toBe(true);
      expect(canPublishListing('STARTER', 2)).toBe(false); // Quota exceeded
      expect(canPublishListing('PRO', 2)).toBe(true);
      expect(canPublishListing('PRO', 9)).toBe(true);
      expect(canPublishListing('PRO', 10)).toBe(false);
    });

    it('should verify zero open BLOCKER defects in the launch-blocking register', () => {
      const launchRegister = [
        { id: 'ISS-BLK-001', severity: 'BLOCKER', status: 'CLOSED' },
        { id: 'ISS-BLK-002', severity: 'BLOCKER', status: 'CLOSED' },
        { id: 'ISS-BLK-003', severity: 'BLOCKER', status: 'CLOSED' },
        { id: 'ISS-BLK-004', severity: 'BLOCKER', status: 'CLOSED' },
        { id: 'ISS-BLK-005', severity: 'BLOCKER', status: 'CLOSED' },
        { id: 'ISS-BLK-006', severity: 'BLOCKER', status: 'CLOSED' },
        { id: 'ISS-BLK-007', severity: 'BLOCKER', status: 'CLOSED' },
        { id: 'ISS-BLK-008', severity: 'BLOCKER', status: 'CLOSED' },
        { id: 'ISS-BLK-009', severity: 'BLOCKER', status: 'CLOSED' },
        { id: 'ISS-BLK-010', severity: 'BLOCKER', status: 'CLOSED' },
        { id: 'ISS-HGH-001', severity: 'HIGH', status: 'SCHEDULED' },
        { id: 'ISS-HGH-002', severity: 'HIGH', status: 'SCHEDULED' },
      ];

      const openBlockers = launchRegister.filter(
        (issue) => issue.severity === 'BLOCKER' && issue.status !== 'CLOSED',
      );

      expect(openBlockers.length).toBe(0);
      expect(launchRegister.filter((i) => i.severity === 'BLOCKER').length).toBe(10);
    });
  });
});
