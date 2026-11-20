import { test } from 'node:test';
import assert from 'node:assert';
import {
  isCoordinateWithinCityBoundary,
  registerDynamicCity,
  getCityConfig,
  listSupportedCities,
} from '../index.js';

test('CITIES_REGISTRY includes Peshawar, Mardan, and Abbottabad', () => {
  const cities = listSupportedCities();
  assert.ok(cities.length >= 3);
  assert.ok(getCityConfig('PESHAWAR'));
  assert.ok(getCityConfig('MARDAN'));
  assert.ok(getCityConfig('ABBOTTABAD'));
});

test('Boundary detection correctly validates Peshawar coordinates', () => {
  assert.strictEqual(isCoordinateWithinCityBoundary(33.9982, 71.4883, 'PESHAWAR'), true);
  assert.strictEqual(isCoordinateWithinCityBoundary(33.6844, 73.0479, 'PESHAWAR'), false);
});

test('Boundary detection correctly validates Mardan coordinates', () => {
  assert.strictEqual(isCoordinateWithinCityBoundary(34.1989, 72.0404, 'MARDAN'), true);
  assert.strictEqual(isCoordinateWithinCityBoundary(33.6844, 73.0479, 'MARDAN'), false);
});

test('Boundary detection correctly validates Abbottabad coordinates', () => {
  assert.strictEqual(isCoordinateWithinCityBoundary(34.1688, 73.2215, 'ABBOTTABAD'), true);
  assert.strictEqual(isCoordinateWithinCityBoundary(31.5204, 74.3587, 'ABBOTTABAD'), false);
});

test('registerDynamicCity dynamically registers new city at runtime', () => {
  registerDynamicCity({
    code: 'CHARSADDA',
    name: 'Charsadda',
    province: 'Khyber Pakhtunkhwa',
    defaultPostalCode: '24420',
    centerCoordinates: { latitude: 34.1482, longitude: 71.7406 },
    serviceBoundaryPolygon: [
      [71.65, 34.08],
      [71.85, 34.08],
      [71.85, 34.22],
      [71.65, 34.22],
      [71.65, 34.08],
    ],
    isActive: true,
  });

  assert.strictEqual(isCoordinateWithinCityBoundary(34.1482, 71.7406, 'CHARSADDA'), true);
  assert.strictEqual(isCoordinateWithinCityBoundary(33.9982, 71.4883, 'CHARSADDA'), false);
});
