import { Metadata } from 'next';

export const SITE_URL =
  process.env['NEXT_PUBLIC_SITE_URL']?.replace(/\/$/, '') || 'https://rentpeshawar.pk';

export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.jpg`;
export const SITE_NAME = 'RentPeshawar';
export const DEFAULT_DESCRIPTION =
  'Verified flats, hostels, student rooms, and family portions for rent in Peshawar. Direct contact with verified landlords, no fake listings.';

export function cleanCanonicalUrl(pathOrUrl: string): string {
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    try {
      const url = new URL(pathOrUrl);
      const cleanPath = url.pathname.replace(/\/$/, '') || '';
      return `${SITE_URL}${cleanPath}`;
    } catch {
      // fallback
    }
  }
  const basePart = pathOrUrl.split('?')[0] || '';
  const cleanPath = basePart.replace(/\/$/, '') || '';
  const normalized = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
  return `${SITE_URL}${normalized}`;
}

export function buildPropertyTitle(title: string, localityName?: string): string {
  const loc = localityName ? `${localityName}, Peshawar` : 'Peshawar';
  return `${title} | ${loc} | ${SITE_NAME}`;
}

export function buildLocalityTitle(localityName: string): string {
  return `Houses, Flats & Hostels for Rent in ${localityName}, Peshawar | ${SITE_NAME}`;
}

export function buildStudentCategoryTitle(localityName: string): string {
  return `Student Hostels & Rooms for Rent in ${localityName}, Peshawar | ${SITE_NAME}`;
}

export function buildFamilyCategoryTitle(localityName: string): string {
  return `Family Houses & Portions for Rent in ${localityName}, Peshawar | ${SITE_NAME}`;
}

export function buildPropertyTypeTitle(localityName: string, propertyType: string): string {
  const formattedType = propertyType.replace(/_/g, ' ').toLowerCase();
  const capitalizedType = formattedType.charAt(0).toUpperCase() + formattedType.slice(1);
  return `${capitalizedType} for Rent in ${localityName}, Peshawar | ${SITE_NAME}`;
}

export function buildGuideTitle(guideTitle: string): string {
  return `${guideTitle} | Peshawar Rental Guide | ${SITE_NAME}`;
}

export interface MetadataOptions {
  title: string;
  description?: string;
  canonical?: string;
  image?: string;
  noIndex?: boolean;
  keywords?: string[];
  type?: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
}

export function constructMetadata(options: MetadataOptions): Metadata {
  const {
    title,
    description = DEFAULT_DESCRIPTION,
    canonical,
    image = DEFAULT_OG_IMAGE,
    noIndex = false,
    keywords = [],
    type = 'website',
    publishedTime,
    modifiedTime,
  } = options;

  const canonicalUrl = canonical ? cleanCanonicalUrl(canonical) : undefined;
  const imageUrl = image.startsWith('http')
    ? image
    : `${SITE_URL}${image.startsWith('/') ? '' : '/'}${image}`;

  const metadata: Metadata = {
    title,
    description,
    keywords: [
      'Rent in Peshawar',
      'Peshawar Real Estate',
      'Flats for rent Peshawar',
      'Hostels in Peshawar',
      'Family portions Peshawar',
      'University Town rent',
      'Hayatabad rentals',
      ...keywords,
    ],
    metadataBase: new URL(SITE_URL),
    alternates: canonicalUrl ? { canonical: canonicalUrl } : undefined,
    openGraph: {
      title,
      description,
      url: canonicalUrl || SITE_URL,
      siteName: SITE_NAME,
      locale: 'en_PK',
      type: type as any,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      ...(publishedTime && type === 'article' ? { publishedTime } : {}),
      ...(modifiedTime && type === 'article' ? { modifiedTime } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
      creator: '@RentPeshawar',
      site: '@RentPeshawar',
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
          googleBot: {
            index: false,
            follow: false,
          },
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
          },
        },
  };

  return metadata;
}
