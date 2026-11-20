# Launch-Blocking Issue Register & Resolution Record

## 1. Executive Summary & Governance

This document establishes the single authoritative **Launch-Blocking Issue Register** for **Rental Peshawar** (v1.0.0-GA).

All issues, defects, audit findings, and operational alerts collected across **Phases 1 through 25**, including user feedback, penetration tests, reliability benchmarks, and technical debt registers, have been consolidated, evaluated against launch criteria, and resolved.

### Severity Definitions & SLA Thresholds

- **BLOCKER**: Critical defects threatening security, data integrity, tenant eligibility segregation, legal compliance, or system availability. **Must be 100% resolved and regression-tested before production launch approval.**
- **HIGH**: Major operational or UX degradation without direct risk of data loss or breach. **Must be resolved within 7 calendar days post-launch.**
- **MEDIUM**: Secondary defects, performance tuning, or non-critical edge cases. **Must be resolved within 30 calendar days.**
- **LOW**: Minor cosmetic anomalies, developer ergonomics, or minor backlog improvements. **Scheduled in normal product roadmap.**

---

## 2. Consolidated Issue Register

| Issue ID        | Source Phase |  Severity   | Category     | Description                                                  | Root Cause                                        | Affected Systems          | Required Fix                                                                                  | Verification Test                                            |    Status     |      Launch Decision      |
| :-------------- | :----------: | :---------: | :----------- | :----------------------------------------------------------- | :------------------------------------------------ | :------------------------ | :-------------------------------------------------------------------------------------------- | :----------------------------------------------------------- | :-----------: | :-----------------------: |
| **ISS-BLK-001** |   Phase 23   | **BLOCKER** | Compliance   | Unapproved/draft listings appearing in public search feed    | Missing status filter in search query parser      | `apps/api` (Discovery)    | Enforce `status: APPROVED` and `isAvailable: true` at database repository layer               | `discovery.service.spec.ts`                                  |  **CLOSED**   |  **RESOLVED & VERIFIED**  |
| **ISS-BLK-002** |   Phase 23   | **BLOCKER** | Security     | Cross-tenant inquiry leakage (IDOR risk on private threads)  | Inadequate actor ownership validation             | `apps/api` (Inquiry)      | Inject strict `OwnershipGuard` verifying `tenantId === actor.id` or `landlordId === actor.id` | `inquiry.service.spec.ts`                                    |  **CLOSED**   |  **RESOLVED & VERIFIED**  |
| **ISS-BLK-003** |   Phase 24   | **BLOCKER** | Security     | Horizontal IDOR on property modification by rival landlords  | Missing landlord ID match in update handler       | `apps/api` (Property)     | Enforce `landlordId === user.id` in `property.service.ts` before mutation                     | `property.service.spec.ts`                                   |  **CLOSED**   |  **RESOLVED & VERIFIED**  |
| **ISS-BLK-004** |   Phase 24   | **BLOCKER** | Security     | Vertical privilege escalation to `SUPER_ADMIN` via admin API | Unchecked role assignment parameter               | `apps/api` (Admin)        | Require explicit `SUPER_ADMIN` token claim for any administrative role grants                 | `security-hardening.spec.ts`                                 |  **CLOSED**   |  **RESOLVED & VERIFIED**  |
| **ISS-BLK-005** |   Phase 24   | **BLOCKER** | Security     | Refresh token replay vulnerability                           | Token family not revoked upon multi-use           | `apps/api` (Auth)         | Implement family revocation pattern revoking all child tokens on reuse                        | `token.service.spec.ts`                                      |  **CLOSED**   |  **RESOLVED & VERIFIED**  |
| **ISS-BLK-006** |   Phase 24   | **BLOCKER** | Reliability  | Cascading failure during external payment gateway timeouts   | Missing circuit breaker pattern on HTTP client    | `apps/api` (Payment)      | Deploy `CircuitBreakerService` opening after 5 consecutive timeouts                           | `reliability.service.spec.ts`                                |  **CLOSED**   |  **RESOLVED & VERIFIED**  |
| **ISS-BLK-007** |   Phase 25   | **BLOCKER** | Growth / SEO | Deleted/Rented properties indexed in XML sitemap             | Sitemap generator lacked availability filters     | `apps/api` (Growth)       | Filter sitemap queries to `status: APPROVED` and `isAvailable: true`                          | `phase-25-growth-scale-certification.spec.ts`                |  **CLOSED**   |  **RESOLVED & VERIFIED**  |
| **ISS-BLK-008** |   Phase 25   | **BLOCKER** | Monetization | Free Starter tier allowed unlimited listing publication      | Quota verification bypassed in bulk upload        | `apps/api` (Monetization) | Hard quota check enforcing maximum 2 active listings on Free tier                             | `monetization.service.spec.ts`                               |  **CLOSED**   |  **RESOLVED & VERIFIED**  |
| **ISS-BLK-009** |   Phase 25   | **BLOCKER** | Scale / GIS  | Non-Peshawar properties created via spoofed coordinates      | Coordinates not checked against polygon perimeter | `apps/api` (Property)     | Implement ray-casting algorithm validating against municipal boundary                         | `peshawar_boundary_test.dart` & `property.validator.spec.ts` |  **CLOSED**   |  **RESOLVED & VERIFIED**  |
| **ISS-BLK-010** |   Phase 25   | **BLOCKER** | Commercial   | Referral code self-claim exploit allowed infinite credits    | Missing self-referral actor check                 | `apps/api` (Growth)       | Block claims where `actorId === referralOwnerId` or prior claim exists                        | `growth.service.spec.ts`                                     |  **CLOSED**   |  **RESOLVED & VERIFIED**  |
| **ISS-HGH-001** |   Phase 24   |  **HIGH**   | Performance  | Sharp image processing executes inside main web event loop   | Heavy synchronous image resizing                  | `apps/api` (Media)        | Offload Sharp WebP conversion to dedicated background worker queue                            | `media.service.spec.ts`                                      | **SCHEDULED** | Non-blocking (7-day SLA)  |
| **ISS-HGH-002** |   Phase 24   |  **HIGH**   | Reliability  | Dual Redis instance separation (Cache vs Queue)              | Shared Redis instance for cache and BullMQ        | `infrastructure`          | Split into dedicated Redis-Cache (`volatile-lru`) and Redis-Queue (`noeviction`)              | Ops runbook                                                  | **SCHEDULED** | Non-blocking (7-day SLA)  |
| **ISS-MED-001** |   Phase 25   | **MEDIUM**  | Performance  | PostGIS spatial index clustering on high-density sectors     | Unclustered GiST index on location column         | `database`                | Schedule weekly `CLUSTER properties USING idx_location_gist`                                  | DBA runbook                                                  | **SCHEDULED** | Non-blocking (30-day SLA) |
| **ISS-MED-002** |   Phase 25   | **MEDIUM**  | Frontend     | Admin table fetches full verification payloads eagerly       | Eager nested joins in admin API                   | `apps/admin`              | Paginate admin tables and lazy-load CNIC photos in drawer modals                              | Admin E2E                                                    | **SCHEDULED** | Non-blocking (30-day SLA) |
| **ISS-LOW-001** |   Phase 24   |   **LOW**   | UX           | iOS Safari low-power mode WebSocket heartbeat throttling     | Background tab timer throttling                   | `apps/web`                | Add window focus re-sync for unread notifications and chat                                    | Client unit test                                             | **SCHEDULED** |      Normal Backlog       |
| **ISS-LOW-002** |   Phase 25   |   **LOW**   | Telco        | Meta WhatsApp webhook delivery latency during Friday rush    | Third-party carrier congestion                    | `notifications`           | Automatic BullMQ retry with exponential backoff (1s, 5s, 15s)                                 | Event test                                                   | **SCHEDULED** |      Normal Backlog       |

---

## 3. Blocker Closure Verification Summary

- **Total BLOCKER Issues Identified**: 10
- **Total BLOCKER Issues Resolved**: 10 (100%)
- **Total BLOCKER Issues Verified in Automated Tests**: 10 (100%)
- **Open BLOCKER Issues Remaining**: **0**

### Formal Decision

**ZERO OPEN LAUNCH-BLOCKING ISSUES REMAIN. THE PLATFORM MEETS ALL PRE-REQUISITES FOR PRODUCTION RELEASE.**
