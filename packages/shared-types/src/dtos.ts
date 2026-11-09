import {
  UserRole,
  TenantType,
  PropertyEligibility,
  PropertyStatus,
  PropertyType,
} from './enums.js';

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
  description?: string | null;
  postalCode: string;
  latitude: number;
  longitude: number;
  boundaryGeoJson?: Record<string, unknown> | null;
  isActive: boolean;
  sortOrder: number;
  propertyCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateLocalityDto {
  name: string;
  slug?: string;
  description?: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  boundaryGeoJson?: Record<string, unknown>;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdateLocalityDto {
  name?: string;
  slug?: string;
  description?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  boundaryGeoJson?: Record<string, unknown>;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdateLocalityStatusDto {
  isActive: boolean;
}

/**
 * Authentication DTOs
 */
export interface RegisterDto {
  email: string;
  password: string;
  fullName: string;
  phoneNumber: string;
  role: UserRole;
  tenantType?: TenantType;
  institutionName?: string;
  businessName?: string;
}

export interface LoginDto {
  emailOrPhone: string;
  password: string;
  deviceId?: string;
}

export interface RefreshTokenDto {
  refreshToken: string;
  deviceId?: string;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface ResetPasswordDto {
  token: string;
  newPassword: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponseData {
  user: UserSummaryDto;
  tokens: AuthTokens;
}

export interface UserSummaryDto {
  id: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  roles: UserRole[];
  tenantType?: TenantType | null;
  isVerified: boolean;
  isSuspended: boolean;
  createdAt: string;
}

export interface UserProfileDto extends UserSummaryDto {
  tenantProfile?: {
    id: string;
    tenantType: TenantType;
    institutionName?: string | null;
    studentIdCardUrl?: string | null;
    familyMembersCount?: number | null;
  } | null;
  landlordProfile?: {
    id: string;
    cnicNumber?: string | null;
    isCnicVerified: boolean;
    businessName?: string | null;
    officeAddress?: string | null;
  } | null;
  adminProfile?: {
    id: string;
    department?: string | null;
    designation?: string | null;
  } | null;
  permissions: string[];
}

export interface UpdateProfileDto {
  fullName?: string;
  phoneNumber?: string;
  institutionName?: string;
  familyMembersCount?: number;
  businessName?: string;
  officeAddress?: string;
}

export interface PropertyImageDto {
  id: string;
  url: string;
  caption?: string | null;
  isPrimary: boolean;
  sortOrder: number;
}

export interface AmenityDto {
  id: string;
  name: string;
  code: string;
  category: string;
  icon?: string | null;
}

export interface PropertySummaryDto {
  id: string;
  title: string;
  slug: string;
  localityId: string;
  localityName: string;
  eligibility: PropertyEligibility;
  propertyType: PropertyType;
  status: PropertyStatus;
  monthlyRentPkr: number;
  securityDepositPkr: number;
  bedrooms: number;
  bathrooms: number;
  areaSqFt?: number | null;
  furnishing?: string | null;
  coordinates: CoordinatesDto;
  addressNote?: string | null;
  isAvailable: boolean;
  isFeatured: boolean;
  viewCount: number;
  inquiryCount: number;
  favoriteCount: number;
  images: PropertyImageDto[];
  amenities: AmenityDto[];
  createdAt: string;
}

export interface CreatePropertyDto {
  title: string;
  description: string;
  eligibility: PropertyEligibility;
  propertyType: PropertyType;
  monthlyRentPkr: number;
  securityDepositPkr: number;
  bedrooms: number;
  bathrooms: number;
  areaSqFt?: number;
  furnishing?: string;
  address: string;
  addressNote?: string;
  latitude: number;
  longitude: number;
  localityId: string;
  amenityIds?: string[];
  images?: {
    url: string;
    caption?: string;
    isPrimary?: boolean;
    sortOrder?: number;
  }[];
}

export interface UpdatePropertyDto {
  title?: string;
  description?: string;
  eligibility?: PropertyEligibility;
  propertyType?: PropertyType;
  monthlyRentPkr?: number;
  securityDepositPkr?: number;
  bedrooms?: number;
  bathrooms?: number;
  areaSqFt?: number;
  furnishing?: string;
  address?: string;
  addressNote?: string;
  latitude?: number;
  longitude?: number;
  localityId?: string;
  amenityIds?: string[];
  images?: {
    url: string;
    caption?: string;
    isPrimary?: boolean;
    sortOrder?: number;
  }[];
}

export interface UpdatePropertyStatusDto {
  status: PropertyStatus;
  reason?: string;
}

export interface PropertySearchQueryDto {
  eligibility?: PropertyEligibility;
  tenantType?: TenantType;
  localityId?: string;
  propertyType?: PropertyType;
  minRent?: number;
  maxRent?: number;
  minBedrooms?: number;
  maxBedrooms?: number;
  minBathrooms?: number;
  furnished?: boolean | string;
  amenityIds?: string[];
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  boundingBox?: string; // minLat,minLng,maxLat,maxLng
  sort?: 'newest' | 'lowest_rent' | 'highest_rent' | 'nearest';
  cursor?: string;
  limit?: number;
}

export interface PaginatedResultDto<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
  total?: number;
}

export interface AuditLogDto {
  id: string;
  actorId?: string | null;
  action: string;
  targetType: string;
  targetId?: string | null;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
}

export enum PermissionCode {
  // Properties
  PROPERTY_CREATE = 'property:create',
  PROPERTY_READ_ALL = 'property:read_all',
  PROPERTY_UPDATE_OWN = 'property:update_own',
  PROPERTY_UPDATE_ANY = 'property:update_any',
  PROPERTY_DELETE_OWN = 'property:delete_own',
  PROPERTY_DELETE_ANY = 'property:delete_any',
  PROPERTY_APPROVE = 'property:approve',
  PROPERTY_REJECT = 'property:reject',
  PROPERTY_SUSPEND = 'property:suspend',

  // Localities
  LOCALITY_MANAGE = 'locality:manage',

  // Inquiries
  INQUIRY_CREATE = 'inquiry:create',
  INQUIRY_READ_OWN = 'inquiry:read_own',
  INQUIRY_RESPOND = 'inquiry:respond',

  // Users & Moderation
  USER_READ_ALL = 'user:read_all',
  USER_SUSPEND = 'user:suspend',
  USER_VERIFY = 'user:verify',
  ADMIN_MANAGE = 'admin:manage',
  AUDIT_READ = 'audit:read',
}
