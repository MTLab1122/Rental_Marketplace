import {
  UserRole,
  TenantType,
  PropertyEligibility,
  PropertyStatus,
  PropertyType,
  ReportReason,
  NotificationType,
  AlertFrequency,
  AlertDeliveryStatus,
  RecommendationReason,
  RecommendationType,
  BookingStatus,
  PaymentStatus,
  PaymentMethodType,
  AgreementStatus,
  LedgerEntryType,
  DisputeCategory,
  DisputeStatus,
  DomainEventType,
  BackgroundJobName,
  RiskLevel,
  RiskEntityType,
  AiSuggestionType,
  AiSuggestionStatus,
  PriceContextIndicator,
  ContentModerationFlag,
  ErrorBudgetTier,
  SloStatus,
  FeedbackCategory,
  ExperimentStatus,
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
  moderationStatus?: string;
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
  availableFromDate?: string | null;
  isDuplicateWarning?: boolean;
  isDuplicateConfirmed?: boolean;
  images: PropertyImageDto[];
  amenities: AmenityDto[];
  createdAt?: string;
  landlordId?: string;
  landlord?: {
    id: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    isVerified?: boolean;
    profileImage?: string | null;
    createdAt?: string;
  };
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
  availableFromDate?: string;
  allowDuplicateBypass?: boolean;
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

export interface LandlordDashboardSummaryDto {
  totalProperties: number;
  activeListings: number;
  pendingReview: number;
  rentedCount: number;
  unavailableCount: number;
  totalInquiries: number;
  unreadInquiries: number;
  unreadMessagesCount: number;
  totalViews: number;
  averageResponseTimeMinutes: number | null;
  responseRatePercent: number | null;
  recentInquiries: InquiryResponseDto[];
  verification: {
    isVerified: boolean;
    status: string;
    cnicMasked?: string | null;
  };
}

export interface PropertyAnalyticsDto {
  propertyId: string;
  propertyTitle: string;
  totalViews: number;
  uniqueViews: number;
  favoritesCount: number;
  inquiriesCount: number;
  responseRatePercent: number | null;
  averageResponseTimeMinutes: number | null;
  qualityScore: number;
  viewsBySource: {
    mobile: number;
    web: number;
    adminReferral: number;
  };
  viewsByLocality: Record<string, number>;
}

export interface DuplicateCheckRequestDto {
  localityId: string;
  propertyType: PropertyType;
  monthlyRentPkr: number;
  latitude: number;
  longitude: number;
  title: string;
}

export interface DuplicateCheckResponseDto {
  isDuplicate: boolean;
  matchedPropertyId?: string;
  matchedPropertyTitle?: string;
  warningMessage?: string;
}

export interface RecordViewEventDto {
  source?: 'MOBILE' | 'WEB' | 'ADMIN_REFERRAL';
  localityId?: string;
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

  // Phase 8 Admin Console Permissions
  MANAGE_USERS = 'manage:users',
  MANAGE_LANDLORDS = 'manage:landlords',
  MANAGE_PROPERTIES = 'manage:properties',
  MODERATE_LISTINGS = 'moderate:listings',
  REVIEW_REPORTS = 'review:reports',
  MANAGE_LOCALITIES = 'manage:localities',
  MANAGE_NOTIFICATIONS = 'manage:notifications',
  VIEW_ANALYTICS = 'view:analytics',
  MANAGE_SETTINGS = 'manage:settings',
  MANAGE_ADMINS = 'manage:admins',
  VIEW_AUDIT_LOGS = 'view:audit_logs',
}

// ==========================================
// Phase 8 Admin Console DTOs
// ==========================================

export interface AdminUserListItemDto {
  id: string;
  email: string;
  phoneNumber: string;
  fullName: string;
  isVerified: boolean;
  isSuspended: boolean;
  suspendedReason?: string | null;
  roles: string[];
  tenantType?: string | null;
  propertiesCount?: number;
  inquiriesCount?: number;
  reportsCount?: number;
  createdAt: string;
  lastLoginAt?: string | null;
}

export interface AdminUserDetailDto extends AdminUserListItemDto {
  failedLoginAttempts: number;
  lockedUntil?: string | null;
  isMfaEnabled: boolean;
  verificationRecord?: {
    id: string;
    status: string;
    cnicMasked?: string | null;
    documentType?: string | null;
    documentUrl?: string | null;
    selfieUrl?: string | null;
    submittedAt: string;
    verifiedAt?: string | null;
    reviewNotes?: string | null;
  } | null;
  auditHistory?: {
    id: string;
    action: string;
    createdAt: string;
    ipAddress?: string | null;
  }[];
}

export interface AdminAnalyticsOverviewDto {
  totalUsers: number;
  activeUsers: number;
  tenantsByType: {
    student: number;
    family: number;
  };
  landlordsTotal: number;
  verifiedLandlords: number;
  propertiesByStatus: {
    approved: number;
    pendingReview: number;
    rejected: number;
    suspended: number;
    rented: number;
    unavailable: number;
    draft: number;
  };
  propertiesByEligibility: {
    studentsOnly: number;
    familiesOnly: number;
  };
  propertiesByLocality: Record<string, number>;
  totalInquiries: number;
  totalMessages: number;
  totalReports: {
    open: number;
    resolved: number;
    dismissed: number;
  };
  moderationSlaHours: number;
  searchToInquiryConversionRate: number;
  viewsTotal: number;
}

export interface AdminAnalyticsTrendsDto {
  daily: { date: string; views: number; inquiries: number; newUsers: number }[];
  weekly: { week: string; views: number; inquiries: number; listings: number }[];
  monthly: { month: string; views: number; inquiries: number; listings: number }[];
}

export interface AdminAuditLogItemDto {
  id: string;
  actorId?: string | null;
  actorName?: string | null;
  actorEmail?: string | null;
  action: string;
  targetType: string;
  targetId?: string | null;
  before?: unknown;
  after?: unknown;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
}

export interface SystemSettingDto {
  key: string;
  value: unknown;
  description?: string | null;
  updatedBy?: string | null;
  updatedAt: string;
}

export interface MfaSetupResponseDto {
  secret: string;
  qrCodeUrl: string;
  otpauthUrl: string;
}

// ==========================================
// PHASE 12: SAVED SEARCHES, ALERTS & RECOMMENDATIONS
// ==========================================

export interface SavedSearchFiltersDto {
  eligibility?: PropertyEligibility;
  localityId?: string;
  localitySlug?: string;
  propertyType?: PropertyType;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  furnishing?: string;
  amenities?: string[];
  radiusKm?: number;
  latitude?: number;
  longitude?: number;
  northEastLat?: number;
  northEastLng?: number;
  southWestLat?: number;
  southWestLng?: number;
  sortPreference?: string;
  query?: string;
}

export interface CreateSavedSearchDto {
  name: string;
  filters: SavedSearchFiltersDto;
  sortPreference?: string;
  alertsEnabled?: boolean;
  frequency?: AlertFrequency;
}

export interface UpdateSavedSearchDto {
  name?: string;
  filters?: SavedSearchFiltersDto;
  sortPreference?: string;
  alertsEnabled?: boolean;
  frequency?: AlertFrequency;
}

export interface UpdateSavedSearchAlertsDto {
  alertsEnabled: boolean;
  frequency?: AlertFrequency;
}

export interface SavedSearchDto {
  id: string;
  userId: string;
  name: string;
  filters: SavedSearchFiltersDto;
  filterSignature: string;
  sortPreference?: string | null;
  alertsEnabled: boolean;
  frequency: AlertFrequency;
  lastNotifiedAt?: string | null;
  matchCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface SearchAlertDto {
  id: string;
  savedSearchId: string;
  savedSearchName?: string;
  userId: string;
  propertyId: string;
  property?: PropertySummaryDto;
  isRead: boolean;
  createdAt: string;
  deliveries?: SearchAlertDeliveryDto[];
}

export interface SearchAlertDeliveryDto {
  id: string;
  channel: string;
  status: AlertDeliveryStatus;
  failureReason?: string | null;
  deliveredAt?: string | null;
  createdAt: string;
}

export interface RecommendationItemDto {
  property: PropertySummaryDto;
  type?: RecommendationType;
  reason: RecommendationReason | string;
  reasonLabel: string;
  score: number;
  metadata?: Record<string, any>;
}

export interface PropertyImpressionEventDto {
  propertyId: string;
  surface: string;
  position?: number;
  sessionId?: string;
  metadata?: Record<string, any>;
}

export interface PropertyClickEventDto {
  propertyId: string;
  surface: string;
  position?: number;
  sessionId?: string;
  metadata?: Record<string, any>;
}

export interface SearchQueryEventDto {
  queryText?: string;
  filters: Record<string, any>;
  localityId?: string;
  resultsCount?: number;
  executionTimeMs?: number;
  sessionId?: string;
}

export interface LocalityDemandSnapshotDto {
  id: string;
  localityId: string;
  localityName?: string;
  period: string;
  snapshotDate: string;
  searchCount: number;
  impressionCount: number;
  clickCount: number;
  inquiryCount: number;
  savedSearchCount: number;
  averageRentDemand?: number | null;
  topPropertyType?: PropertyType | null;
  studentDemandRatio: number;
  metadata?: Record<string, any>;
}

export interface NotificationPreferenceDto {
  id?: string;
  emailAlerts: boolean;
  pushAlerts: boolean;
  inAppAlerts: boolean;
  instantAlerts: boolean;
  dailyDigest: boolean;
  weeklyDigest: boolean;
  recommendations: boolean;
}

// ==========================================
// PHASE 13: BOOKINGS, PAYMENTS, AGREEMENTS & DISPUTES
// ==========================================

export interface CreateBookingDto {
  inquiryId: string;
  propertyId: string;
  startDate: string;
  endDate: string;
  tenantCount?: number;
  notes?: string;
}

export interface UpdateBookingStatusDto {
  status: BookingStatus;
  rejectionReason?: string;
  landlordNotes?: string;
  notes?: string;
}

export interface CancelBookingDto {
  reason?: string;
  cancellationReason?: string;
}

export interface BookingDto {
  id: string;
  inquiryId: string;
  propertyId: string;
  tenantId: string;
  landlordId: string;
  status: BookingStatus;
  startDate: string;
  endDate: string;
  monthlyRentPkr: number;
  securityDepositPkr: number;
  totalInitialAmountPkr: number;
  currency: string;
  lockExpiresAt?: string | null;
  confirmedAt?: string | null;
  cancelledAt?: string | null;
  cancellationReason?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  property?: PropertySummaryDto;
  tenant?: { id: string; fullName: string; email: string; phoneNumber?: string };
  landlord?: { id: string; fullName: string; email: string; phoneNumber?: string };
  payments?: PaymentDto[];
  agreement?: RentalAgreementDto | null;
}

export interface CreatePaymentIntentDto {
  bookingId: string;
  amount?: number;
  amountPkr?: number;
  currency?: string;
  paymentMethodType: PaymentMethodType;
  metadata?: Record<string, any>;
  idempotencyKey?: string;
}

export interface ManualPaymentVerificationDto {
  approved?: boolean;
  rejectionReason?: string;
  bankName?: string;
  referenceNumber?: string;
  receiptUrl?: string;
  notes?: string;
}

export interface PaymentDto {
  id: string;
  bookingId: string;
  payerId: string;
  recipientId: string;
  amountPkr: number;
  currency: string;
  status: PaymentStatus;
  paymentMethodType: PaymentMethodType;
  provider: string;
  providerTransactionId?: string | null;
  idempotencyKey?: string | null;
  receiptUrl?: string | null;
  metadata?: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
  refunds?: RefundDto[];
}

export interface RefundDto {
  id: string;
  paymentId: string;
  amountPkr: number;
  reason: string;
  status: string;
  adminId?: string | null;
  createdAt: string;
}

export interface RentalAgreementDto {
  id: string;
  bookingId: string;
  templateId?: string | null;
  title: string;
  termsHtml: string;
  version: number;
  status: AgreementStatus;
  signedByTenantAt?: string | null;
  signedByLandlordAt?: string | null;
  pdfUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  signatures?: AgreementSignatureDto[];
}

export interface AgreementSignatureDto {
  id: string;
  agreementId: string;
  signerId: string;
  signerRole: 'TENANT' | 'LANDLORD';
  signerName: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  signatureHash: string;
  signedAt: string;
}

export interface SignAgreementDto {
  role?: 'TENANT' | 'LANDLORD';
  signatureData?: string;
}

export interface CreateDisputeDto {
  bookingId: string;
  category: DisputeCategory;
  description: string;
  amountDisputed?: number;
  amountDisputedPkr?: number;
  evidenceUrls?: string[];
}

export interface DisputeDto {
  id: string;
  bookingId: string;
  initiatorId: string;
  respondentId: string;
  category: DisputeCategory;
  status: DisputeStatus;
  description: string;
  amountDisputedPkr?: number | null;
  resolution?: string | null;
  resolvedAt?: string | null;
  resolvedById?: string | null;
  createdAt: string;
  updatedAt: string;
  messages?: DisputeMessageDto[];
  evidenceUrls?: string[];
}

export interface DisputeMessageDto {
  id: string;
  disputeId: string;
  senderId: string;
  senderRole: string;
  message: string;
  attachmentUrls?: string[];
  createdAt: string;
}

export interface ResolveDisputeDto {
  status: DisputeStatus;
  resolution: string;
  refundAmountPkr?: number;
  action?: 'REFUND' | 'REJECT' | 'PARTIAL_REFUND' | 'CLOSE';
}

export interface LedgerEntryDto {
  id: string;
  bookingId?: string | null;
  paymentId?: string | null;
  type: LedgerEntryType;
  debitAccount: string;
  creditAccount: string;
  amountPkr: number;
  description: string;
  isImmutable: boolean;
  metadata?: Record<string, any> | null;
  createdAt: string;
}

// ==========================================
// PHASE 14: EVENT-DRIVEN ARCHITECTURE & DATA PLATFORM
// ==========================================

export interface DomainEventDto {
  id?: string;
  eventId: string;
  eventType: DomainEventType;
  aggregateType: string;
  aggregateId: string;
  schemaVersion?: number;
  payload: Record<string, any>;
  metadata?: Record<string, any>;
  occurredAt: string;
}

export interface JobDto {
  id: string;
  name: BackgroundJobName;
  data: Record<string, any>;
  attemptsMade: number;
  maxAttempts: number;
  state: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed';
  failedReason?: string;
  idempotencyKey?: string;
  createdAt: string;
  processedAt?: string;
}

export interface QueueMetricsDto {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  deadLetter: number;
  backlogAlert: boolean;
}

export interface DeadLetterJobDto {
  id: string;
  jobId: string;
  queueName: string;
  jobName: string;
  payload: Record<string, any>;
  errorReason: string;
  attempts: number;
  failedAt: string;
  isResolved: boolean;
  resolvedAt?: string | null;
}

export interface ReplayEventsDto {
  fromTimestamp: string;
  toTimestamp?: string;
  eventTypes?: DomainEventType[];
}

export interface DataRetentionPolicyDto {
  id: string;
  tableName: string;
  retentionDays: number;
  archiveEnabled: boolean;
  anonymizePii: boolean;
  lastRunAt?: string | null;
}

export interface UserDataExportDto {
  exportedAt: string;
  user: Record<string, any>;
  properties: any[];
  inquiries: any[];
  bookings: any[];
  payments: any[];
  reviews: any[];
}

// ==========================================
// PHASE 15: AI, FRAUD & MARKET INTELLIGENCE DTOs
// ==========================================

export interface AiQualitySuggestionDto {
  id: string;
  propertyId: string;
  suggestionType: AiSuggestionType;
  title: string;
  message: string;
  actionableStep?: string;
  status: AiSuggestionStatus;
  modelVersion: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface PricingInsightDto {
  propertyId: string;
  localityId: string;
  currentRentPkr: number;
  medianRentPkr: number;
  percentile25Pkr: number;
  percentile75Pkr: number;
  recommendedMinRentPkr: number;
  recommendedMaxRentPkr: number;
  priceContext: PriceContextIndicator;
  sampleCount: number;
  disclaimer: string;
}

export interface SemanticSearchQueryDto {
  query: string;
  eligibility?: PropertyEligibility;
  localityId?: string;
  propertyType?: PropertyType;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  limit?: number;
  offset?: number;
}

export interface SemanticSearchResultDto {
  property: PropertySummaryDto;
  relevanceScore: number;
  matchExplanation: {
    semanticMatch: boolean;
    localityMatch: boolean;
    priceMatch: boolean;
    amenityMatch: boolean;
    newListingBoost: boolean;
    explanationText: string;
  };
}

export interface RiskAssessmentDto {
  id: string;
  entityType: RiskEntityType;
  entityId: string;
  riskScore: number;
  riskLevel: RiskLevel;
  signals: {
    ruleName: string;
    description: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    scoreContribution: number;
  }[];
  decision: string;
  isResolved: boolean;
  resolvedBy?: string | null;
  resolvedAt?: string | null;
  resolutionNotes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContentModerationRecordDto {
  id: string;
  contentType: 'TEXT' | 'IMAGE';
  entityType: string;
  entityId: string;
  flag: ContentModerationFlag;
  confidence: number;
  reason: string;
  actionTaken: 'FLAGGED' | 'BLOCKED' | 'APPROVED' | 'REQUIRES_HUMAN_REVIEW';
  reviewerAction?: string | null;
  reviewerId?: string | null;
  reviewedAt?: string | null;
  modelVersion: string;
  createdAt: string;
}

export interface MarketplaceIntelligenceOverviewDto {
  overallDemandIndex: number;
  supplyDemandRatio: number;
  avgDaysToInquiry: number;
  avgDaysToBooking: number;
  searchToInquiryConversionRate: number;
  inquiryToBookingConversionRate: number;
  averageLandlordResponseRate: number;
  listingQualityScoreAverage: number;
  fraudAlertsCount: number;
  timestamp: string;
}

export interface LocalityIntelligenceDto {
  localityId: string;
  localityName: string;
  demandIndex: number;
  activeListingsCount: number;
  inquiryVolume30Days: number;
  medianRentPkr: number;
  supplyDemandRatio: number;
  growthTrendPercentage: number;
}

export interface FraudTrendDto {
  date: string;
  flaggedCount: number;
  resolvedCount: number;
  blockedCount: number;
  criticalRiskCount: number;
}

// ==========================================
// PHASE 20: COMMERCIALIZATION, MONETIZATION & CRM DTOS
// ==========================================

export interface LeadDto {
  id: string;
  fullName: string;
  email?: string | null;
  phoneNumber: string;
  normalizedPhone: string;
  leadType: 'LANDLORD' | 'TENANT' | 'AGENCY_HOSTEL';
  status:
    'NEW' | 'CONTACTED' | 'QUALIFIED' | 'NURTURE' | 'CONVERTED' | 'LOST' | 'INVALID' | 'DUPLICATE';
  source: string;
  localityId?: string | null;
  localityName?: string | null;
  propertyCount?: number | null;
  assignedToId?: string | null;
  assignedToName?: string | null;
  campaignId?: string | null;
  campaignName?: string | null;
  notesSummary?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLeadDto {
  fullName: string;
  email?: string;
  phoneNumber: string;
  leadType?: 'LANDLORD' | 'TENANT' | 'AGENCY_HOSTEL';
  source?: string;
  localityId?: string;
  propertyCount?: number;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  notes?: string;
}

export interface CampaignDto {
  id: string;
  name: string;
  slug: string;
  channel: string;
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ARCHIVED';
  budgetPkr?: number | null;
  spentPkr?: number | null;
  targetAudience?: string | null;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  startDate?: string | null;
  endDate?: string | null;
  impressions?: number;
  clicks?: number;
  conversions?: number;
  leadsCount?: number;
  createdAt: string;
}

export interface PromotionDto {
  id: string;
  name: string;
  slug: string;
  type:
    | 'FEATURED_LISTING'
    | 'TOP_SEARCH_PLACEMENT'
    | 'LOCALITY_SPONSORSHIP'
    | 'VERIFIED_LANDLORD_BADGE'
    | 'LEAD_BOOST'
    | 'DISCOUNT';
  pricePkr: number;
  durationDays: number;
  status: 'DRAFT' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  activeCount: number;
  eligibleCategory?: string | null;
  inventoryLimit?: number | null;
  createdAt: string;
}

export interface SubscriptionPlanDto {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  priceMonthlyPkr: number;
  priceQuarterlyPkr: number;
  priceYearlyPkr: number;
  maxActiveListings: number;
  features: string[];
  isPublic: boolean;
}

export interface SubscriptionDto {
  id: string;
  userId: string;
  planId: string;
  planName: string;
  status: 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'EXPIRED';
  billingCycle: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  currentPeriodStartsAt: string;
  currentPeriodEndsAt: string;
  cancelledAt?: string | null;
}

export interface InvoiceDto {
  id: string;
  invoiceNumber: string;
  userId: string;
  amountPkr: number;
  taxPkr: number;
  totalPkr: number;
  status: 'DRAFT' | 'ISSUED' | 'PAID' | 'VOID' | 'REFUNDED';
  dueDate: string;
  paidAt?: string | null;
  itemDescription: string;
  paymentMethod?: string | null;
  createdAt: string;
}

export interface CommercialOverviewDto {
  mrrPkr: number;
  arrPkr: number;
  totalRevenuePkr: number;
  totalActiveSubscribers: number;
  totalActiveLeads: number;
  leadConversionRate: number;
  activePromotionsCount: number;
  totalInvoicesPaid: number;
  recentTransactionsCount: number;
  localityRevenueBreakdown: { localityName: string; revenuePkr: number }[];
}

export interface SloMetricDto {
  id: string;
  name: string;
  category: 'AVAILABILITY' | 'LATENCY' | 'DATA_INTEGRITY' | 'OPERATIONS';
  target: number;
  unit: '%' | 'ms' | 's' | 'hours';
  currentValue: number;
  status: SloStatus;
  budgetTotalAllowed: number;
  budgetConsumedPercent: number;
  burnRate1h: number;
  burnRate24h: number;
}

export interface ErrorBudgetSummaryDto {
  cumulativeConsumptionPercent: number;
  tier: ErrorBudgetTier;
  isFeatureFreezeActive: boolean;
  activeFreezeReason?: string;
  evaluationWindowDays: number;
  slosBreachedCount: number;
  slosDegradedCount: number;
  totalSlosMonitored: number;
  lastUpdated: string;
}

export interface ReliabilityOverviewDto {
  summary: ErrorBudgetSummaryDto;
  slos: SloMetricDto[];
  recentIncidents: {
    id: string;
    severity: 'SEV-1' | 'SEV-2' | 'SEV-3';
    title: string;
    startedAt: string;
    resolvedAt?: string;
    status: 'ACTIVE' | 'RESOLVED';
  }[];
}

export interface SubmitFeedbackDto {
  rating: number;
  category: FeedbackCategory;
  comment: string;
  persona: 'TENANT' | 'LANDLORD' | 'AGENT';
  pageUrl?: string;
  locality?: string;
  metadata?: Record<string, any>;
}

export interface FeedbackItemDto {
  id: string;
  userId?: string;
  persona: 'TENANT' | 'LANDLORD' | 'AGENT';
  rating: number;
  category: FeedbackCategory;
  comment: string;
  pageUrl?: string;
  locality?: string;
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  createdAt: string;
  requiresFollowUp: boolean;
}

export interface FeedbackSummaryDto {
  totalCount: number;
  averageRating: number;
  npsScore: number;
  categoryCounts: Record<FeedbackCategory, number>;
  sentimentCounts: {
    positive: number;
    neutral: number;
    negative: number;
  };
  recentFeedback: FeedbackItemDto[];
}

export interface ExperimentVariantDto {
  key: string;
  weight: number;
  payload?: Record<string, any>;
}

export interface ExperimentDto {
  key: string;
  name: string;
  description: string;
  status: ExperimentStatus;
  targetRoles: ('TENANT' | 'LANDLORD' | 'ADMIN')[];
  targetLocalities?: string[];
  percentage: number;
  variants: ExperimentVariantDto[];
  killSwitchTriggered: boolean;
  guardrails: {
    enforceEligibilitySegregation: boolean;
    enforceGeofence: boolean;
    enforceModeration: boolean;
    enforcePiiProtection: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface EvaluateExperimentDto {
  userId?: string;
  role?: 'TENANT' | 'LANDLORD' | 'ADMIN';
  locality?: string;
  platform?: 'web' | 'mobile_android' | 'mobile_ios';
  appVersion?: string;
}
