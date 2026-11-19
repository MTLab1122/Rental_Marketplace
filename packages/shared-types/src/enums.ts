/**
 * System User Roles for Peshawar Rental Marketplace
 */
export enum UserRole {
  TENANT = 'TENANT',
  LANDLORD = 'LANDLORD',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
  MODERATOR = 'MODERATOR',
  SUPPORT = 'SUPPORT',
}

/**
 * Tenant Classification
 */
export enum TenantType {
  STUDENT = 'STUDENT',
  FAMILY = 'FAMILY',
}

/**
 * Non-negotiable Property Eligibility
 * Every property has strictly ONE eligibility rule.
 */
export enum PropertyEligibility {
  STUDENTS_ONLY = 'STUDENTS_ONLY',
  FAMILIES_ONLY = 'FAMILIES_ONLY',
}

/**
 * Property Types
 * Categorized strictly by eligibility constraints.
 */
export enum PropertyType {
  // Common & Student-compatible
  SINGLE_ROOM = 'SINGLE_ROOM',
  SHARED_ROOM = 'SHARED_ROOM',
  HOSTEL = 'HOSTEL',
  PORTION = 'PORTION',
  APARTMENT = 'APARTMENT',
  // Family-compatible
  HOUSE = 'HOUSE',
  RESIDENTIAL_UNIT = 'RESIDENTIAL_UNIT',
}

export const STUDENT_PROPERTY_TYPES = [
  PropertyType.SINGLE_ROOM,
  PropertyType.SHARED_ROOM,
  PropertyType.HOSTEL,
  PropertyType.PORTION,
  PropertyType.APARTMENT,
] as const;

export const FAMILY_PROPERTY_TYPES = [
  PropertyType.HOUSE,
  PropertyType.PORTION,
  PropertyType.APARTMENT,
  PropertyType.RESIDENTIAL_UNIT,
] as const;

/**
 * Property Lifecycle Statuses
 */
export enum PropertyStatus {
  DRAFT = 'DRAFT',
  PENDING_REVIEW = 'PENDING_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SUSPENDED = 'SUSPENDED',
  RENTED = 'RENTED',
  UNAVAILABLE = 'UNAVAILABLE',
  DELETED = 'DELETED',
}

/**
 * Identity & Document Verification Statuses
 */
