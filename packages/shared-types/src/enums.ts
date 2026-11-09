/**
 * System User Roles for Peshawar Rental Marketplace
 */
export enum UserRole {
  TENANT = 'TENANT',
  LANDLORD = 'LANDLORD',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
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
