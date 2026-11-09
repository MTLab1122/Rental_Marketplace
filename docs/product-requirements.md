# Product Requirements Document (PRD)

## 1. Product Mission & Vision

To establish the most trustworthy, secure, and friction-free rental marketplace in Pakistan, specifically tailored to the unique socio-cultural, educational, and spatial characteristics of **Peshawar, Khyber Pakhtunkhwa**.

---

## 2. Target Personas

### 2.1 Student Tenants

- Enrolled in University of Peshawar, Khyber Medical College (KMC), UET Peshawar, Islamia College, Agriculture University, or IMSciences.
- Primary need: Affordable, verified, and secure rooms, shared apartments, or hostels with strict student eligibility.
- Cultural safety: Complete privacy and segregation from family residential wings.

### 2.2 Family Tenants

- Families seeking houses, portions, or family apartments across residential townships like Hayatabad, Peshawar Cantt, Regi Model Town, and Warsak Road.
- Primary need: Peace, community safety, vetted neighbors, clear legal terms, and family-only complexes without student hostel traffic.

### 2.3 Landlords & Property Managers

- Property owners seeking verified tenants, timely rent collection, and fraud-free listing moderation.
- Must designate each property strictly as either `STUDENTS_ONLY` or `FAMILIES_ONLY` during initial creation.

### 2.4 Administrative Moderators & City Verifiers

- Municipal and platform administrators who verify property ownership, physical location within Peshawar, and approve listings before public availability.

---

## 3. Non-Negotiable Business Rules

1. **Strict Single Eligibility**: Every property is strictly designated as either `STUDENTS_ONLY` or `FAMILIES_ONLY`. Dual eligibility is prohibited.
2. **Segregated Discovery**:
   - Student tenants discover and inquire only about `STUDENTS_ONLY` properties.
   - Family tenants discover and inquire only about `FAMILIES_ONLY` properties.
   - Cross-visibility is blocked at API, database, and UI layers.
3. **Peshawar Spatial Boundary Fence**: Every property must fall inside the official Peshawar municipal polygon boundary.
4. **Locality Association**: Every listing must belong to an active, verified Peshawar locality.
5. **Mandatory Admin Approval**: Public search displays only properties with status `APPROVED` and `isAvailable: true`.
6. **Zero Ghost Listings**: Properties in states `DRAFT`, `PENDING_REVIEW`, `REJECTED`, `SUSPENDED`, `RENTED`, `UNAVAILABLE`, or `DELETED` are strictly excluded from public tenant searches.
7. **Soft Deletion**: Properties and user accounts are never hard-deleted; `deletedAt` timestamps preserve historical lease agreements, inquiries, and audit records.

---

## 4. Initial Verified Peshawar Localities (15 Localities)

1. **University Town**: Primary educational and residential zone near UoP and KMC.
2. **Hayatabad**: Premier planned township (Phases 1 through 7).
3. **University Road**: Commercial and transit corridor with dense student accommodations.
4. **Saddar**: Historic central commercial and cantonment residential sector.
5. **Gulbahar**: Established family neighborhood near GT Road.
6. **Tehkal**: High-density affordable neighborhood adjoining University Road.
7. **Board Bazaar**: Jamrud Road commercial hub near BISE Peshawar.
8. **Warsak Road**: Northern residential sector with housing colonies.
9. **Ring Road**: Rapid transit bypass with developing residential complexes.
10. **Dalazak Road**: Budget-friendly family housing sector.
11. **Regi Model Town**: Ultra-modern planned municipal township.
12. **Peshawar Cantt**: Cantonment residential zone.
13. **Danish Abad**: University-adjacent residential pocket.
14. **Nasir Bagh Road**: Gated developments corridor connecting to Regi.
15. **WAPDA Town**: Gated residential cooperative society.
