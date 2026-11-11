import { PropertyType } from '@rental-peshawar/shared-types';
import { calculateHaversineDistanceKm } from './property.validator';

/**
 * Normalizes title by removing punctuation, extra spaces, and lowercase.
 */
export function normalizeTitle(title: string): string {
  if (!title) return '';
  return title
    .toLowerCase()
    .replace(/[^\w\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export interface PropertyDuplicateCandidate {
  id?: string;
  landlordId: string;
  localityId: string;
  propertyType: PropertyType;
  title: string;
  monthlyRentPkr: number;
  latitude: number;
  longitude: number;
}

/**
 * Checks if candidate listing is a near-duplicate of an existing listing:
 * - Same landlord ID
 * - Same locality ID
 * - Same property type
 * - Coordinates within 100 meters (<= 0.1 km)
 * - Rent within 10%
 * - Normalized title match or high similarity
 */
export function isNearDuplicateListing(
  candidate: PropertyDuplicateCandidate,
  existing: PropertyDuplicateCandidate,
): boolean {
  if (candidate.landlordId !== existing.landlordId) return false;
  if (candidate.localityId !== existing.localityId) return false;
  if (candidate.propertyType !== existing.propertyType) return false;

  // 1. Distance <= 100m (0.1km)
  const distanceKm = calculateHaversineDistanceKm(
    candidate.latitude,
    candidate.longitude,
    existing.latitude,
    existing.longitude,
  );
  if (distanceKm > 0.1) return false;

  // 2. Rent within 10%
  const existRent = Number(existing.monthlyRentPkr);
  const candRent = Number(candidate.monthlyRentPkr);
  if (existRent > 0) {
    const diffRatio = Math.abs(existRent - candRent) / existRent;
    if (diffRatio > 0.1) return false;
  }

  // 3. Title similarity
  const t1 = normalizeTitle(candidate.title);
  const t2 = normalizeTitle(existing.title);
  if (t1 === t2 || t1.includes(t2) || t2.includes(t1)) {
    return true;
  }

  return false;
}

/**
 * Computes a real listing quality score (0 - 100) based on listing completeness.
 */
export function calculateListingQualityScore(property: {
  title?: string | null;
  description?: string | null;
  images?: unknown[] | null;
  amenities?: unknown[] | null;
  addressNote?: string | null;
  monthlyRentPkr?: number | { toNumber(): number } | string | null;
  securityDepositPkr?: number | { toNumber(): number } | string | null;
}): number {
  let score = 0;

  // 1. Title quality (length >= 20 chars) -> 15 pts
  const title = property.title || '';
  if (title.length >= 20) {
    score += 15;
  } else if (title.length >= 10) {
    score += 8;
  }

  // 2. Description detail (length >= 100 chars) -> 20 pts
  const desc = property.description || '';
  if (desc.length >= 150) {
    score += 20;
  } else if (desc.length >= 80) {
    score += 12;
  } else if (desc.length >= 30) {
    score += 5;
  }

  // 3. Images count (at least 4 images) -> 25 pts
  const imgCount = property.images ? property.images.length : 0;
  if (imgCount >= 4) {
    score += 25;
  } else if (imgCount >= 2) {
    score += 15;
  } else if (imgCount >= 1) {
    score += 8;
  }

  // 4. Amenities specified (at least 3 amenities) -> 15 pts
  const amenityCount = property.amenities ? property.amenities.length : 0;
  if (amenityCount >= 3) {
    score += 15;
  } else if (amenityCount >= 1) {
    score += 8;
  }

  // 5. Precise address note / landmark -> 10 pts
  if (property.addressNote && property.addressNote.trim().length >= 5) {
    score += 10;
  }

  // 6. Security deposit standard (<= 3 months rent) -> 15 pts
  const rent =
    typeof property.monthlyRentPkr === 'object' &&
    property.monthlyRentPkr &&
    'toNumber' in property.monthlyRentPkr
      ? property.monthlyRentPkr.toNumber()
      : Number(property.monthlyRentPkr || 0);
  const deposit =
    typeof property.securityDepositPkr === 'object' &&
    property.securityDepositPkr &&
    'toNumber' in property.securityDepositPkr
      ? property.securityDepositPkr.toNumber()
      : Number(property.securityDepositPkr || 0);

  if (rent > 0 && deposit >= 0 && deposit <= rent * 3) {
    score += 15;
  } else if (rent > 0 && deposit >= 0) {
    score += 5;
  }

  return Math.min(100, Math.max(0, score));
}