export enum VerificationStatus {
  UNVERIFIED = 'UNVERIFIED',
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

/**
 * Tenant Inquiry Lifecycle Statuses
 */
export enum InquiryStatus {
  SUBMITTED = 'SUBMITTED',
  SEEN = 'SEEN',
  REPLIED = 'REPLIED',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  CLOSED = 'CLOSED',
}

/**
 * Platform Report Statuses
 */
export enum ReportStatus {
  OPEN = 'OPEN',
  IN_REVIEW = 'IN_REVIEW',
  RESOLVED = 'RESOLVED',
  DISMISSED = 'DISMISSED',
}

/**
 * Report Reasons
 */
export enum ReportReason {
  FAKE_LISTING = 'FAKE_LISTING',
  WRONG_LOCATION = 'WRONG_LOCATION',
  MISLEADING_INFORMATION = 'MISLEADING_INFORMATION',
  DISCRIMINATION = 'DISCRIMINATION',
  HARASSMENT = 'HARASSMENT',
  DUPLICATE_LISTING = 'DUPLICATE_LISTING',
  UNSAFE_PROPERTY = 'UNSAFE_PROPERTY',
  OTHER = 'OTHER',
}

/**
 * Image Moderation Statuses
 */
export enum ImageModerationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

/**
 * Analytics View Event Sources
 */
export enum ViewSource {
  MOBILE = 'MOBILE',
  WEB = 'WEB',
  ADMIN_REFERRAL = 'ADMIN_REFERRAL',
}

/**
 * Notification Types
 */
export enum NotificationType {
  INQUIRY_RECEIVED = 'INQUIRY_RECEIVED',
  INQUIRY_REPLIED = 'INQUIRY_REPLIED',
  LISTING_APPROVED = 'LISTING_APPROVED',
  LISTING_REJECTED = 'LISTING_REJECTED',
  LISTING_SUSPENDED = 'LISTING_SUSPENDED',
  MESSAGE_RECEIVED = 'MESSAGE_RECEIVED',
  SYSTEM = 'SYSTEM',
  NEW_LISTING_ALERT = 'NEW_LISTING_ALERT',
  BOOKING_STATUS_CHANGED = 'BOOKING_STATUS_CHANGED',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  AGREEMENT_READY = 'AGREEMENT_READY',
  DISPUTE_OPENED = 'DISPUTE_OPENED',
}

/**
 * Verified Initial Localities in Peshawar, KP, Pakistan
 */
export enum PeshawarLocalityName {
  UNIVERSITY_TOWN = 'University Town',
  HAYATABAD = 'Hayatabad',
  UNIVERSITY_ROAD = 'University Road',
  SADDAR = 'Saddar',
  GULBAHAR = 'Gulbahar',
  TEHKAL = 'Tehkal',
  BOARD_BAZAAR = 'Board Bazaar',
  WARSAK_ROAD = 'Warsak Road',
  RING_ROAD = 'Ring Road',
  DALAZAK_ROAD = 'Dalazak Road',
  REGI_MODEL_TOWN = 'Regi Model Town',
  PESHAWAR_CANTT = 'Peshawar Cantt',
  DANISH_ABAD = 'Danish Abad',
  NASIR_BAGH_ROAD = 'Nasir Bagh Road',
  WAPDA_TOWN = 'WAPDA Town',
}

export const PESHAWAR_LOCALITIES = [
  PeshawarLocalityName.UNIVERSITY_TOWN,
  PeshawarLocalityName.HAYATABAD,
  PeshawarLocalityName.UNIVERSITY_ROAD,
  PeshawarLocalityName.SADDAR,
  PeshawarLocalityName.GULBAHAR,
  PeshawarLocalityName.TEHKAL,
  PeshawarLocalityName.BOARD_BAZAAR,
  PeshawarLocalityName.WARSAK_ROAD,
  PeshawarLocalityName.RING_ROAD,
  PeshawarLocalityName.DALAZAK_ROAD,
  PeshawarLocalityName.REGI_MODEL_TOWN,
  PeshawarLocalityName.PESHAWAR_CANTT,
  PeshawarLocalityName.DANISH_ABAD,
  PeshawarLocalityName.NASIR_BAGH_ROAD,
  PeshawarLocalityName.WAPDA_TOWN,
] as const;

/**
 * Granular Administrative Permissions
 */
export enum AdminPermission {
  MANAGE_USERS = 'MANAGE_USERS',
  MANAGE_LANDLORDS = 'MANAGE_LANDLORDS',
  MANAGE_PROPERTIES = 'MANAGE_PROPERTIES',
  MODERATE_LISTINGS = 'MODERATE_LISTINGS',
  REVIEW_REPORTS = 'REVIEW_REPORTS',
  MANAGE_LOCALITIES = 'MANAGE_LOCALITIES',
  MANAGE_NOTIFICATIONS = 'MANAGE_NOTIFICATIONS',
  VIEW_ANALYTICS = 'VIEW_ANALYTICS',
  MANAGE_SETTINGS = 'MANAGE_SETTINGS',
  MANAGE_ADMINS = 'MANAGE_ADMINS',
  VIEW_AUDIT_LOGS = 'VIEW_AUDIT_LOGS',
}

/**
 * Role to Default Permissions Mapping
 */
export const ROLE_PERMISSIONS: Record<UserRole, AdminPermission[]> = {
  [UserRole.SUPER_ADMIN]: Object.values(AdminPermission),
  [UserRole.ADMIN]: [
    AdminPermission.MANAGE_USERS,
    AdminPermission.MANAGE_LANDLORDS,
    AdminPermission.MANAGE_PROPERTIES,
    AdminPermission.MODERATE_LISTINGS,
    AdminPermission.REVIEW_REPORTS,
    AdminPermission.MANAGE_LOCALITIES,
    AdminPermission.MANAGE_NOTIFICATIONS,
    AdminPermission.VIEW_ANALYTICS,
    AdminPermission.VIEW_AUDIT_LOGS,
  ],
  [UserRole.MODERATOR]: [
    AdminPermission.MODERATE_LISTINGS,
    AdminPermission.REVIEW_REPORTS,
    AdminPermission.MANAGE_PROPERTIES,
    AdminPermission.VIEW_ANALYTICS,
  ],
  [UserRole.SUPPORT]: [
    AdminPermission.MANAGE_USERS,
    AdminPermission.MANAGE_LANDLORDS,
    AdminPermission.REVIEW_REPORTS,
    AdminPermission.MANAGE_NOTIFICATIONS,
  ],
  [UserRole.LANDLORD]: [],
  [UserRole.TENANT]: [],
};

/**
 * Support Ticket System Enums
 */
export enum TicketStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  WAITING_USER = 'WAITING_USER',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export enum TicketPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum TicketCategory {
  ACCOUNT = 'ACCOUNT',
  LISTING_ISSUE = 'LISTING_ISSUE',
  DISPUTE = 'DISPUTE',
  INQUIRY = 'INQUIRY',
  TECHNICAL = 'TECHNICAL',
  FEEDBACK = 'FEEDBACK',
}

/**
 * Growth & Referral Enums
 */
export enum ReferralType {
  STUDENT = 'STUDENT',
  FAMILY = 'FAMILY',
  LANDLORD = 'LANDLORD',
}

/**
 * Monetization & Promotion Enums
 */
export enum MonetizationFeature {
  FEATURED_LISTING = 'FEATURED_LISTING',
  VERIFIED_BADGE = 'VERIFIED_BADGE',
  PROMOTED_SEARCH = 'PROMOTED_SEARCH',
  LOCALITY_SPONSORSHIP = 'LOCALITY_SPONSORSHIP',
  HOSTEL_SAAS = 'HOSTEL_SAAS',
}

/**
 * Review, Reputation & Trust Enums
 */
export enum ReviewStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  HIDDEN = 'HIDDEN',
  REMOVED = 'REMOVED',
}

