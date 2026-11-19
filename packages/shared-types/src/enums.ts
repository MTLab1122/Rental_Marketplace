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
