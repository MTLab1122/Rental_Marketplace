# Peshawar Rental Marketplace: Master Production Launch Plan (v1.0.0-GA)

## 1. Executive Summary & Launch Objective

The Peshawar Rental Marketplace is the municipal-grade, verified digital rental portal built exclusively for the Peshawar metropolitan area in Khyber Pakhtunkhwa (KP), Pakistan.

This document defines the master production launch plan, progressive rollout schedule, stakeholder responsibilities, maintenance windows, verification gates, and zero-downtime cutover strategy.

---

## 2. Platform Architecture & Service Perimeter

- **Target Geography**: Peshawar Metropolitan Area, KP, Pakistan.
- **Geographic Bounding Box**: 33.90°N to 34.15°N, 71.35°E to 71.70°E.
- **Municipal Scope**: 15 verified localities (Hayatabad Phases 1-7, University Town, Peshawar Cantt, Saddar, Warsak Road, Regi Model Town, Gulbahar, DHA Peshawar, Dalazak Road, Charsadda Road, Kohat Road, Ring Road, GT Road, Board Bazar).
- **Core Stacks**:
  - Backend: NestJS 11 + Prisma ORM + PostgreSQL 16 + PostGIS + Redis 7.
  - Web Portal: Next.js 15 (App Router, SSR, Turbopack, Tailwind CSS).
  - Admin Operations: Next.js 15 + Tailwind CSS + Enterprise RBAC.
  - Mobile App: Flutter 3.27+ (iOS & Android).

---

## 3. Launch Schedule & Phased Rollout Timeline

```
+-------------------------------------------------------------------------------------------------+
|                                 GO-LIVE CUTOVER TIMELINE                                        |
+----------------------+--------------------+---------------------+-------------------------------+
| PHASE                | TIMEFRAME (PKT)    | TRAFFIC ALLOCATION  | TARGET AUDIENCE               |
+----------------------+--------------------+---------------------+-------------------------------+
| Phase 0: Dry Run     | T - 48 Hours       | 0% Public           | SRE & Lead QA Engineers       |
| Phase 1: Internal    | T - 24 Hours       | Internal Only       | Employees, Landlord Alpha     |
| Phase 2: Canary 5%   | Launch Day 09:00   | 5% Public Traffic   | University Town & Phase 3     |
| Phase 3: Canary 25%  | Launch Day 12:00   | 25% Public Traffic  | Hayatabad & Cantt             |
| Phase 4: Canary 50%  | Launch Day 15:00   | 50% Public Traffic  | Full District Peshawar        |
| Phase 5: General 100%| Launch Day 18:00   | 100% Public Traffic | Full Public & Mobile App Stores|
+----------------------+--------------------+---------------------+-------------------------------+
```

### Detailed Schedule Breakdown

#### T - 48 Hours: Staging Freeze & Production Pre-Seeding

- Code freeze on branch `main`.
- Deploy release candidate to Staging environment (`staging.rentalpeshawar.pk`).
- Run end-to-end regression test suite (API, Web, Mobile).
- Execute full database backup and restore drill to staging replica.
- Verify zero fake/test listings in production DB.

#### T - 24 Hours: Production Infrastructure Provisioning

- Run database migration: `npx prisma migrate deploy` on production PostgreSQL.
- Initialize Redis cluster with primary-replica replication and sentinel failover.
- Deploy NestJS backend containers across 3 availability zones behind Cloudflare Load Balancers.
- Deploy Next.js web and admin builds to production edge cluster.
- Run health and readiness checks:
  - `GET /api/v1/health`
  - `GET /api/v1/ready`

#### Launch Day 09:00 PKT: Phase 2 (Canary 5%)

- Direct 5% of web and mobile API requests through Cloudflare canary routing.
- Restrict registration nudges to University Town and Hayatabad Phase 3 pilot groups.
- Monitor SRE telemetry: API p95 latency (< 500ms), 5xx error rate (< 0.1%).

#### Launch Day 12:00 PKT: Phase 3 (Canary 25%)

- Expand canary traffic to 25%.
- Activate real-time FCM push notifications and WhatsApp inquiry webhooks.
- Monitor WebSocket concurrent connection stability and BullMQ outbox delivery lag.

#### Launch Day 15:00 PKT: Phase 4 (Canary 50%)

- Expand to 50% traffic.
- Enable student verification queue and landlord fast-track identity moderation desk.
- Verify payment intent audit trails and offline bank reconciliation queues.

#### Launch Day 18:00 PKT: Phase 5 (100% General Availability)

- Shift 100% DNS traffic to production cluster.
- Publish production mobile app builds to Google Play Store and Apple App Store.
- Open public marketing campaigns, PR announcements, and university campus ambassador programs.
- Activate 24/7 SRE Command Center and Operations War Room for 72 hours.

---

## 4. Stakeholder Roles & RACI Matrix

| Role                    | Name / Team               | Responsibility                                                         |
| :---------------------- | :------------------------ | :--------------------------------------------------------------------- |
| **Go-Live Commander**   | Lead Systems Architect    | Final Go/No-Go authority, cutover execution leader.                    |
| **SRE Lead**            | Infrastructure & DevOps   | Cluster health, database failover, edge routing, rollback trigger.     |
| **Security Officer**    | AppSec Lead               | Vulnerability gate sign-off, secret vault validation, incident triage. |
| **QA Lead**             | Certification Engineering | Regression testing, 37 E2E business scenario validation.               |
| **Moderation Manager**  | Peshawar Operations Desk  | Landlord deed verification, identity review, listing quality audit.    |
| **Communications Lead** | Growth & Public Relations | Press release, user alerts, university student notifications.          |

---

## 5. Rollback & Emergency Abort Criteria

The launch is aborted and immediate rollback initiated if any of the following occur during canary rollouts:

1. **Critical Availability Breach**: API availability drops below 99.5% for > 5 consecutive minutes.
2. **Error Rate Spike**: 5xx HTTP responses exceed 0.5% of total requests over a 5-minute rolling window.
3. **Data Integrity Violation**: Any cross-eligibility data leakage (e.g., student sees family-only listing or vice versa).
4. **Latency Degradation**: p95 search latency exceeds 1,000ms under canary load.
5. **Security Alert**: Critical or High severity vulnerability triggered in production.
6. **Data Loss Event**: Database write failures or Redis cache desynchronization.

Refer to `docs/launch/rollback-plan.md` for specific step-by-step procedures.
