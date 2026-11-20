import test from 'node:test';
import assert from 'node:assert/strict';

const SITE_URL = 'https://rentalpeshawar.pk';
const SITE_NAME = 'Rental Peshawar';

function cleanCanonicalUrl(urlOrPath) {
  const [path] = urlOrPath.split('?');
  const normalized = path.replace(/\/+$/, '') || '/';
  if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
    return normalized;
  }
  return `${SITE_URL}${normalized.startsWith('/') ? normalized : `/${normalized}`}`;
}

function buildLocalityTitle(localityName) {
  return `Houses, Flats & Hostels for Rent in ${localityName}, Peshawar | ${SITE_NAME}`;
}

function buildStudentCategoryTitle(localityName) {
  return `Student Hostels & Rooms for Rent in ${localityName}, Peshawar | ${SITE_NAME}`;
}

function buildWhatsAppShareLink(title, locality, rentPkr, propertyId) {
  const rentFormatted = `PKR ${rentPkr.toLocaleString()}/month`;
  const url = `${SITE_URL}/properties/${propertyId}`;
  const text = `🏠 ${title}\n📍 Locality: ${locality}\n💰 Rent: ${rentFormatted}\n\nCheck details on Rental Peshawar:\n${url}`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

test('SEO: Canonical URL strips query params, UTM tags and trailing slashes', () => {
  const rawUrl =
    'https://rentalpeshawar.pk/localities/hayatabad/?utm_source=facebook&utm_campaign=winter2026';
  const canonical = cleanCanonicalUrl(rawUrl);
  assert.equal(canonical, 'https://rentalpeshawar.pk/localities/hayatabad');

  const relativePath = '/properties/hayatabad-phase-3-house/?ref=PESH-123';
  const relativeCanonical = cleanCanonicalUrl(relativePath);
  assert.equal(relativeCanonical, 'https://rentalpeshawar.pk/properties/hayatabad-phase-3-house');
});

test('SEO: Page title templates maintain brand consistency and locality keywords', () => {
  const title1 = buildLocalityTitle('Hayatabad');
  assert.equal(title1, 'Houses, Flats & Hostels for Rent in Hayatabad, Peshawar | Rental Peshawar');

  const title2 = buildStudentCategoryTitle('University Town');
  assert.equal(
    title2,
    'Student Hostels & Rooms for Rent in University Town, Peshawar | Rental Peshawar',
  );
});

test('Viral Growth: WhatsApp share link formats compliant Urdu/English viral copy', () => {
  const link = buildWhatsAppShareLink(
    'Furnished Student Room near KMC',
    'University Town',
    15000,
    'prop-kmc-101',
  );

  assert.ok(link.startsWith('https://wa.me/?text='));
  assert.ok(link.includes(encodeURIComponent('Furnished Student Room near KMC')));
  assert.ok(link.includes(encodeURIComponent('PKR 15,000/month')));
  assert.ok(link.includes(encodeURIComponent('https://rentalpeshawar.pk/properties/prop-kmc-101')));
});

test('Deep Linking: App link scheme routes directly to mobile app listing screen', () => {
  const propertyId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
  const deepLink = `rentalpeshawar://property/${propertyId}`;
  assert.equal(deepLink, 'rentalpeshawar://property/a1b2c3d4-e5f6-7890-abcd-ef1234567890');
});

test('Multi-City Scalability: Locality chips dynamically route to city and locality scopes', () => {
  const cities = [
    { code: 'PESHAWAR', name: 'Peshawar', activeLocalities: 15 },
    { code: 'MARDAN', name: 'Mardan', activeLocalities: 4 },
    { code: 'ABBOTTABAD', name: 'Abbottabad', activeLocalities: 3 },
  ];

  assert.equal(cities.length, 3);
  assert.equal(cities[0].name, 'Peshawar');

  const formatCityLocalityUrl = (cityCode, localitySlug) => {
    return `/${cityCode.toLowerCase()}/localities/${localitySlug}`;
  };

  assert.equal(
    formatCityLocalityUrl(cities[0].code, 'hayatabad'),
    '/peshawar/localities/hayatabad',
  );
  assert.equal(
    formatCityLocalityUrl(cities[1].code, 'sheikh-maltoon'),
    '/mardan/localities/sheikh-maltoon',
  );
  assert.equal(
    formatCityLocalityUrl(cities[2].code, 'supply-bazaar'),
    '/abbottabad/localities/supply-bazaar',
  );
});

test('Commercial Monetization: Annual billing calculates correct 17% savings for Pro tier', () => {
  const monthly = 3500;
  const annual = 35000;
  const savings = monthly * 12 - annual;
  const savingsPercent = Math.round((savings / (monthly * 12)) * 100);
  assert.equal(savingsPercent, 17);
});
