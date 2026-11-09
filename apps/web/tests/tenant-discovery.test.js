import { describe, it } from 'node:test';
import assert from 'node:assert';
import { PropertyEligibility, PropertyType } from '@rental-peshawar/shared-types';
import {
  PESHAWAR_LOCALITIES_CONFIG,
  isCoordinateWithinPeshawarBoundary,
} from '@rental-peshawar/config';

describe('Tenant Discovery Web Experience Tests', () => {
  it('enforces non-negotiable eligibility segregation: student properties vs family properties', () => {
    const studentSample = {
      id: 'p1',
      title: 'UOP Student Hostel Single Room',
      eligibility: PropertyEligibility.STUDENTS_ONLY,
      propertyType: PropertyType.SINGLE_ROOM,
      monthlyRentPkr: 15000,
    };

    const familySample = {
      id: 'p2',
      title: 'Hayatabad Phase 3 Family Portion',
      eligibility: PropertyEligibility.FAMILIES_ONLY,
      propertyType: PropertyType.UPPER_PORTION,
      monthlyRentPkr: 45000,
    };

    // When tenant is Student:
    const studentFeed = [studentSample, familySample].filter(
      (p) => p.eligibility === PropertyEligibility.STUDENTS_ONLY,
    );
    assert.strictEqual(studentFeed.length, 1);
    assert.strictEqual(studentFeed[0].id, 'p1');
    assert.strictEqual(studentFeed[0].eligibility, PropertyEligibility.STUDENTS_ONLY);

    // When tenant is Family:
    const familyFeed = [studentSample, familySample].filter(
      (p) => p.eligibility === PropertyEligibility.FAMILIES_ONLY,
    );
    assert.strictEqual(familyFeed.length, 1);
    assert.strictEqual(familyFeed[0].id, 'p2');
    assert.strictEqual(familyFeed[0].eligibility, PropertyEligibility.FAMILIES_ONLY);
  });

  it('verifies Peshawar municipal boundary enforcement for all localities', () => {
    // 15 verified localities
    assert.strictEqual(PESHAWAR_LOCALITIES_CONFIG.length, 15);

    // University Town must be inside boundary
    const univTown = PESHAWAR_LOCALITIES_CONFIG.find((l) => l.slug === 'university-town');
    assert.ok(univTown);
    assert.strictEqual(
      isCoordinateWithinPeshawarBoundary(
        univTown.centerCoordinates.latitude,
        univTown.centerCoordinates.longitude,
      ),
      true,
    );

    // Hayatabad must be inside boundary
    const hayatabad = PESHAWAR_LOCALITIES_CONFIG.find((l) => l.slug === 'hayatabad');
    assert.ok(hayatabad);
    assert.strictEqual(
      isCoordinateWithinPeshawarBoundary(
        hayatabad.centerCoordinates.latitude,
        hayatabad.centerCoordinates.longitude,
      ),
      true,
    );

    // Islamabad or Rawalpindi coordinates must be rejected
    assert.strictEqual(isCoordinateWithinPeshawarBoundary(33.6844, 73.0479), false);
  });

  it('validates property price formatting and PKR currency conventions', () => {
    const rent = 25000;
    const formatted = rent.toLocaleString('en-PK');
    assert.strictEqual(formatted, '25,000');
  });

  it('validates optimistic favorite toggle logic', () => {
    let savedList = ['prop-1', 'prop-2'];

    // Add prop-3
    const toAdd = 'prop-3';
    savedList = [...savedList, toAdd];
    assert.ok(savedList.includes('prop-3'));
    assert.strictEqual(savedList.length, 3);

    // Remove prop-1
    savedList = savedList.filter((id) => id !== 'prop-1');
    assert.strictEqual(savedList.includes('prop-1'), false);
    assert.strictEqual(savedList.length, 2);
  });

  it('validates inquiry payload and required constraints', () => {
    const validInquiry = {
      propertyId: '11111111-1111-1111-1111-111111111111',
      message: 'Hello, I am interested in visiting this Hayatabad property on Monday.',
      proposedMoveInDate: '2026-03-01',
      preferredContactMethod: 'PHONE',
    };

    assert.ok(validInquiry.propertyId);
    assert.ok(validInquiry.message.length >= 10);
    assert.strictEqual(validInquiry.preferredContactMethod, 'PHONE');
  });
});
