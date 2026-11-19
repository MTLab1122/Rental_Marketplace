# Release Management Policy & Deployment Operations

## 1. Release Strategy & Objectives

The Peshawar Rental Marketplace release process balances rapid feature delivery with rock-solid operational stability. Our release strategy coordinates multi-tier deployments across the NestJS API backend, Next.js tenant web application, Next.js administrative dashboard, and Flutter mobile applications (Android APK/AAB and iOS IPA).

### Guiding Principles

- **Predictable Cadence**: Regular, scheduled release trains minimize deployment anxiety and batch risk.
- **Zero-Downtime Deployments**: Containerized rolling and canary updates guarantee continuous availability for tenants browsing listings and landlords managing inquiries.
- **Progressive Delivery**: Features are rolled out incrementally to a fraction of users before full exposure.
- **Decoupled Deployment and Activation**: Code deployment is separated from feature release using Remote Feature Flags.

---

## 2. Release Cadence & Windows

```
+---------------------------------------------------------------------------------------------------+
|                                   WEEKLY RELEASE TRAIN SCHEDULE                                   |
+---------------------------------------------------------------------------------------------------+
|  MONDAY             TUESDAY            WEDNESDAY           THURSDAY           FRIDAY / WEEKEND   |
|  - Sprint Planning  - Code Freeze      - Production Deploy - Monitoring &     - NO DEPLOYS       |
|  - PR Reviews       - Staging QA Sign- - Web & API (11:00) - Verification     - Operational      |
|  - Integration runs - Mobile Candidate - Canary (10%->100%)- Tech Debt Sprints  Monitoring Only  |
+---------------------------------------------------------------------------------------------------+
```

### Approved Deployment Windows

- **Standard Releases**: Wednesdays between **10:00 AM and 1:00 PM PKT** (after morning peak search activity and well before evening family viewing hours 7:00 PM – 10:00 PM PKT).
- **Emergency Hotfixes**: Permitted 24/7 with Engineering Lead authorization and incident ticket attachment.
- **Deployment Freezes**:
  - **Fridays after 2:00 PM PKT and Weekends**: Strictly enforced weekend freeze to prevent weekend outages.
  - **Eid-ul-Fitr & Eid-ul-Adha Holidays**: Total release freeze starting 3 days prior and ending 2 days post-holiday (highest family relocation planning period).
  - **Peshawar University & KMC Admission Weeks (September / October)**: High-traffic freeze where only P0 stability hotfixes are allowed.

---

## 3. Semantic Versioning & Tagging

The platform adheres strictly to **SemVer 2.0.0** (`MAJOR.MINOR.PATCH`):

- **MAJOR (`X.0.0`)**: Incompatible API contract changes, major architectural overhauls, or breaking database schemas.
- **MINOR (`0.Y.0`)**: Backwards-compatible new features, new locality additions, new search filters, new analytics dashboards.
- **PATCH (`0.0.Z`)**: Backwards-compatible bug fixes, performance patches, security remediations, and copy tweaks.

### Component Version Alignment

| Component           | Repo Path               | Versioning Schema      | Release Artifact                                     |
| :------------------ | :---------------------- | :--------------------- | :--------------------------------------------------- |
| **API Backend**     | `apps/api`              | `vX.Y.Z-api`           | Docker Image (`ghcr.io/rental-peshawar/api:<sha>`)   |
| **Tenant Web**      | `apps/web`              | `vX.Y.Z-web`           | Docker Image (`ghcr.io/rental-peshawar/web:<sha>`)   |
| **Admin Dashboard** | `apps/admin`            | `vX.Y.Z-admin`         | Docker Image (`ghcr.io/rental-peshawar/admin:<sha>`) |
| **Mobile App**      | `apps/mobile`           | `vX.Y.Z+<buildNumber>` | Android App Bundle (`.aab`), iOS Archive (`.ipa`)    |
| **Shared Types**    | `packages/shared-types` | `vX.Y.Z-types`         | Monorepo internal build (`pnpm build`)               |

---

## 4. Mobile Release Management (Flutter)

Mobile releases follow a phased app store distribution path:

```
+---------------------------------------------------------------------------------------------------+
|                                  MOBILE DISTRIBUTION PIPELINE                                     |
+---------------------------------------------------------------------------------------------------+
|  [Commit on main] ---> [Internal Testing] ---> [Closed Beta (50 Landlords)] ---> [Staged Rollout] |
|                        - Google Play Internal   - Peshawar Landlords Group       - 5% Day 1       |
|                        - TestFlight Internal    - Team Dogfooding                - 20% Day 2      |
|                                                                                  - 50% Day 3      |
|                                                                                  - 100% Day 5     |
+---------------------------------------------------------------------------------------------------+
```

### Staged Rollout Halting Criteria

The automated mobile monitoring pipeline halts the staged rollout if any of the following triggers occur:

1. **Crash-Free Sessions drop below 99.5%** on the newly released version.
2. **API 5xx errors attributable to the new client version exceed 0.5%**.
3. **App startup time on low-end Android devices (e.g. 2GB/3GB RAM) exceeds 3.5 seconds**.

---

## 5. Web & API Canary Deployment Workflow

Deployments to production utilize progressive traffic shifting:

1. **Staging Verification**: Automated end-to-end synthetic suites run against `https://staging-api.rentalpeshawar.pk`.
2. **Canary Deployment (10%)**:
   - 10% of production traffic is routed to the new container pods.
   - Prometheus monitors error rate and p95 latency for 15 minutes.
   - If p95 latency $> 500\text{ms}$ or error rate $> 0.5\%$, automated rollback occurs immediately.
3. **Progressive Promotion**:
   - Traffic stepped up to 25%, 50%, and finally 100% over a 45-minute window.
4. **Post-Deployment Health Check**:
   - Smoke tests execute synthetic searches for Hayatabad Phase 5 and University Town.
   - Notification delivery (Firebase / WhatsApp webhook) is verified.

---

## 6. Emergency Hotfix Workflow

When a critical production bug (SEV-1 / SEV-2) is declared:

1. Branch directly from `main` or latest release tag: `hotfix/YYYYMMDD-<description>`.
2. Implement minimal targeted fix with automated regression test.
3. Fast-track CI: Runs targeted test suites and security linters.
4. Fast-track Approval: Signed off by On-Call Incident Commander and Tech Lead.
5. Deploy to Production immediately using expedited single-pod replacement or feature flag deactivation.
6. Merge hotfix back into `main` and `develop` to prevent regression in future release trains.
7. Post-Incident Review (PIR) scheduled within 48 hours.

---

## 7. Stakeholder Communication & Changelog

Every release produces structured communication channels:

- **Internal Engineering Log**: Auto-generated GitHub release notes detailing commits, authors, and issue IDs.
- **Admin & Concierge Notification**: In-app banner inside `apps/admin` alerting customer service representatives to new landlord features or policy changes.
- **Tenant & Landlord What's New**:
  - Web changelog page at `/changelog`.
  - Mobile in-app modal highlighting key features (e.g. "Now introducing student roommate filter in Hayatabad").
  - Monthly WhatsApp digest for verified Pro/Enterprise landlords.
