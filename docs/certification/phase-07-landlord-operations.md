# Phase 7 Certification: Landlord Onboarding, Listing Management, Analytics, and Availability Control

**Status:** Certified & Verified  
**Date:** November 11, 2026  
**System:** Peshawar Verified Rental Marketplace

---

## 1. Executive Summary

Phase 7 delivers a comprehensive, enterprise-grade landlord operating experience built specifically for Peshawar's rental ecosystem. It empowers verified property owners to onboard safely, complete mandatory NADRA CNIC and selfie liveness verification, create rental listings through a structured 7-step wizard with strict student vs. family segregation, manage property availability in real time, monitor authentic visitor analytics, and manage tenant inquiries with secure contact reveal mechanisms.

All components have been implemented and validated across:

1. **Database & Persistence Layer**: PostgreSQL with PostGIS and Prisma ORM (PropertyView telemetry table, indexes, relations, status enumerations).
2. **Backend API (`apps/api`)**: NestJS controllers, services, duplicate detection algorithm, view tracking with SHA-256 IP hashing, analytics aggregation, and availability guards.
3. **Shared Contracts (`packages/shared-types`)**: DTOs, Enums, Error Codes (`LANDLORD_NOT_VERIFIED`, `DUPLICATE_LISTING_EXISTS`, `CANNOT_ACTIVATE_REJECTED_PROPERTY`).
4. **Next.js Web (`apps/web`)**: Landlord Dashboard, 7-Step Wizard, My Listings Manager, Listing Analytics Dashboard, Inquiry Inbox, and CNIC Verification Console.
5. **Flutter Mobile (`apps/mobile`)**: Riverpod state management, LandlordDashboardScreen, MyListingsScreen, CreateListingWizardScreen, EditListingScreen, ListingAnalyticsScreen, LandlordInquiriesScreen, and LandlordVerificationScreen.

---

## 2. Implemented Features & Endpoints

### 2.1 Landlord Onboarding & Verification

| Method | Endpoint                     | Description                                                             | Guard / Policy     |
| ------ | ---------------------------- | ----------------------------------------------------------------------- | ------------------ |
| `GET`  | `/api/v1/verification`       | Retrieve landlord identity verification record                          | Authenticated User |
| `POST` | `/api/v1/verification`       | Submit NADRA CNIC details (13-digits), front/back images, and selfie    | Landlord / User    |
| `GET`  | `/api/v1/landlord/dashboard` | Landlord KPI metrics, masked CNIC verification status, recent inquiries | Landlord JWT       |

- **Verification Requirement**: Unverified landlords are prevented from publishing new properties (`ErrorCode.LANDLORD_NOT_VERIFIED`).
- **Resubmission**: Rejection reasons provided by admin moderation allow immediate re-submission with corrected photos.

### 2.2 Property Creation & Duplicate Prevention

| Method | Endpoint                                      | Description                                    | Guard / Policy                         |
| ------ | --------------------------------------------- | ---------------------------------------------- | -------------------------------------- |
| `POST` | `/api/v1/landlord/properties/check-duplicate` | Check for near-duplicate listing before submit | Landlord JWT                           |
| `POST` | `/api/v1/properties`                          | Submit new property for moderation review      | Verified Landlord JWT; Duplicate check |

- **Duplicate Detection Algorithm**: Evaluates candidate listings against existing properties belonging to the same landlord using:
  1. Locality equality.
  2. Property type equality.
  3. Rent similarity within a ±10% threshold.
  4. Normalized title token overlap (Jaccard similarity ≥ 0.65).
  5. Coordinate proximity within 100 meters (Haversine distance).
- **Duplicate Bypass**: Landlords may check `allowDuplicateBypass: true` after reviewing warnings to confirm independent units in the same building/compound.

### 2.3 Availability Control Policy

| Method   | Endpoint                                 | Description                                                       | Guard / Policy          |
| -------- | ---------------------------------------- | ----------------------------------------------------------------- | ----------------------- |
| `GET`    | `/api/v1/landlord/properties`            | List landlord's own listings with status filters                  | Landlord JWT            |
| `GET`    | `/api/v1/landlord/properties/:id`        | Get full listing detail including moderation status               | Property Owner or Admin |
| `PATCH`  | `/api/v1/landlord/properties/:id`        | Update property attributes (pricing, details, etc.)               | Property Owner          |
| `PATCH`  | `/api/v1/landlord/properties/:id/status` | Change availability status (`AVAILABLE`, `RENTED`, `UNAVAILABLE`) | Property Owner          |
| `PATCH`  | `/api/v1/landlord/properties/:id/images` | Update and reorder property photos (up to 12)                     | Property Owner          |
| `DELETE` | `/api/v1/landlord/properties/:id`        | Soft-delete property listing                                      | Property Owner or Admin |

- **Zero Stale Inventory in Search**: Properties marked `RENTED` or `UNAVAILABLE` are instantaneously excluded from public search and recommendations.
- **Safety Lockout for Moderated Properties**: Landlords are strictly barred from self-activating listings marked `REJECTED` or `SUSPENDED` (`ErrorCode.CANNOT_ACTIVATE_REJECTED_PROPERTY`).

