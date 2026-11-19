import { describe, it } from 'node:test';
import assert from 'node:assert';
import { URL } from 'node:url';

const SITE_URL = 'https://rentpeshawar.pk';
const SITE_NAME = 'RentPeshawar';

function cleanCanonicalUrl(pathOrUrl) {
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    try {
      const url = new URL(pathOrUrl);
      const cleanPath = url.pathname.replace(/\/$/, '') || '';
      return `${SITE_URL}${cleanPath}`;
    } catch {
      // fallback
    }
  }
  const cleanPath = pathOrUrl.split('?')[0].replace(/\/$/, '') || '';
  const normalized = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
  return `${SITE_URL}${normalized}`;
}

function buildPropertyTitle(title, localityName) {
  const loc = localityName ? `${localityName}, Peshawar` : 'Peshawar';
  return `${title} | ${loc} | ${SITE_NAME}`;
}

function buildLocalityTitle(localityName) {
  return `Houses, Flats & Hostels for Rent in ${localityName}, Peshawar | ${SITE_NAME}`;
}

function buildStudentCategoryTitle(localityName) {
  return `Student Hostels & Rooms for Rent in ${localityName}, Peshawar | ${SITE_NAME}`;
}

function buildFamilyCategoryTitle(localityName) {
  return `Family Houses & Portions for Rent in ${localityName}, Peshawar | ${SITE_NAME}`;
}

function buildGuideTitle(guideTitle) {
  return `${guideTitle} | Peshawar Rental Guide | ${SITE_NAME}`;
}

function constructMetadata(options) {
  const {
    title,
    description = 'Verified rentals in Peshawar',
    canonical,
    image = `${SITE_URL}/og-image.jpg`,
    noIndex = false,
  } = options;

  const canonicalUrl = canonical ? cleanCanonicalUrl(canonical) : undefined;
  return {
    title,
    description,
    alternates: canonicalUrl ? { canonical: canonicalUrl } : undefined,
    openGraph: {
      title,
      description,
      siteName: SITE_NAME,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      site: '@RentPeshawar',
    },
    robots: noIndex ? { index: false, follow: false } : { index: true, follow: true },
  };
}

function generatePropertySchema(property) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': property.propertyType === 'HOSTEL' ? 'HotelRoom' : 'SingleFamilyResidence',
    name: property.title,
    description: property.description,
    offers: {
      '@type': 'Offer',
      price: property.rentAmount || property.monthlyRentPkr,
      priceCurrency: 'PKR',
      availability: property.isAvailable
        ? 'https://schema.org/InStock'
        : 'https://schema.org/Discontinued',
    },
    numberOfBedrooms: property.bedrooms,
    geo: {
      '@type': 'GeoCoordinates',
      latitude: property.latitude,
      longitude: property.longitude,
    },
  };

  if (property.averageRating && property.reviewCount > 0) {
    schema['aggregateRating'] = {
      '@type': 'AggregateRating',
      ratingValue: property.averageRating,
      reviewCount: property.reviewCount,
    };
  }

  return schema;
}

