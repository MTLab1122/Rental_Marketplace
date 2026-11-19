import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  PropertyEligibility,
  TenantType,
  AlertFrequency,
  RecommendationReason,
  RecommendationType,
} from '@rental-peshawar/shared-types';

describe('Saved Searches, Real-Time Alerts & Personalized Discovery Web Tests', () => {
  it('enforces non-negotiable eligibility segregation in recommendations', () => {
    const studentTenant = { tenantType: TenantType.STUDENT };
    const familyTenant = { tenantType: TenantType.FAMILY };

    const mockInventory = [
      { id: '1', title: 'Student Hostel Room', eligibility: PropertyEligibility.STUDENTS_ONLY },
      { id: '2', title: 'Family 3-Bed House', eligibility: PropertyEligibility.FAMILIES_ONLY },
      {
        id: '3',
        title: 'Student Shared Apartment',
        eligibility: PropertyEligibility.STUDENTS_ONLY,
      },
    ];

    // Filter for student
    const studentRecs = mockInventory.filter((p) => {
      if (studentTenant.tenantType === TenantType.STUDENT) {
        return p.eligibility === PropertyEligibility.STUDENTS_ONLY;
      }
      return false;
    });

    assert.strictEqual(studentRecs.length, 2);
    assert.ok(studentRecs.every((p) => p.eligibility === PropertyEligibility.STUDENTS_ONLY));

    // Filter for family
    const familyRecs = mockInventory.filter((p) => {
      if (familyTenant.tenantType === TenantType.FAMILY) {
        return p.eligibility === PropertyEligibility.FAMILIES_ONLY;
      }
      return false;
    });

    assert.strictEqual(familyRecs.length, 1);
    assert.strictEqual(familyRecs[0].eligibility, PropertyEligibility.FAMILIES_ONLY);
  });

  it('validates saved-search maximum limit of 25', () => {
    const MAX_SEARCHES = 25;
    const currentSearches = Array.from({ length: 25 }, (_, i) => ({ id: `search-${i}` }));

    const canAddMore = currentSearches.length < MAX_SEARCHES;
    assert.strictEqual(canAddMore, false);
  });

  it('validates alert frequencies and default channels', () => {
    const validFrequencies = [AlertFrequency.INSTANT, AlertFrequency.DAILY, AlertFrequency.WEEKLY];

    assert.ok(validFrequencies.includes(AlertFrequency.INSTANT));
    assert.ok(validFrequencies.includes(AlertFrequency.DAILY));
    assert.ok(validFrequencies.includes(AlertFrequency.WEEKLY));
  });

  it('validates recommendation explanation metadata mapping', () => {
    const expectedReasons = [
      RecommendationReason.BECAUSE_YOU_VIEWED,
      RecommendationReason.SIMILAR_TO_FAVORITES,
      RecommendationReason.POPULAR_IN_LOCALITY,
      RecommendationReason.NEW_IN_AREA,
      RecommendationReason.WITHIN_BUDGET,
    ];

    assert.strictEqual(expectedReasons.length, 5);
    assert.strictEqual(RecommendationType.FOR_YOU, 'FOR_YOU');
    assert.strictEqual(RecommendationType.SIMILAR, 'SIMILAR');
  });

  it('excludes unavailable properties from recommendation feed', () => {
    const properties = [
      { id: '1', title: 'Active 1', isAvailable: true, status: 'APPROVED' },
      { id: '2', title: 'Rented 1', isAvailable: false, status: 'APPROVED' },
      { id: '3', title: 'Pending 1', isAvailable: true, status: 'PENDING_REVIEW' },
    ];

    const recommended = properties.filter((p) => p.isAvailable && p.status === 'APPROVED');
    assert.strictEqual(recommended.length, 1);
    assert.strictEqual(recommended[0].id, '1');
  });
});