export enum ReviewReportReason {
  SPAM = 'SPAM',
  PROFANITY = 'PROFANITY',
  HARASSMENT = 'HARASSMENT',
  DEFAMATION = 'DEFAMATION',
  CONFLICT_OF_INTEREST = 'CONFLICT_OF_INTEREST',
  OTHER = 'OTHER',
}

export enum ReviewModerationAction {
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  HIDE = 'HIDE',
  RESTORE = 'RESTORE',
  REMOVE = 'REMOVE',
}

export enum TrustEventType {
  INQUIRY_ACCEPTED = 'INQUIRY_ACCEPTED',
  INQUIRY_REPLIED = 'INQUIRY_REPLIED',
  REVIEW_RECEIVED = 'REVIEW_RECEIVED',
  REVIEW_REPORTED = 'REVIEW_REPORTED',
  VERIFICATION_APPROVED = 'VERIFICATION_APPROVED',
  BADGE_GRANTED = 'BADGE_GRANTED',
  BADGE_REVOKED = 'BADGE_REVOKED',
  COMPLAINT_UPHELD = 'COMPLAINT_UPHELD',
}

export enum TrustBadge {
  VERIFIED_LANDLORD = 'VERIFIED_LANDLORD',
  FAST_RESPONDER = 'FAST_RESPONDER',
  HIGHLY_RATED = 'HIGHLY_RATED',
  TOP_LISTING = 'TOP_LISTING',
  NEW_LISTING = 'NEW_LISTING',
  PREMIUM_LISTING = 'PREMIUM_LISTING',
}

/**
 * Phase 12: Saved Searches, Alerts, Recommendations & Discovery Enums
 */
