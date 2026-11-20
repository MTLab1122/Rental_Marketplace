import { PESHAWAR_SERVICE_BOUNDARY_POLYGON } from './peshawar.js';

export interface CityConfig {
  code: string;
  name: string;
  province: string;
  defaultPostalCode: string;
  centerCoordinates: {
    latitude: number;
    longitude: number;
  };
  serviceBoundaryPolygon: [number, number][];
  isActive: boolean;
}

/**
 * Verified Initial Multi-City Geographic Registry for Khyber Pakhtunkhwa (KP)
 */
export const CITIES_REGISTRY: Record<string, CityConfig> = {
  PESHAWAR: {
    code: 'PESHAWAR',
    name: 'Peshawar',
    province: 'Khyber Pakhtunkhwa',
    defaultPostalCode: '25000',
    centerCoordinates: { latitude: 34.0151, longitude: 71.5249 },
    serviceBoundaryPolygon: PESHAWAR_SERVICE_BOUNDARY_POLYGON,
    isActive: true,
  },
  MARDAN: {
    code: 'MARDAN',
    name: 'Mardan',
    province: 'Khyber Pakhtunkhwa',
    defaultPostalCode: '23200',
    centerCoordinates: { latitude: 34.1989, longitude: 72.0404 },
    serviceBoundaryPolygon: [
      [71.95, 34.12],
      [72.18, 34.12],
      [72.18, 34.28],
      [71.95, 34.28],
      [71.95, 34.12], // Closed polygon loop
    ],
    isActive: true,
  },
  ABBOTTABAD: {
    code: 'ABBOTTABAD',
    name: 'Abbottabad',
    province: 'Khyber Pakhtunkhwa',
    defaultPostalCode: '22010',
    centerCoordinates: { latitude: 34.1688, longitude: 73.2215 },
    serviceBoundaryPolygon: [
      [73.12, 34.1],
      [73.3, 34.1],
      [73.3, 34.26],
      [73.12, 34.26],
      [73.12, 34.1], // Closed polygon loop
    ],
    isActive: true,
  },
};

/**
 * Standard ray casting algorithm for point-in-polygon verification.
 * Coordinates are formatted as [longitude, latitude] in WGS84 (EPSG:4326).
 */
export function isCoordinateWithinPolygon(
  latitude: number,
  longitude: number,
  polygon: [number, number][],
): boolean {
  if (!polygon || polygon.length < 3) return false;
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

/**
 * Checks if GPS coordinates fall within the service boundary of a specified city.
 */
export function isCoordinateWithinCityBoundary(
  latitude: number,
  longitude: number,
  cityCode = 'PESHAWAR',
): boolean {
  const city = CITIES_REGISTRY[cityCode.toUpperCase()];
  if (!city || !city.isActive) return false;
  return isCoordinateWithinPolygon(latitude, longitude, city.serviceBoundaryPolygon);
}

/**
 * Dynamically registers or updates a target city configuration in runtime memory
 * without requiring architectural changes or server recompilation.
 */
export function registerDynamicCity(config: CityConfig): void {
  CITIES_REGISTRY[config.code.toUpperCase()] = config;
}

/**
 * Retrieves configuration for a given city code
 */
export function getCityConfig(cityCode: string): CityConfig | undefined {
  return CITIES_REGISTRY[cityCode.toUpperCase()];
}

/**
 * Returns a list of all currently active municipal service areas
 */
export function listSupportedCities(): CityConfig[] {
  return Object.values(CITIES_REGISTRY).filter((c) => c.isActive);
}
