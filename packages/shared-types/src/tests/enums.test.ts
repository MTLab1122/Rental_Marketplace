import { test } from 'node:test';
import assert from 'node:assert';
import {
  UserRole,
  TenantType,
  PropertyEligibility,
  PropertyStatus,
  PESHAWAR_LOCALITIES,
  ErrorCode,
} from '../index.js';

test('User roles enum contains all required roles', () => {
  assert.strictEqual(UserRole.TENANT, 'TENANT');
  assert.strictEqual(UserRole.LANDLORD, 'LANDLORD');
  assert.strictEqual(UserRole.ADMIN, 'ADMIN');
  assert.strictEqual(UserRole.SUPER_ADMIN, 'SUPER_ADMIN');
});

test('Tenant types enum contains STUDENT and FAMILY', () => {
  assert.strictEqual(TenantType.STUDENT, 'STUDENT');
  assert.strictEqual(TenantType.FAMILY, 'FAMILY');
});

test('Property eligibility contains strictly STUDENTS_ONLY and FAMILIES_ONLY', () => {
  assert.strictEqual(PropertyEligibility.STUDENTS_ONLY, 'STUDENTS_ONLY');
  assert.strictEqual(PropertyEligibility.FAMILIES_ONLY, 'FAMILIES_ONLY');
  assert.strictEqual(Object.keys(PropertyEligibility).length, 2);
});

test('Property statuses contain all expected states', () => {
  const expected = [
    'DRAFT',
    'PENDING_REVIEW',
    'APPROVED',
    'REJECTED',
    'SUSPENDED',
    'RENTED',
    'UNAVAILABLE',
    'DELETED',
  ];
  for (const status of expected) {
    assert.ok(Object.values(PropertyStatus).includes(status as PropertyStatus));
  }
});

test('Peshawar localities include 15 verified localities', () => {
  assert.strictEqual(PESHAWAR_LOCALITIES.length, 15);
  assert.ok(PESHAWAR_LOCALITIES.includes(PESHAWAR_LOCALITIES[0]!));
  assert.ok(PESHAWAR_LOCALITIES.includes(PESHAWAR_LOCALITIES[1]!));
  assert.ok(PESHAWAR_LOCALITIES.includes(PESHAWAR_LOCALITIES[14]!));
});

test('Error codes include required domain error codes', () => {
  assert.strictEqual(ErrorCode.VALIDATION_ERROR, 'VALIDATION_ERROR');
  assert.strictEqual(ErrorCode.OUTSIDE_SERVICE_BOUNDARY, 'OUTSIDE_SERVICE_BOUNDARY');
  assert.strictEqual(ErrorCode.INVALID_ELIGIBILITY, 'INVALID_ELIGIBILITY');
});