export enum AlertFrequency {
  INSTANT = 'INSTANT',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
}

export enum AlertDeliveryStatus {
  PENDING = 'PENDING',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  SKIPPED = 'SKIPPED',
}

export enum RecommendationReason {
  BECAUSE_YOU_VIEWED = 'because_you_viewed',
  SIMILAR_TO_FAVORITES = 'similar_to_favorites',
  POPULAR_IN_LOCALITY = 'popular_in_locality',
  NEW_IN_AREA = 'new_in_area',
  WITHIN_BUDGET = 'within_budget',
}

export enum RecommendationType {
  FOR_YOU = 'FOR_YOU',
  SIMILAR = 'SIMILAR',
  NEARBY = 'NEARBY',
  TRENDING = 'TRENDING',
}

/**
 * Phase 13: Booking, Payments, Agreements, Escrow & Disputes Enums
 */
export enum BookingStatus {
  REQUESTED = 'REQUESTED',
  LANDLORD_REVIEWING = 'LANDLORD_REVIEWING',
  AWAITING_PAYMENT = 'AWAITING_PAYMENT',
  PAYMENT_PENDING = 'PAYMENT_PENDING',
  CONFIRMED = 'CONFIRMED',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
  DISPUTED = 'DISPUTED',
  REFUNDED = 'REFUNDED',
}

export enum PaymentStatus {
  CREATED = 'CREATED',
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentMethodType {
  MANUAL_BANK_TRANSFER = 'MANUAL_BANK_TRANSFER',
  JAZZCASH = 'JAZZCASH',
  EASYPAISA = 'EASYPAISA',
  STRIPE = 'STRIPE',
}

export enum AgreementStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  SIGNED_BY_TENANT = 'SIGNED_BY_TENANT',
  SIGNED_BY_LANDLORD = 'SIGNED_BY_LANDLORD',
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  TERMINATED = 'TERMINATED',
}

export enum LedgerEntryType {
  DEPOSIT_HOLD = 'DEPOSIT_HOLD',
  DEPOSIT_RELEASE = 'DEPOSIT_RELEASE',
  RENT_CHARGE = 'RENT_CHARGE',
  RENT_PAYMENT = 'RENT_PAYMENT',
  REFUND = 'REFUND',
  PLATFORM_FEE = 'PLATFORM_FEE',
  ADJUSTMENT = 'ADJUSTMENT',
  DISPUTE_HOLD = 'DISPUTE_HOLD',
}

export enum DisputeCategory {
  PAYMENT_ISSUE = 'PAYMENT_ISSUE',
  PROPERTY_NOT_AS_DESCRIBED = 'PROPERTY_NOT_AS_DESCRIBED',
  DEPOSIT_ISSUE = 'DEPOSIT_ISSUE',
  EARLY_TERMINATION = 'EARLY_TERMINATION',
  SAFETY_ISSUE = 'SAFETY_ISSUE',
  OTHER = 'OTHER',
}

export enum DisputeStatus {
  OPEN = 'OPEN',
  UNDER_REVIEW = 'UNDER_REVIEW',
  RESOLVED = 'RESOLVED',
  REJECTED = 'REJECTED',
  ESCALATED = 'ESCALATED',
}

// ==========================================
// PHASE 14: EVENT-DRIVEN & BACKGROUND JOBS
// ==========================================

