import { test } from 'node:test';
import assert from 'node:assert';
import {
  PESHAWAR_LOCALITIES_CONFIG,
  isCoordinateWithinPeshawarBoundary,
  validateEnvironment,
} from '../index.js';

test('Peshawar localities config contains 15 verified localities with coordinates', () => {
  assert.strictEqual(PESHAWAR_LOCALITIES_CONFIG.length, 15);
  for (const loc of PESHAWAR_LOCALITIES_CONFIG) {
    assert.ok(loc.name);
    assert.ok(loc.slug);
    assert.ok(loc.centerCoordinates.latitude > 33.8 && loc.centerCoordinates.latitude < 34.3);
    assert.ok(loc.centerCoordinates.longitude > 71.2 && loc.centerCoordinates.longitude < 71.8);
  }
});

test('Boundary detection correctly identifies points inside Peshawar', () => {
  // University of Peshawar / University Town approx (33.9982, 71.4883)
  assert.strictEqual(isCoordinateWithinPeshawarBoundary(33.9982, 71.4883), true);

  // Saddar Peshawar (34.0086, 71.5583)
  assert.strictEqual(isCoordinateWithinPeshawarBoundary(34.0086, 71.5583), true);

  // Hayatabad Phase 4 (33.9875, 71.4332)
  assert.strictEqual(isCoordinateWithinPeshawarBoundary(33.9875, 71.4332), true);
});

test('Boundary detection rejects points outside Peshawar', () => {
  // Islamabad (33.6844, 73.0479)
  assert.strictEqual(isCoordinateWithinPeshawarBoundary(33.6844, 73.0479), false);

  // Lahore (31.5204, 74.3587)
  assert.strictEqual(isCoordinateWithinPeshawarBoundary(31.5204, 74.3587), false);

  // London (51.5074, -0.1278)
  assert.strictEqual(isCoordinateWithinPeshawarBoundary(51.5074, -0.1278), false);
});

test('validateEnvironment normalizes defaults safely', () => {
  const env = validateEnvironment({});
  assert.strictEqual(env.PORT, 4000);
  assert.strictEqual(env.API_PREFIX, '/api/v1');
  assert.strictEqual(env.ENFORCE_PESHAWAR_BOUNDARY, true);
});