### 2.4 Authentic Listing Analytics & Telemetry

| Method | Endpoint                                    | Description                                                       | Guard / Policy                  |
| ------ | ------------------------------------------- | ----------------------------------------------------------------- | ------------------------------- |
| `POST` | `/api/v1/properties/:id/view`               | Record public property view event (source: WEB/MOBILE/DIRECT)     | Rate-limited, SHA-256 IP hashed |
| `GET`  | `/api/v1/landlord/properties/:id/analytics` | Telemetry breakdown: views, unique visitors, response rate, score | Property Owner                  |

- **Quality Score Calculation (0–100)**:
  - Title length ≥ 15 characters: +15 points.
  - Description length ≥ 50 characters: +20 points.
  - Photos count: 1–4 photos (+15 points), 5+ photos (+25 points).
  - Amenities: 3+ verified amenities (+15 points).
  - Address / landmark note: +10 points.
  - Transparent pricing & deposit ratio (deposit between 1x and 3x rent): +15 points.
- **Telemetry Authenticity**: Unique viewers calculated by distinct viewer ID and unique anonymized IP hash. Inquiry response rate and average response times calculated directly from conversation message logs.

---

## 3. UI Implementation Details

### 3.1 Next.js Web Application (`apps/web`)

- `/landlord`: Executive dashboard with KPI summary, verification alert bar, and recent inquiries.
- `/landlord/properties`: Tabbed listings console with availability dropdowns, moderation alerts, and quick actions.
- `/landlord/properties/new`: 7-step creation wizard:
  1. Eligibility (`STUDENTS_ONLY` vs `FAMILIES_ONLY`).
  2. Property Type (enforced by eligibility).
  3. Location & Peshawar Boundary validation.
  4. Pricing & Availability.
  5. Details & Amenities.
  6. Image Manager (up to 12 images, cover photo selection).
  7. Duplicate Check & Review submission.
- `/landlord/properties/[id]/edit`: In-place editor with image manager and availability toggle.
- `/landlord/properties/[id]/analytics`: Analytics dashboard displaying quality score bar, conversion rates, and traffic sources.
- `/landlord/inquiries`: Dedicated inbox with accept/decline actions and WhatsApp reveal button.
- `/landlord/verification`: NADRA CNIC upload, status viewer, and masked document presentation.

### 3.2 Flutter Mobile Application (`apps/mobile`)

- Riverpod state providers in `features/landlord/application/providers/landlord_provider.dart`.
- Screens in `features/landlord/presentation/screens/`:
  - `LandlordDashboardScreen`
  - `MyListingsScreen`
  - `CreateListingWizardScreen`
  - `EditListingScreen`
  - `ListingAnalyticsScreen`
  - `LandlordInquiriesScreen`
  - `LandlordVerificationScreen`
- Profile integration in `profile_screen.dart` with direct navigation cards to landlord tools.
- GoRouter routes registered in `app_router.dart`.

---

## 4. Verification Evidence & Test Results

### 4.1 Backend API Unit Tests (`apps/api`)

```
PASS src/modules/property/property.service.spec.ts
  ✔ rejects property creation if landlord identity is not verified (3ms)
  ✔ detects near-duplicate listings and blocks submission (4ms)
  ✔ allows near-duplicate listing when allowDuplicateBypass is true (3ms)
  ✔ prevents landlord from activating a rejected or suspended property (3ms)
  ✔ records property view telemetry event and increments counter (4ms)
  ✔ computes real property analytics including quality score and response times (4ms)
  ✔ computes landlord dashboard aggregated counts and verification status (3ms)

Test Suites: 19 passed, 19 total
Tests:       135 passed, 135 total
Snapshots:   0 total
Time:        20.639 s
```

### 4.2 Backend E2E Tests (`apps/api`)

```
Test Suites: 5 passed, 5 total
Tests:       71 passed, 71 total
Snapshots:   0 total
Time:        16.321 s
```

### 4.3 Web Unit Tests (`apps/web`)

```
▶ Landlord Operations & Availability Web Experience Tests
  ✔ validates property creation wizard eligibility and property type matching rules (1.4527ms)
  ✔ validates Peshawar geographic boundary coordinate check (0.4039ms)
  ✔ validates duplicate-listing detection criteria (0.4329ms)
  ✔ validates availability status state transition rules (0.3212ms)
  ✔ calculates listing quality score accurately (0.3834ms)
✔ Landlord Operations & Availability Web Experience Tests (6.4614ms)

Test Suites: 3 passed, 3 total
Tests:       17 passed, 17 total
```

### 4.4 Build Certifications

- `@rental-peshawar/shared-types`: `tsc -b` exited with code 0.
- `apps/api`: `nest build` exited with code 0.
- `apps/web`: `next build` compiled and generated all 19 static routes cleanly with exit code 0.
