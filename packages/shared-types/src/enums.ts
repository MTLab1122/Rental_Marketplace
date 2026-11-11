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
