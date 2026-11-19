import { SITE_URL, SITE_NAME } from './seo';
import { PropertySummaryDto } from '@rental-peshawar/shared-types';

export function generateOrganizationSchema(): Record<string, any> {
  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    image: `${SITE_URL}/og-image.jpg`,
    description:
      'Verified rental marketplace in Peshawar for student hostels, family portions, and flats.',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Peshawar',
      addressRegion: 'Khyber Pakhtunkhwa',
      addressCountry: 'PK',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 34.0151,
      longitude: 71.5249,
    },
    areaServed: {
      '@type': 'City',
      name: 'Peshawar',
    },
    priceRange: 'PKR 5,000 - PKR 300,000',
    currenciesAccepted: 'PKR',
    paymentAccepted: 'Cash, Bank Transfer, EasyPaisa, JazzCash',
  };
}

export function generateWebsiteSchema(): Record<string, any> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/properties?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function generateBreadcrumbSchema(items: BreadcrumbItem[]): Record<string, any> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http')
        ? item.url
        : `${SITE_URL}${item.url.startsWith('/') ? '' : '/'}${item.url}`,
    })),
  };
}

export function mapPropertyTypeToSchemaType(type?: string): string {
  switch (type?.toUpperCase()) {
    case 'APARTMENT':
      return 'Apartment';
    case 'HOUSE':
    case 'PORTION':
      return 'SingleFamilyResidence';
    case 'HOSTEL':
    case 'ROOM':
      return 'HotelRoom'; // or Accommodation
    default:
      return 'Accommodation';
  }
}

export function generatePropertySchema(property: PropertySummaryDto): Record<string, any> {
  const schemaType = mapPropertyTypeToSchemaType(property.propertyType);
  const propertyUrl = `${SITE_URL}/properties/${property.slug || property.id}`;
  const images =
    property.images && property.images.length > 0
      ? property.images.map((img) => (typeof img === 'string' ? img : img.url))
      : [`${SITE_URL}/images/placeholder-property.jpg`];

  const rentValue = property.monthlyRentPkr || (property as any).rentAmount || 0;
  const lat = property.coordinates?.latitude || (property as any).latitude;
  const lng = property.coordinates?.longitude || (property as any).longitude;

  const schema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': schemaType,
    name: property.title,
    description: property.description || `${property.title} available for rent in Peshawar.`,
    url: propertyUrl,
    image: images,
    address: {
      '@type': 'PostalAddress',
      streetAddress: property.address || undefined,
      addressLocality: property.locality?.name || 'Peshawar',
      addressRegion: 'Khyber Pakhtunkhwa',
      addressCountry: 'PK',
    },
    offers: {
      '@type': 'Offer',
      price: rentValue,
      priceCurrency: 'PKR',
      availability: property.isAvailable
        ? 'https://schema.org/InStock'
        : 'https://schema.org/Discontinued',
      validFrom: (property as any).createdAt || new Date().toISOString(),
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: rentValue,
        priceCurrency: 'PKR',
        unitText: 'MONTH',
      },
    },
  };

  if (lat && lng) {
    schema['geo'] = {
      '@type': 'GeoCoordinates',
      latitude: Number(lat),
      longitude: Number(lng),
    };
  }

  if (property.bedrooms) {
    schema['numberOfBedrooms'] = property.bedrooms;
    schema['numberOfRooms'] = property.bedrooms;
  }

  if (property.bathrooms) {
    schema['numberOfBathroomsTotal'] = property.bathrooms;
  }

  if (property.amenities && property.amenities.length > 0) {
    schema['amenityFeature'] = property.amenities.map((a: any) => ({
      '@type': 'LocationFeatureSpecification',
      name: typeof a === 'string' ? a : a.name,
      value: true,
    }));
  }

  // Only emit AggregateRating if genuine review metrics exist
  const ratingValue = (property as any).averageRating || (property as any).rating;
  const reviewCount = (property as any).reviewCount || (property as any).totalReviews;
  if (ratingValue && reviewCount && reviewCount > 0) {
    schema['aggregateRating'] = {
      '@type': 'AggregateRating',
      ratingValue: Number(ratingValue),
      reviewCount: Number(reviewCount),
      bestRating: 5,
      worstRating: 1,
    };
  }

  return schema;
}

export function generateLocalityItemListSchema(
  localityName: string,
  properties: PropertySummaryDto[],
  localityUrl: string,
): Record<string, any> {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Rental Properties in ${localityName}, Peshawar`,
    description: `Verified listing inventory of houses, flats, and hostels for rent in ${localityName}, Peshawar.`,
    url: localityUrl.startsWith('http') ? localityUrl : `${SITE_URL}${localityUrl}`,
    numberOfItems: properties.length,
    itemListElement: properties.map((property, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `${SITE_URL}/properties/${property.slug || property.id}`,
      name: property.title,
    })),
  };
}

export interface FaqItem {
  question: string;
  answer: string;
}

export function generateFaqSchema(faqs: FaqItem[]): Record<string, any> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

export interface ArticleSchemaOptions {
  title: string;
  description: string;
  slug: string;
  datePublished: string;
  dateModified?: string;
  authorName?: string;
  image?: string;
}

export function generateArticleSchema(options: ArticleSchemaOptions): Record<string, any> {
  const articleUrl = `${SITE_URL}/guides/${options.slug}`;
  const imageUrl = options.image
    ? options.image.startsWith('http')
      ? options.image
      : `${SITE_URL}${options.image}`
    : `${SITE_URL}/og-image.jpg`;

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': articleUrl,
    },
    headline: options.title,
    description: options.description,
    image: imageUrl,
    datePublished: options.datePublished,
    dateModified: options.dateModified || options.datePublished,
    author: {
      '@type': 'Person',
      name: options.authorName || 'RentPeshawar Editorial Team',
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/logo.png`,
      },
    },
  };
}