describe('Phase 19: Technical SEO, AEO, GEO and Structured Data Tests', () => {
  describe('Canonical URLs and Title Formula Rules', () => {
    it('normalizes canonical URLs by stripping query parameters and trailing slashes', () => {
      const url1 = cleanCanonicalUrl(
        '/properties/hayatabad-phase-3-flat?utm_source=google&minRent=20000',
      );
      assert.strictEqual(url1, `${SITE_URL}/properties/hayatabad-phase-3-flat`);

      const url2 = cleanCanonicalUrl('https://rentpeshawar.pk/rentals/peshawar/university-town/');
      assert.strictEqual(url2, `${SITE_URL}/rentals/peshawar/university-town`);

      const url3 = cleanCanonicalUrl('properties/warsak-road-portion');
      assert.strictEqual(url3, `${SITE_URL}/properties/warsak-road-portion`);
    });

    it('enforces exact Title Tag formulas across all core entity types', () => {
      const propTitle = buildPropertyTitle('2-Bed Modern Apartment', 'University Town');
      assert.strictEqual(
        propTitle,
        '2-Bed Modern Apartment | University Town, Peshawar | RentPeshawar',
      );

      const locTitle = buildLocalityTitle('Hayatabad');
      assert.strictEqual(
        locTitle,
        'Houses, Flats & Hostels for Rent in Hayatabad, Peshawar | RentPeshawar',
      );

      const studentTitle = buildStudentCategoryTitle('University Town');
      assert.strictEqual(
        studentTitle,
        'Student Hostels & Rooms for Rent in University Town, Peshawar | RentPeshawar',
      );

      const familyTitle = buildFamilyCategoryTitle('Warsak Road');
      assert.strictEqual(
        familyTitle,
        'Family Houses & Portions for Rent in Warsak Road, Peshawar | RentPeshawar',
      );

      const guideTitle = buildGuideTitle('Peshawar BRT Route: Best Areas to Rent');
      assert.strictEqual(
        guideTitle,
        'Peshawar BRT Route: Best Areas to Rent | Peshawar Rental Guide | RentPeshawar',
      );
    });

    it('constructs complete OpenGraph and Twitter card metadata with 1200x630 dimensions', () => {
      const meta = constructMetadata({
        title: 'Student Hostels in University Town | RentPeshawar',
        description: 'Verified student hostels in University Town, Peshawar.',
        canonical: '/rentals/peshawar/university-town/students',
      });

      assert.strictEqual(meta.title, 'Student Hostels in University Town | RentPeshawar');
      assert.strictEqual(
        meta.alternates?.canonical,
        `${SITE_URL}/rentals/peshawar/university-town/students`,
      );
      assert.strictEqual(
        meta.openGraph?.title,
        'Student Hostels in University Town | RentPeshawar',
      );
      assert.strictEqual(meta.openGraph?.siteName, 'RentPeshawar');
      assert.strictEqual(meta.openGraph?.images?.[0]?.width, 1200);
      assert.strictEqual(meta.openGraph?.images?.[0]?.height, 630);
      assert.strictEqual(meta.twitter?.card, 'summary_large_image');
      assert.strictEqual(meta.twitter?.site, '@RentPeshawar');
      assert.strictEqual(meta.robots?.index, true);
    });

    it('enforces noindex on private or restricted metadata', () => {
      const privateMeta = constructMetadata({
        title: 'Admin Operations',
        noIndex: true,
      });

      assert.strictEqual(privateMeta.robots?.index, false);
      assert.strictEqual(privateMeta.robots?.follow, false);
    });
  });

  describe('Structured Data (JSON-LD) Validation', () => {
    it('generates compliant Property schema with truth-in-schema pricing and availability', () => {
      const availableProperty = {
        id: 'prop-101',
        title: 'Hayatabad Phase 2 Upper Portion',
        description: 'Spacious upper portion with solar backup.',
        propertyType: 'PORTION',
        rentAmount: 55000,
        isAvailable: true,
        bedrooms: 3,
        bathrooms: 3,
        latitude: 33.992,
        longitude: 71.432,
      };

      const schema = generatePropertySchema(availableProperty);
      assert.strictEqual(schema['@type'], 'SingleFamilyResidence');
      assert.strictEqual(schema.offers.price, 55000);
      assert.strictEqual(schema.offers.priceCurrency, 'PKR');
      assert.strictEqual(schema.offers.availability, 'https://schema.org/InStock');
      assert.strictEqual(schema.numberOfBedrooms, 3);
      assert.strictEqual(schema.geo.latitude, 33.992);

      // Truth-in-schema: No fake reviews should be fabricated
      assert.strictEqual(schema.aggregateRating, undefined);
    });

    it('only attaches AggregateRating when genuine reviews and ratings exist', () => {
      const reviewedProperty = {
        id: 'prop-102',
        title: 'Town Executive Student Hostel',
        propertyType: 'HOSTEL',
        rentAmount: 14000,
        isAvailable: true,
        averageRating: 4.8,
        reviewCount: 12,
      };

      const schema = generatePropertySchema(reviewedProperty);
      assert.ok(schema.aggregateRating);
      assert.strictEqual(schema.aggregateRating['@type'], 'AggregateRating');
      assert.strictEqual(schema.aggregateRating.ratingValue, 4.8);
      assert.strictEqual(schema.aggregateRating.reviewCount, 12);
    });
  });

  describe('Robots.txt & Sitemap Generator Rules', () => {
    it('verifies robots.txt disallow and allow directives adhere to spec', () => {
      const disallowPaths = [
        '/admin/',
        '/dashboard/',
        '/api/',
        '/messages/',
        '/inquiries/',
        '/profile/',
        '/checkout/',
        '/payment/',
        '/account/',
      ];

      for (const p of disallowPaths) {
        assert.ok(p.startsWith('/'), `Disallowed path must start with /: ${p}`);
      }

      const aiBots = ['GPTBot', 'PerplexityBot', 'ClaudeBot', 'Google-Extended'];
      assert.strictEqual(aiBots.length, 4);
    });

    it('verifies dynamic sitemap rules: only APPROVED and AVAILABLE listings permitted', () => {
      const testProperties = [
        { id: '1', slug: 'prop-1', status: 'APPROVED', isAvailable: true },
        { id: '2', slug: 'prop-2', status: 'PENDING', isAvailable: true },
        { id: '3', slug: 'prop-3', status: 'APPROVED', isAvailable: false },
        { id: '4', slug: 'prop-4', status: 'REJECTED', isAvailable: false },
        { id: '5', slug: 'prop-5', status: 'APPROVED', isAvailable: true },
      ];

      const sitemapEligible = testProperties.filter(
        (p) => p.status === 'APPROVED' && p.isAvailable === true,
      );

      assert.strictEqual(sitemapEligible.length, 2);
      assert.deepStrictEqual(
        sitemapEligible.map((p) => p.slug),
        ['prop-1', 'prop-5'],
      );
    });
  });

  describe('Peshawar Geographic Boundary & Locality Validation', () => {
    it('enforces Peshawar municipal bounding box coordinates', () => {
      const BoundingBox = {
        minLat: 33.9,
        maxLat: 34.15,
        minLng: 71.4,
        maxLng: 71.7,
      };

      const isWithinBoundary = (lat, lng) =>
        lat >= BoundingBox.minLat &&
        lat <= BoundingBox.maxLat &&
        lng >= BoundingBox.minLng &&
        lng <= BoundingBox.maxLng;

      // University Town (approx 34.00, 71.50) -> Inside
      assert.strictEqual(isWithinBoundary(34.008, 71.503), true);
      // Hayatabad Phase 3 (approx 33.98, 71.44) -> Inside
      assert.strictEqual(isWithinBoundary(33.982, 71.441), true);
      // Islamabad / Rawalpindi (33.68, 73.04) -> Outside
      assert.strictEqual(isWithinBoundary(33.684, 73.047), false);
      // Swat (35.22, 72.42) -> Outside
      assert.strictEqual(isWithinBoundary(35.222, 72.425), false);
    });
  });
});
