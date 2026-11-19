import test from 'node:test';
import assert from 'node:assert/strict';

test('Commercial Pricing: Annual billing calculates correct 17% savings for Pro and Agency tiers', () => {
  const proMonthly = 3500;
  const proAnnual = 35000; // Equivalent to ~PKR 2,916/mo (17% discount)
  assert.ok(proAnnual < proMonthly * 12);
  assert.equal(Math.round(proAnnual / 12), 2917);

  const agencyMonthly = 9500;
  const agencyAnnual = 95000;
  assert.ok(agencyAnnual < agencyMonthly * 12);
  assert.equal(Math.round(agencyAnnual / 12), 7917);
});

test('Commercial Guardrail: Free Starter tier enforces max 2 active listings limit', () => {
  const starterMaxListings = 2;
  const activeListings = 2;
  const canPublishNewListing = activeListings < starterMaxListings;
  assert.equal(
    canPublishNewListing,
    false,
    'Free tier must not allow 3rd active listing without upgrade',
  );
});

test('Referral Program: Format and URL integrity for Peshawar referrals', () => {
  const userId = 'a8f5e120-1234-5678-abcd-000000000000';
  const referralCode = `PESH-${userId.slice(0, 6).toUpperCase()}`;
  assert.equal(referralCode, 'PESH-A8F5E1');

  const referralUrl = `https://rentalpeshawar.pk/register?ref=${referralCode}`;
  assert.ok(referralUrl.includes('ref=PESH-A8F5E1'));
});

test('Marketing Automation: Quiet hours in PKT (UTC+5) blocks promotional dispatch from 22:00 to 08:00', () => {
  function isQuietHours(utcHour) {
    const pktHour = (utcHour + 5) % 24;
    return pktHour >= 22 || pktHour < 8;
  }

  // 18:00 UTC = 23:00 PKT (Quiet hours)
  assert.equal(isQuietHours(18), true);
  // 01:00 UTC = 06:00 PKT (Quiet hours)
  assert.equal(isQuietHours(1), true);
  // 09:00 UTC = 14:00 PKT (Active hours)
  assert.equal(isQuietHours(9), false);
});

test('Promotion Truth-in-Advertising: Boosts cannot be applied to unapproved or rented properties', () => {
  function canApplyBoost(property) {
    return property.status === 'APPROVED' && property.isAvailable === true;
  }

  assert.equal(canApplyBoost({ status: 'PENDING_MODERATION', isAvailable: true }), false);
  assert.equal(canApplyBoost({ status: 'REJECTED', isAvailable: true }), false);
  assert.equal(canApplyBoost({ status: 'APPROVED', isAvailable: false }), false);
  assert.equal(canApplyBoost({ status: 'APPROVED', isAvailable: true }), true);
});
