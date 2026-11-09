import { PeshawarLocalityName } from '@rental-peshawar/shared-types';

export interface PeshawarLocalityMeta {
  name: PeshawarLocalityName;
  slug: string;
  postalCode: string;
  centerCoordinates: {
    latitude: number;
    longitude: number;
  };
  description: string;
  tags: string[];
}

/**
 * 15 Verified Initial Localities in Peshawar
 */
export const PESHAWAR_LOCALITIES_CONFIG: PeshawarLocalityMeta[] = [
  {
    name: PeshawarLocalityName.UNIVERSITY_TOWN,
    slug: 'university-town',
    postalCode: '25120',
    centerCoordinates: { latitude: 33.9982, longitude: 71.4883 },
    description:
      'Prominent educational and residential hub adjacent to University of Peshawar and Khyber Medical College.',
    tags: ['educational', 'hostels', 'apartments', 'mixed'],
  },
  {
    name: PeshawarLocalityName.HAYATABAD,
    slug: 'hayatabad',
    postalCode: '25100',
    centerCoordinates: { latitude: 33.9875, longitude: 71.4332 },
    description: 'Premier planned residential township in Peshawar divided into phases 1 to 7.',
    tags: ['planned', 'families', 'gated', 'modern'],
  },
  {
    name: PeshawarLocalityName.UNIVERSITY_ROAD,
    slug: 'university-road',
    postalCode: '25120',
    centerCoordinates: { latitude: 34.0045, longitude: 71.5034 },
    description:
      'Major transit and commercial arterial corridor with numerous residential complexes and student hostels.',
    tags: ['transit', 'student-hub', 'commercial-residential'],
  },
  {
    name: PeshawarLocalityName.SADDAR,
    slug: 'saddar',
    postalCode: '25000',
    centerCoordinates: { latitude: 34.0086, longitude: 71.5583 },
    description:
      'Historic central commercial and administrative district of Peshawar with classic apartments.',
    tags: ['central', 'commercial', 'historic'],
  },
  {
    name: PeshawarLocalityName.GULBAHAR,
    slug: 'gulbahar',
    postalCode: '25000',
    centerCoordinates: { latitude: 34.0162, longitude: 71.5912 },
    description:
      'High-density residential neighborhood near Grand Trunk Road, popular among families.',
    tags: ['family', 'accessible', 'traditional'],
  },
  {
    name: PeshawarLocalityName.TEHKAL,
    slug: 'tehkal',
    postalCode: '25120',
    centerCoordinates: { latitude: 34.0028, longitude: 71.5126 },
    description:
      'Bustling neighborhood between Saddar and University Town, highly affordable for students.',
    tags: ['student-affordable', 'transit', 'dense'],
  },
  {
    name: PeshawarLocalityName.BOARD_BAZAAR,
    slug: 'board-bazaar',
    postalCode: '25120',
    centerCoordinates: { latitude: 33.9975, longitude: 71.4721 },
    description: 'Commercial and residential hub around BISE Peshawar, near Jamrud Road.',
    tags: ['student-hub', 'market', 'affordable'],
  },
  {
    name: PeshawarLocalityName.WARSAK_ROAD,
    slug: 'warsak-road',
    postalCode: '25000',
    centerCoordinates: { latitude: 34.0456, longitude: 71.5167 },
    description:
      'Northern suburban artery featuring modern residential housing societies and defense colonies.',
    tags: ['suburban', 'peaceful', 'family-homes'],
  },
  {
    name: PeshawarLocalityName.RING_ROAD,
    slug: 'ring-road',
    postalCode: '25000',
    centerCoordinates: { latitude: 33.9854, longitude: 71.5832 },
    description:
      'Perimeter bypass highway offering rapid transit and newly developed residential blocks.',
    tags: ['highway', 'developing', 'accessible'],
  },
  {
    name: PeshawarLocalityName.DALAZAK_ROAD,
    slug: 'dalazak-road',
    postalCode: '25000',
    centerCoordinates: { latitude: 34.0321, longitude: 71.6124 },
    description:
      'North-eastern residential sector known for budget-friendly family houses and quiet enclaves.',
    tags: ['budget', 'family', 'residential'],
  },
  {
    name: PeshawarLocalityName.REGI_MODEL_TOWN,
    slug: 'regi-model-town',
    postalCode: '25130',
    centerCoordinates: { latitude: 34.0624, longitude: 71.4112 },
    description: 'Large-scale government planned modern township situated north-west of Peshawar.',
    tags: ['planned', 'modern', 'future-growth'],
  },
  {
    name: PeshawarLocalityName.PESHAWAR_CANTT,
    slug: 'peshawar-cantt',
    postalCode: '25000',
    centerCoordinates: { latitude: 34.0035, longitude: 71.5432 },
    description:
      'Prestige cantonment sector with strict security, landscaped avenues, and historic bungalows.',
    tags: ['cantonment', 'high-security', 'prestigious'],
  },
  {
    name: PeshawarLocalityName.DANISH_ABAD,
    slug: 'danish-abad',
    postalCode: '25120',
    centerCoordinates: { latitude: 33.9892, longitude: 71.4764 },
    description:
      'Quiet enclave adjacent to Islamia College and Agricultural University, favored by faculty and students.',
    tags: ['faculty', 'students', 'quiet'],
  },
  {
    name: PeshawarLocalityName.NASIR_BAGH_ROAD,
    slug: 'nasir-bagh-road',
    postalCode: '25130',
    centerCoordinates: { latitude: 34.0245, longitude: 71.4421 },
    description:
      'Connecting corridor linking University of Peshawar to Regi Model Town with gated communities.',
    tags: ['gated', 'spacious', 'family-friendly'],
  },
  {
    name: PeshawarLocalityName.WAPDA_TOWN,
    slug: 'wapda-town',
    postalCode: '25130',
    centerCoordinates: { latitude: 34.0156, longitude: 71.4023 },
    description: 'Planned residential community near Taru Jabba and Motorway interchange.',
    tags: ['planned', 'family-community', 'secure'],
  },
];

/**
 * GeoJSON Polygon defining the active Peshawar Metropolitan Service Boundary.
 * Coordinates are formatted as [longitude, latitude] in WGS84 (EPSG:4326).
 */
export const PESHAWAR_SERVICE_BOUNDARY_POLYGON: [number, number][] = [
  [71.35, 33.92],
  [71.42, 33.91],
  [71.55, 33.92],
  [71.68, 33.96],
  [71.72, 34.04],
  [71.69, 34.12],
  [71.58, 34.16],
  [71.42, 34.14],
  [71.36, 34.08],
  [71.35, 33.92], // Polygon closed loop
];

/**
 * Point-in-polygon ray casting algorithm to check if GPS coordinates
 * fall strictly inside the Peshawar service boundary.
 */
export function isCoordinateWithinPeshawarBoundary(latitude: number, longitude: number): boolean {
  const polygon = PESHAWAR_SERVICE_BOUNDARY_POLYGON;
  let isInside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const pointI = polygon[i];
    const pointJ = polygon[j];
    if (!pointI || !pointJ) continue;

    const xi = pointI[0];
    const yi = pointI[1];
    const xj = pointJ[0];
    const yj = pointJ[1];

    const intersect =
      yi > latitude !== yj > latitude && longitude < ((xj - xi) * (latitude - yi)) / (yj - yi) + xi;

    if (intersect) {
      isInside = !isInside;
    }
  }

  return isInside;
}