export enum DomainEventType {
  USER_REGISTERED = 'user_registered',
  USER_VERIFIED = 'user_verified',
  LANDLORD_VERIFIED = 'landlord_verified',
  PROPERTY_CREATED = 'property_created',
  PROPERTY_SUBMITTED = 'property_submitted',
  PROPERTY_APPROVED = 'property_approved',
  PROPERTY_REJECTED = 'property_rejected',
  PROPERTY_SUSPENDED = 'property_suspended',
  PROPERTY_MARKED_AVAILABLE = 'property_marked_available',
  PROPERTY_MARKED_RENTED = 'property_marked_rented',
  PROPERTY_VIEWED = 'property_viewed',
  PROPERTY_FAVORITED = 'property_favorited',
  INQUIRY_CREATED = 'inquiry_created',
  INQUIRY_REPLIED = 'inquiry_replied',
  MESSAGE_SENT = 'message_sent',
  REVIEW_CREATED = 'review_created',
  REVIEW_MODERATED = 'review_moderated',
  BOOKING_CREATED = 'booking_created',
  PAYMENT_SUCCEEDED = 'payment_succeeded',
  PAYMENT_FAILED = 'payment_failed',
  REFUND_CREATED = 'refund_created',
  DISPUTE_OPENED = 'dispute_opened',
  REPORT_CREATED = 'report_created',
  REPORT_RESOLVED = 'report_resolved',
}

export enum BackgroundJobName {
  SEND_NOTIFICATION = 'send_notification',
  SEND_EMAIL = 'send_email',
  RESIZE_IMAGE = 'resize_image',
  GENERATE_THUMBNAIL = 'generate_thumbnail',
  CALCULATE_REPUTATION = 'calculate_reputation',
  CALCULATE_PROPERTY_QUALITY = 'calculate_property_quality',
  CALCULATE_LOCALITY_DEMAND = 'calculate_locality_demand',
  EXPIRE_UNPAID_BOOKINGS = 'expire_unpaid_bookings',
  EXPIRE_VERIFICATION_REQUESTS = 'expire_verification_requests',
  REINDEX_SEARCH = 'reindex_search',
  CLEAN_EXPIRED_TOKENS = 'clean_expired_tokens',
  CLEAN_EXPIRED_SESSIONS = 'clean_expired_sessions',
  CLEAN_ORPHAN_MEDIA = 'clean_orphan_media',
  GENERATE_DAILY_ANALYTICS = 'generate_daily_analytics',
  GENERATE_WEEKLY_REPORTS = 'generate_weekly_reports',
  PROCESS_WEBHOOK_RETRIES = 'process_webhook_retries',
  PROCESS_DLQ = 'process_dlq',
}

// ==========================================
// PHASE 15: AI, FRAUD PREVENTION & INTELLIGENCE
// ==========================================

export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum RiskEntityType {
  USER = 'USER',
  LANDLORD = 'LANDLORD',
  PROPERTY = 'PROPERTY',
  INQUIRY = 'INQUIRY',
  MESSAGE = 'MESSAGE',
  REVIEW = 'REVIEW',
  BOOKING = 'BOOKING',
}

export enum AiSuggestionType {
  MISSING_INFO = 'MISSING_INFO',
  IMAGE_QUALITY = 'IMAGE_QUALITY',
  MISSING_AMENITIES = 'MISSING_AMENITIES',
  UNCLEAR_DESCRIPTION = 'UNCLEAR_DESCRIPTION',
  PRICE_OUTLIER = 'PRICE_OUTLIER',
  LOCATION_MISMATCH = 'LOCATION_MISMATCH',
  DUPLICATE_LISTING = 'DUPLICATE_LISTING',
  ELIGIBILITY_MISMATCH = 'ELIGIBILITY_MISMATCH',
}

export enum AiSuggestionStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  DISMISSED = 'DISMISSED',
}

export enum PriceContextIndicator {
  BELOW_MARKET = 'BELOW_MARKET',
  AROUND_MARKET = 'AROUND_MARKET',
  ABOVE_MARKET = 'ABOVE_MARKET',
}

export enum ContentModerationFlag {
  HATE_SPEECH = 'HATE_SPEECH',
  HARASSMENT = 'HARASSMENT',
  DISCRIMINATION = 'DISCRIMINATION',
  SEXUAL_CONTENT = 'SEXUAL_CONTENT',
  VIOLENCE = 'VIOLENCE',
  SCAM_LANGUAGE = 'SCAM_LANGUAGE',
  CONTACT_SCRAPING = 'CONTACT_SCRAPING',
  LOW_QUALITY_IMAGE = 'LOW_QUALITY_IMAGE',
  EXPLICIT_IMAGE = 'EXPLICIT_IMAGE',
  COPYRIGHT_RISK = 'COPYRIGHT_RISK',
}

