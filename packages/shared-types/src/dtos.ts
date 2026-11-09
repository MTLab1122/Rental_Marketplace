import { UserRole, TenantType, PropertyEligibility, PropertyStatus } from './enums.js';

export interface HealthStatusDto {
  status: 'ok' | 'degraded' | 'down';
  timestamp: string;
  uptime: number;
  environment: string;
  version: string;
}

export interface ReadyStatusDto {
  status: 'ready' | 'not_ready';
  timestamp: string;
  checks: {
    database: 'up' | 'down';
    redis: 'up' | 'down';
  };
}

export interface CoordinatesDto {
  latitude: number;
  longitude: number;
}

export interface LocalityDto {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  centerLatitude: number;
  centerLongitude: number;
  propertyCount?: number;
}

export interface UserSummaryDto {
  id: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  role: UserRole;
  tenantType?: TenantType;
  isVerified: boolean;
  createdAt: string;
}

export interface PropertySummaryDto {
  id: string;
  title: string;
  localityId: string;
  localityName: string;
  eligibility: PropertyEligibility;
  status: PropertyStatus;
  monthlyRentPkr: number;
  securityDepositPkr: number;
  bedrooms: number;
  bathrooms: number;
  coordinates: CoordinatesDto;
  isAvailable: boolean;
  createdAt: string;
}
