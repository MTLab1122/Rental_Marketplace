import { HttpException, HttpStatus } from '@nestjs/common';
import {
  PropertyEligibility,
  PropertyType,
  STUDENT_PROPERTY_TYPES,
  FAMILY_PROPERTY_TYPES,
  ErrorCode,
} from '@rental-peshawar/shared-types';
import { isCoordinateWithinCityBoundary } from '@rental-peshawar/config';

export function validateEligibilityAndPropertyType(
  eligibility: PropertyEligibility,
  propertyType: PropertyType,
): void {
  let isAllowed = false;

  if (eligibility === PropertyEligibility.STUDENTS_ONLY) {
    isAllowed = (STUDENT_PROPERTY_TYPES as readonly PropertyType[]).includes(propertyType);
  } else if (eligibility === PropertyEligibility.FAMILIES_ONLY) {
    isAllowed = (FAMILY_PROPERTY_TYPES as readonly PropertyType[]).includes(propertyType);
  }

  if (!isAllowed) {
    throw new HttpException(
      {
        code: ErrorCode.INVALID_ELIGIBILITY_PROPERTY_TYPE,
        message: `Eligibility constraint violation: ${eligibility} does not allow property type ${propertyType}.`,
      },
      HttpStatus.UNPROCESSABLE_ENTITY, // 422
    );
  }
}

/**
 * Validates coordinates against a municipal service boundary (defaults to PESHAWAR)
 */
export function validateCityCoordinates(
  latitude: number,
  longitude: number,
  cityCode = 'PESHAWAR',
): void {
  const isInside = isCoordinateWithinCityBoundary(latitude, longitude, cityCode);
  if (!isInside) {
    throw new HttpException(
      {
        code: ErrorCode.LOCATION_OUTSIDE_PESHAWAR,
        message: `Location constraint violation: Coordinates (${latitude}, ${longitude}) are outside the verified ${cityCode} metropolitan service boundary.`,
      },
      HttpStatus.UNPROCESSABLE_ENTITY, // 422
    );
  }
}

/**
 * Validates whether GPS coordinates fall strictly inside Peshawar's metropolitan boundary.
 */
export function validatePeshawarCoordinates(latitude: number, longitude: number): void {
  validateCityCoordinates(latitude, longitude, 'PESHAWAR');
}

/**
 * Validates whether GPS coordinates fall within a GeoJSON Polygon or MultiPolygon
 */
export function isCoordinateWithinGeoJsonPolygon(
  latitude: number,
  longitude: number,
  geoJson: Record<string, unknown>,
): boolean {
  if (!geoJson || typeof geoJson !== 'object') {
    return true; // No boundary polygon defined, defer to city boundary
  }

  const type = geoJson['type'] as string | undefined;
  const coordinates = geoJson['coordinates'] as unknown;

  if (!type || !coordinates || !Array.isArray(coordinates)) {
    return true;
  }

  const checkRing = (ring: [number, number][]): boolean => {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const pI = ring[i];
      const pJ = ring[j];
      if (!pI || !pJ) continue;
      const xi = pI[0],
        yi = pI[1];
      const xj = pJ[0],
        yj = pJ[1];

      const intersect =
        yi > latitude !== yj > latitude &&
        longitude < ((xj - xi) * (latitude - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  };

  if (type === 'Polygon') {
    const outerRing = (coordinates as [number, number][][])[0];
    if (outerRing && Array.isArray(outerRing)) {
      return checkRing(outerRing);
    }
  }

  return true;
}

/**
 * Calculates Haversine distance in kilometers between two GPS coordinates
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
