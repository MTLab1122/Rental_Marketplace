# Product Decision Records (PDR)

This document formalizes the fundamental technical and product architectural decisions governing the **Rental Marketplace Peshawar** platform.

---

## Decision 1: Why PostGIS is Used for Geospatial Validation

### Context

Peshawar has distinct metropolitan limits, cantonment board areas, adjacent tribal district borders (Khyber Agency), and surrounding rural boundaries. Standard latitude/longitude bounding-box checks (e.g. `min_lat < lat < max_lat`) suffer from severe inaccuracies when dealing with irregular geometric boundaries, leading to out-of-district listings or false rejections.

### Decision

Utilize PostgreSQL with the native **PostGIS** extension (`postgis/postgis:16-3.4`).

### Rationale & Trade-offs

- **High-Precision Geofencing**: PostGIS provides native spatial functions (`ST_Contains`, `ST_Within`, `ST_DistanceSphere`, `ST_SetSRID`) evaluated against arbitrary polygon boundaries.
- **R-Tree / GIST Spatial Indexing**: Enables sub-millisecond proximity queries and radial searches (`WHERE ST_DWithin(...)`) across tens of thousands of listings.
- **Data Integrity**: Prevents fraudulent or out-of-service listings from ever entering the database.

---

## Decision 2: Why Eligibility is Enforced at Both API and Database Levels

### Context

In Peshawar's cultural and academic rental ecosystem, student hostels/rooms and family households are strictly segregated. Cross-listing causes immediate customer dissatisfaction, harassment risks, community conflict, and platform abandonment.

### Decision

Enforce property eligibility (`STUDENTS_ONLY` vs `FAMILIES_ONLY`) as a non-negotiable invariant enforced at **all three layers**:

1. **Database Layer**: Strict PostgreSQL `ENUM` column (`NOT NULL`), composite index on `(eligibility, status, isAvailable)`.
2. **Backend API Layer**: Repository-level query filtering and JWT role validation so that a student token physically cannot query family listings even if they manipulate query strings.
3. **UI / Presentation Layer**: Completely segregated portal views and badge styling.

### Rationale & Trade-offs

- Client-side filtering alone is vulnerable to tampering, API scrapers, and accidental frontend state leakage.
- Database-level composite indexes ensure the PostgreSQL query planner never even evaluates or scans rows belonging to the opposing eligibility class.

---

## Decision 3: Why Admin Approval is Required Before Public Visibility

### Context

Emerging rental platforms in developing markets face massive issues with fake listings, phantom landlords, bait-and-switch scams, and duplicate broker postings.

### Decision

Implement a mandatory moderation state machine: `DRAFT -> PENDING_REVIEW -> APPROVED`. A listing can never appear in public search results without explicit verification by an admin or city moderator.

### Rationale & Trade-offs

- **Trust Guarantee**: Tenants in Peshawar can trust that every listed property actually exists, is located within the verified locality, and has verified landlord contact information.
- **Controlled Growth**: Although it introduces a small operational moderation overhead, quality and retention drastically outweigh unverified listing volume.

---

## Decision 4: Why Soft Deletion is Used for Properties

### Context

In a rental marketplace, historical records are vital: previous tenancy agreements, rent payment receipts, security deposit dispute audits, communication histories, and safety complaints often reference properties that are no longer actively on the market.

### Decision

Use soft deletion via a `deletedAt TIMESTAMP WITH TIME ZONE NULL` column. Hard `DELETE` operations are strictly prohibited in the public and landlord APIs.

### Rationale & Trade-offs

- **Auditability & Legal Protection**: Preserves referential integrity for inquiries, lease logs, and financial records without foreign-key cascade destruction.
- **Reactivation Ease**: Landlords whose properties temporarily leave the market can restore previous listings without re-entering complex spatial data and specifications.

---

## Decision 5: Why Cursor-Based Pagination is Used for Search

### Context

Real estate search interfaces rely heavily on infinite scrolling, real-time map updates, and rapid filtering. Traditional offset-based pagination (`OFFSET 200 LIMIT 20`) causes severe performance degradation on large tables (O(N) row scanning) and leads to the "skipped/duplicate item" problem when listings are created or deleted while a user is scrolling.

### Decision

Adopt cursor-based pagination using unique, sequentially orderable keys (e.g. `(createdAt, id)`).

### Rationale & Trade-offs

- **Consistent O(1) Performance**: PostgreSQL uses the B-Tree index to seek directly to the cursor key rather than scanning and discarding hundreds of preceding rows.
- **Stable UX**: New properties approved while a user browses do not cause items to shift between pages or duplicate on mobile feeds.
