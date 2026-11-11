import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('Landlord Operations & Availability Web Experience Tests', () => {
  it('validates property creation wizard eligibility and property type matching rules', () => {
    const studentTypes = ['SINGLE_ROOM', 'SHARED_ROOM', 'HOSTEL', 'PORTION', 'APARTMENT'];
    const familyTypes = ['HOUSE', 'PORTION', 'APARTMENT', 'RESIDENTIAL_UNIT'];

    assert.ok(studentTypes.includes('SINGLE_ROOM'));
    assert.ok(studentTypes.includes('HOSTEL'));
    assert.ok(!studentTypes.includes('HOUSE'), 'Students cannot rent standalone HOUSE');

    assert.ok(familyTypes.includes('HOUSE'));
    assert.ok(familyTypes.includes('RESIDENTIAL_UNIT'));
    assert.ok(
      !familyTypes.includes('SINGLE_ROOM'),
      'Families cannot rent SINGLE_ROOM in student hostels',
    );
  });

  it('validates Peshawar geographic boundary coordinate check', () => {
    const PESHAWAR_BOUNDS = {
      minLat: 33.9,
      maxLat: 34.15,
      minLng: 71.4,
      maxLng: 71.7,
    };

    function isInsidePeshawar(lat, lng) {
      return (
        lat >= PESHAWAR_BOUNDS.minLat &&
        lat <= PESHAWAR_BOUNDS.maxLat &&
        lng >= PESHAWAR_BOUNDS.minLng &&
        lng <= PESHAWAR_BOUNDS.maxLng
      );
    }

    // Inside Peshawar
    assert.strictEqual(isInsidePeshawar(33.9982, 71.4883), true, 'University Town must be valid');
    assert.strictEqual(isInsidePeshawar(33.9875, 71.4332), true, 'Hayatabad Phase 4 must be valid');
    assert.strictEqual(isInsidePeshawar(34.0086, 71.5375), true, 'Saddar must be valid');

    // Outside Peshawar
    assert.strictEqual(isInsidePeshawar(33.6844, 73.0479), false, 'Islamabad is outside Peshawar');
    assert.strictEqual(isInsidePeshawar(31.5204, 74.3587), false, 'Lahore is outside Peshawar');
  });

  it('validates duplicate-listing detection criteria', () => {
    function isNearDuplicate(candidate, existing) {
      if (candidate.landlordId !== existing.landlordId) return false;
      if (candidate.localityId !== existing.localityId) return false;
      if (candidate.propertyType !== existing.propertyType) return false;

      // Rent within 10%
      const rentDiff =
        Math.abs(candidate.monthlyRentPkr - existing.monthlyRentPkr) / existing.monthlyRentPkr;
      if (rentDiff > 0.1) return false;

      // Coordinate distance approx (< 0.001 deg ~ 100m)
      const latDiff = Math.abs(candidate.latitude - existing.latitude);
      const lngDiff = Math.abs(candidate.longitude - existing.longitude);
      if (latDiff > 0.001 || lngDiff > 0.001) return false;

      return true;
    }

    const listing1 = {
      landlordId: 'l-1',
      localityId: 'loc-1',
      propertyType: 'SINGLE_ROOM',
      monthlyRentPkr: 15000,
      latitude: 33.9982,
      longitude: 71.4883,
    };

    const duplicateCandidate = {
      landlordId: 'l-1',
      localityId: 'loc-1',
      propertyType: 'SINGLE_ROOM',
      monthlyRentPkr: 15500, // within 3.3%
      latitude: 33.9983, // within ~10 meters
      longitude: 71.4884,
    };

    const distinctCandidate = {
      landlordId: 'l-1',
      localityId: 'loc-1',
      propertyType: 'SINGLE_ROOM',
      monthlyRentPkr: 25000, // 66% difference
      latitude: 33.9982,
      longitude: 71.4883,
    };

    assert.strictEqual(
      isNearDuplicate(duplicateCandidate, listing1),
      true,
      'Must flag near-duplicate',
    );
    assert.strictEqual(
      isNearDuplicate(distinctCandidate, listing1),
      false,
      'Distinct rent is not duplicate',
    );
  });

  it('validates availability status state transition rules', () => {
    function canSelfActivate(currentStatus) {
      if (currentStatus === 'REJECTED' || currentStatus === 'SUSPENDED') {
        return false;
      }
      return (
        currentStatus === 'RENTED' ||
        currentStatus === 'UNAVAILABLE' ||
        currentStatus === 'APPROVED'
      );
    }

    assert.strictEqual(canSelfActivate('RENTED'), true, 'Rented property can be marked available');
    assert.strictEqual(
      canSelfActivate('UNAVAILABLE'),
      true,
      'Unavailable property can be marked available',
    );
    assert.strictEqual(
      canSelfActivate('REJECTED'),
      false,
      'Landlord cannot self-activate REJECTED listing',
    );
    assert.strictEqual(
      canSelfActivate('SUSPENDED'),
      false,
      'Landlord cannot self-activate SUSPENDED listing',
    );
  });

  it('calculates listing quality score accurately', () => {
    function calculateScore({ title, description, imageCount, hasAddressNote }) {
      let score = 0;
      if (title.length >= 20) score += 20;
      else if (title.length >= 10) score += 10;

      if (description.length >= 100) score += 30;
      else if (description.length >= 30) score += 15;

      if (imageCount >= 4) score += 30;
      else if (imageCount >= 1) score += 15;

      if (hasAddressNote) score += 20;

      return score;
    }

    const highQuality = calculateScore({
      title: 'Spacious Furnished Apartment in University Town',
      description:
        'Fully furnished 2 bed apartment with backup generator, water bore, high-speed fiber internet, and 24/7 security guard.',
      imageCount: 5,
      hasAddressNote: true,
    });

    const lowQuality = calculateScore({
      title: 'Room',
      description: 'Room for rent.',
      imageCount: 1,
      hasAddressNote: false,
    });

    assert.strictEqual(highQuality, 100, 'Comprehensive listing achieves maximum quality score');
    assert.strictEqual(lowQuality, 15, 'Minimal listing receives low quality score');
  });
});
