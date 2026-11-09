import {
  UserRole,
  TenantType,
  PropertyEligibility,
  PropertyStatus,
  PropertyType,
  ReportReason,
  NotificationType,
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
  description?: string | null;
  localityId?: string;
  localityName?: string;
  locality?: {
    id: string;
    name: string;
    slug?: string;
    postalCode?: string;
  };
  eligibility: PropertyEligibility;
  propertyType: PropertyType;
  status?: PropertyStatus;
  monthlyRentPkr: number;
  securityDepositPkr: number;
  bedrooms: number;
  bathrooms: number;
  areaSqFt?: number | null;
  furnishing?: string | null;
  coordinates: CoordinatesDto;
  addressNote?: string | null;
  address?: string;
  isAvailable: boolean;
  isFeatured?: boolean;
  viewCount?: number;
  inquiryCount?: number;
  favoriteCount?: number;
  images: PropertyImageDto[];
  amenities: AmenityDto[];
  createdAt?: string;
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

export interface GetUploadUrlDto {
  purpose: 'property_image' | 'cnic_document' | 'selfie';
  propertyId?: string;
  mimeType: string;
  fileSizeBytes: number;
}

export interface UploadUrlResponseDto {
  uploadUrl: string;
  method: string;
  storageKey: string;
  expiresInSeconds: number;
  headers?: Record<string, string>;
  publicUrl?: string;
}

export interface CompleteUploadDto {
  storageKey: string;
  propertyId?: string;
  caption?: string;
  isPrimary?: boolean;
  sortOrder?: number;
  width?: number;
  height?: number;
  fileSizeBytes: number;
  mimeType: string;
  checksum?: string;
}

export interface ModerateImageDto {
  status: 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
}

export interface SubmitVerificationDto {
  fullName: string;
  phoneNumber: string;
  cnicNumber: string;
  cnicFrontStorageKey: string;
  cnicBackStorageKey: string;
  selfieStorageKey: string;
  address: string;
}

export interface ReviewVerificationDto {
  status: 'VERIFIED' | 'REJECTED' | 'EXPIRED';
  reviewNotes?: string;
}

export interface VerificationResponseDto {
  id: string;
  userId: string;
  fullName: string;
  phoneNumber: string;
  cnicNumberMasked: string;
  status: 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED' | 'EXPIRED';
  address?: string | null;
  reviewNotes?: string | null;
  verifiedAt?: string | null;
  createdAt: string;
}

export interface CreateReportDto {
  targetType: 'PROPERTY' | 'USER';
  targetId: string;
  reason: string;
  details?: string;
}

export interface ReviewReportDto {
  status: 'IN_REVIEW' | 'RESOLVED' | 'DISMISSED';
  resolutionNotes?: string;
}

export interface ReportResponseDto {
  id: string;
  reporterId: string;
  targetType: string;
  targetId: string;
  reason: string;
  details?: string | null;
  status: string;
  resolutionNotes?: string | null;
  createdAt: string;
}

export interface NotificationDto {
  id: string;
  userId: string;
  type: string | NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: string;
}

export interface CreateInquiryDto {
  propertyId: string;
  message: string;
  proposedRentPkr?: number;
  proposedMoveInDate?: string;
  preferredContactMethod?: 'PHONE' | 'WHATSAPP' | 'IN_APP';
}

export interface UpdateInquiryStatusDto {
  status: 'SUBMITTED' | 'SEEN' | 'REPLIED' | 'ACCEPTED' | 'DECLINED' | 'CLOSED';
  note?: string;
}

export interface InquiryResponseDto {
  id: string;
  propertyId: string;
  tenantId: string;
  landlordId: string;
  status: string;
  message: string;
  proposedRentPkr?: number | null;
  proposedMoveInDate?: string | null;
  preferredContactMethod?: string | null;
  conversationId?: string | null;
  whatsappUrl?: string | null;
  canContactWhatsapp?: boolean;
  createdAt: string;
  updatedAt: string;
  property?: PropertySummaryDto;
  tenant?: {
    id: string;
    fullName: string;
    email: string;
    phoneNumber?: string | null;
  };
  landlord?: {
    id: string;
    fullName: string;
    email: string;
    phoneNumber?: string | null;
    whatsappNumber?: string | null;
  };
}

export interface ConversationParticipantDto {
  id: string;
  userId: string;
  fullName: string;
  role?: string;
  lastReadAt?: string | null;
  joinedAt?: string;
}

export interface MessageDto {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
  sender?: {
    id: string;
    fullName: string;
    email?: string;
  };
}

export interface ConversationSummaryDto {
  id: string;
  inquiryId?: string | null;
  propertyId?: string | null;
  property?: PropertySummaryDto | null;
  isBlocked: boolean;
  blockedById?: string | null;
  blockedAt?: string | null;
  lastMessageAt?: string | null;
  createdAt: string;
  updatedAt: string;
  participants: ConversationParticipantDto[];
  lastMessage?: MessageDto | null;
  unreadCount?: number;
  inquiryStatus?: string | null;
  whatsappUrl?: string | null;
  canContactWhatsapp?: boolean;
}

export interface SendMessageDto {
  content: string;
}

export interface BlockConversationDto {
  reason?: string;
}

export interface ReportConversationDto {
  reason: ReportReason;
  details: string;
}

export interface RegisterDeviceDto {
  fcmToken: string;
  platform: 'ANDROID' | 'IOS' | 'WEB';
}

export interface DeviceTokenDto {
  id: string;
  userId: string;
  fcmToken: string;
  platform: string;
  lastActiveAt: string;
  createdAt: string;
}

export interface FavoriteResponseDto {
  id: string;
  userId: string;
  propertyId: string;
  createdAt: string;
  property?: PropertySummaryDto;
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
