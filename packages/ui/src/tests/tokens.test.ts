import { test } from 'node:test';
import assert from 'node:assert';
import { colors, typography, spacing, borderRadius } from '../index.js';

test('Color tokens include Peshawar emerald primary and terracotta', () => {
  assert.ok(colors.primary[500]);
  assert.strictEqual(colors.primary[500], '#10b981');
  assert.ok(colors.terracotta[500]);
});

test('Color tokens contain dedicated eligibility separation badges', () => {
  assert.ok(colors.eligibility.studentsOnly.background);
  assert.ok(colors.eligibility.familiesOnly.background);
  assert.notStrictEqual(
    colors.eligibility.studentsOnly.background,
    colors.eligibility.familiesOnly.background,
  );
});

test('Typography defines font families and sizes', () => {
  assert.ok(typography.fontFamily.sans.includes('Plus Jakarta Sans'));
  assert.ok(typography.fontSize['2xl']);
});

test('Spacing scales and border radii are defined', () => {
  assert.strictEqual(spacing[4], '1rem');
  assert.strictEqual(borderRadius.full, '9999px');
});
