import test from 'node:test';
import assert from 'node:assert/strict';

test('Reliability Governance: Error budget tier classification & freeze rules', () => {
  function getErrorBudgetTier(consumptionPercent) {
    if (consumptionPercent >= 90) return { tier: 'RED', freeze: true };
    if (consumptionPercent >= 75) return { tier: 'ORANGE', freeze: false };
    if (consumptionPercent >= 50) return { tier: 'AMBER', freeze: false };
    return { tier: 'GREEN', freeze: false };
  }

  // Green tier
  assert.deepEqual(getErrorBudgetTier(42), { tier: 'GREEN', freeze: false });
  // Amber tier
  assert.deepEqual(getErrorBudgetTier(60), { tier: 'AMBER', freeze: false });
  // Orange tier
  assert.deepEqual(getErrorBudgetTier(82), { tier: 'ORANGE', freeze: false });
  // Red tier - Feature freeze active
  assert.deepEqual(getErrorBudgetTier(93), { tier: 'RED', freeze: true });
});

test('Customer Feedback Loop: Low-rating triage alert triggers concierge outreach within 4 hours', () => {
  function processFeedback(rating, comment, persona, locality) {
    const isCritical = rating <= 2;
    return {
      rating,
      comment,
      persona,
      locality,
      sentiment: rating >= 4 ? 'POSITIVE' : isCritical ? 'NEGATIVE' : 'NEUTRAL',
      requiresConciergeFollowUp: isCritical,
      slaHours: isCritical ? 4 : 24,
    };
  }

  const positive = processFeedback(5, 'Great apartment in Hayatabad', 'TENANT', 'Hayatabad');
  assert.equal(positive.sentiment, 'POSITIVE');
  assert.equal(positive.requiresConciergeFollowUp, false);

  const negative = processFeedback(
    1,
    'Hostel was mislabeled as bachelor-only',
    'TENANT',
    'University Town',
  );
  assert.equal(negative.sentiment, 'NEGATIVE');
  assert.equal(negative.requiresConciergeFollowUp, true);
  assert.equal(negative.slaHours, 4);
});

test('Customer Intelligence: Net Promoter Score (NPS) calculation formula', () => {
  function calculateNps(ratings) {
    const total = ratings.length;
    if (total === 0) return 0;
    // Promoters = 5 stars, Passives = 4 stars, Detractors = 1-3 stars
    const promoters = ratings.filter((r) => r === 5).length;
    const detractors = ratings.filter((r) => r <= 3).length;
    return Math.round(((promoters - detractors) / total) * 100);
  }

  const ratings = [5, 5, 5, 5, 4, 4, 3, 2, 5, 5]; // 6 promoters, 2 passives, 2 detractors out of 10
  const nps = calculateNps(ratings);
  assert.equal(nps, 40); // (6 - 2) / 10 * 100 = 40
});

test('Experimentation Safety Guardrails: Non-negotiable invariants are enforced', () => {
  function validateExperimentGuardrails(experimentConfig) {
    const violations = [];
    if (experimentConfig.altersEligibility) {
      violations.push('Cannot alter tenant eligibility segregation (students vs. families)');
    }
    if (experimentConfig.bypassesGeofence) {
      violations.push('Cannot bypass Peshawar municipal bounding coordinates');
    }
    if (experimentConfig.bypassesModeration) {
      violations.push('Cannot serve unmoderated listings');
    }
    if (experimentConfig.exposesPii) {
      violations.push('Cannot expose unmasked CNIC or phone numbers');
    }
    return {
      isValid: violations.length === 0,
      violations,
    };
  }

  const illegalExp = {
    altersEligibility: true,
    bypassesGeofence: false,
    bypassesModeration: false,
    exposesPii: false,
  };
  const result = validateExperimentGuardrails(illegalExp);
  assert.equal(result.isValid, false);
  assert.equal(result.violations.length, 1);
  assert.ok(result.violations[0].includes('tenant eligibility'));

  const legalExp = {
    altersEligibility: false,
    bypassesGeofence: false,
    bypassesModeration: false,
    exposesPii: false,
  };
  assert.equal(validateExperimentGuardrails(legalExp).isValid, true);
});

test('Feature Flags: Deterministic user hashing and emergency circuit breaker', () => {
  function hashUserBucket(userId, experimentKey) {
    const combined = `${userId}:${experimentKey}`;
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      hash = (hash << 5) - hash + combined.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash) % 100;
  }

  const bucket1 = hashUserBucket('usr-tenant-100', 'exp_search_map_preview_v2');
  const bucket2 = hashUserBucket('usr-tenant-100', 'exp_search_map_preview_v2');
  assert.equal(bucket1, bucket2, 'Hashing must be deterministic across identical user calls');

  function evaluateVariant(userId, experiment) {
    if (experiment.killSwitchTriggered) return 'control';
    const bucket = hashUserBucket(userId, experiment.key);
    return bucket < experiment.percentage ? 'test_variant' : 'control';
  }

  const exp = {
    key: 'exp_search_map_preview_v2',
    percentage: 100, // 100% rollout
    killSwitchTriggered: false,
  };
  assert.equal(evaluateVariant('usr-tenant-100', exp), 'test_variant');

  // Emergency kill-switch trips
  exp.killSwitchTriggered = true;
  assert.equal(
    evaluateVariant('usr-tenant-100', exp),
    'control',
    'Killed experiment must immediately revert to control',
  );
});