export enum LeadStatus {
  NEW = 'NEW',
  CONTACTED = 'CONTACTED',
  QUALIFIED = 'QUALIFIED',
  NURTURE = 'NURTURE',
  CONVERTED = 'CONVERTED',
  LOST = 'LOST',
  INVALID = 'INVALID',
  DUPLICATE = 'DUPLICATE',
}

export enum LeadSource {
  ORGANIC_SEARCH = 'ORGANIC_SEARCH',
  DIRECT = 'DIRECT',
  REFERRAL = 'REFERRAL',
  GOOGLE_ADS = 'GOOGLE_ADS',
  META_ADS = 'META_ADS',
  TIKTOK_ADS = 'TIKTOK_ADS',
  WHATSAPP = 'WHATSAPP',
  FACEBOOK_GROUP = 'FACEBOOK_GROUP',
  UNIVERSITY_PARTNER = 'UNIVERSITY_PARTNER',
  LANDLORD_REFERRAL = 'LANDLORD_REFERRAL',
  OFFLINE = 'OFFLINE',
  OTHER = 'OTHER',
}

export enum LeadType {
  LANDLORD = 'LANDLORD',
  TENANT = 'TENANT',
  AGENCY_HOSTEL = 'AGENCY_HOSTEL',
}

export enum CampaignStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED',
}

export enum PromotionType {
  FEATURED_LISTING = 'FEATURED_LISTING',
  TOP_SEARCH_PLACEMENT = 'TOP_SEARCH_PLACEMENT',
  LOCALITY_SPONSORSHIP = 'LOCALITY_SPONSORSHIP',
  VERIFIED_LANDLORD_BADGE = 'VERIFIED_LANDLORD_BADGE',
  LEAD_BOOST = 'LEAD_BOOST',
  DISCOUNT = 'DISCOUNT',
}

export enum PromotionStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

export enum SubscriptionStatus {
  TRIALING = 'TRIALING',
  ACTIVE = 'ACTIVE',
  PAST_DUE = 'PAST_DUE',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export enum BillingCycle {
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY',
}

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  ISSUED = 'ISSUED',
  PAID = 'PAID',
  VOID = 'VOID',
  REFUNDED = 'REFUNDED',
}

export enum ReferralRewardStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
  CLAWED_BACK = 'CLAWED_BACK',
}

export enum PayoutStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export enum RevenueEventType {
  SUBSCRIPTION_CHARGE = 'SUBSCRIPTION_CHARGE',
  PROMOTION_CHARGE = 'PROMOTION_CHARGE',
  REFUND = 'REFUND',
  CREDIT = 'CREDIT',
  PLATFORM_FEE = 'PLATFORM_FEE',
  ADJUSTMENT = 'ADJUSTMENT',
}

export enum ErrorBudgetTier {
  GREEN = 'GREEN',
  AMBER = 'AMBER',
  ORANGE = 'ORANGE',
  RED = 'RED',
}

export enum SloStatus {
  HEALTHY = 'HEALTHY',
  DEGRADED = 'DEGRADED',
  BREACHED = 'BREACHED',
}

export enum FeedbackCategory {
  BUG = 'BUG',
  FEATURE_REQUEST = 'FEATURE_REQUEST',
  SEARCH_QUALITY = 'SEARCH_QUALITY',
  LANDLORD_ISSUE = 'LANDLORD_ISSUE',
  GENERAL = 'GENERAL',
}

export enum ExperimentStatus {
  DRAFT = 'DRAFT',
  RUNNING = 'RUNNING',
  PAUSED = 'PAUSED',
  HALTED_GUARDRAIL = 'HALTED_GUARDRAIL',
  CONCLUDED = 'CONCLUDED',
}
