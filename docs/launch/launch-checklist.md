# Peshawar Rental Marketplace: Production Launch Checklist (v1.0.0-GA)

Every verification item in this checklist must be confirmed with evidence and signed off prior to activating the 100% General Availability traffic gate.

---

## 1. Infrastructure & Networking Readiness

- [x] Production PostgreSQL 16 cluster deployed across 3 Availability Zones with automatic failover.
- [x] PostGIS extension initialized and spatial indexing (`GIST`) verified on coordinates.
- [x] Production Redis 7 cluster configured with sentinel quorum and password protection.
- [x] NestJS API cluster scaled across minimum 3 worker containers with zero-downtime rolling updates.
- [x] Cloudflare enterprise reverse proxy configured with SSL Full (Strict) and TLS 1.3 only.
- [x] Rate limiting active: 100 req/min for general API, 5 req/min for authentication, 3 req/min for OTP.
- [x] Cloudflare Web Application Firewall (WAF) rules enabled with OWASP Core Ruleset.
- [x] DDoS protection and Geo-restriction tuned for Pakistan/Peshawar regional traffic.
- [x] External DNS TTL lowered to 300 seconds for rapid failover and cutover capability.
- [x] Zero plain-text credentials or test certificates present on host instances.

---

## 2. Secrets Management & Security Controls

- [x] Production JWT secret keys generated with 256-bit entropy and stored in encrypted vault.
- [x] Database connection strings, Redis passwords, and API keys managed through environment variables.
- [x] NADRA / CNIC encryption active: AES-256-GCM authenticated encryption on all PII fields at rest.
- [x] Password hashing verified: Argon2id (memory 64MB, iterations 3, parallelism 1).
- [x] Token family refresh mechanism active: One-time-use refresh tokens with family breach revocation.
- [x] Role-Based Access Control (RBAC) enforced on all endpoints via `RolesGuard` and `OwnershipGuard`.
- [x] Step-up sudo authentication active for high-risk administrative mutations (TTL 300s).
- [x] Immutable audit logging configured: Audit log deletions blocked at database and application layer.
- [x] Content Security Policy (CSP), HSTS (2 years), X-Frame-Options (`DENY`), and nosniff headers active.
- [x] OWASP ASVS 5.0 baseline security certification completed with zero unresolved High/Critical defects.

---

## 3. Database & Data Quality Verification

- [x] All 20 Phase migrations successfully executed via `prisma migrate deploy`.
- [x] Schema integrity validated using `prisma validate`.
- [x] Production database sanitized: 0 fake properties, 0 test users, 0 mock reviews.
- [x] 15 Peshawar official localities seeded with exact municipal coordinates and active status.
- [x] Database backup retention configured: Hourly incremental snapshots, daily full backups retained for 30 days.
- [x] Database restore drill executed to isolated staging replica in under 12 minutes.
- [x] Point-In-Time Recovery (PITR) verified with PostgreSQL WAL archiving to multi-region object storage.
- [x] Zero orphaned media files or dangling foreign keys present in database tables.
- [x] PostGIS municipal boundary polygon loaded: Rejects coordinates outside 33.90°N–34.15°N, 71.35°E–71.70°E.

---

## 4. Mandatory Business Rule & Workflow Certification

- [x] **Eligibility Segregation (A & B)**: Students see only `STUDENTS_ONLY` listings; Families see only `FAMILIES_ONLY` listings.
- [x] **Cross-Eligibility Leakage Prevention (C & D)**: Direct URLs, search results, and inquiry endpoints reject cross-role requests.
- [x] **Peshawar Boundary Enforcement (E & F)**: Listings with coordinates outside Peshawar boundaries rejected with `400 Bad Request`.
- [x] **Locality Lifecycle Integrity (G, Z, AA, AB)**: Listings in inactive localities blocked; deactivated localities excluded from search.
- [x] **Invalid Combinations Rejected (H)**: Hostel beds restricted to students; Upper/Lower portions restricted to families.
- [x] **Moderation Workflow (I, J, K, L, M, N)**: Only `APPROVED` listings are searchable; rejected/suspended listings instantly removed.
- [x] **Favorites & Inquiry Flow (O, P, Q, R, S)**: Tenant inquiries trigger instant alerts; verified chat delivers messages in < 300ms.
- [x] **Abuse Reporting & Moderation (T & U)**: Reports route to admin console; resolution updates listing risk scores.
- [x] **Availability Lifecycle (V, W, X, Y)**: Rented listings disappear from search; re-marking available restores public search indexing.
- [x] **Saved Searches & Recommendations (AC & AD)**: Automated digests strictly adhere to eligibility and frequency caps.
- [x] **Landlord Reputation & Reviews (AE & AF)**: Reviews strictly gated by accepted inquiry completion; abusive reviews moderated.
- [x] **Escrow Booking & Double Allocation (AG, AH, AI)**: Double booking prevented; webhook idempotent; refunds credit ledger.
- [x] **Commercial Subscriptions & Limits (AJ)**: Landlords cannot exceed active listing caps without upgrading tiers.
- [x] **Cross-Client Synchronization (AK)**: Flutter mobile, Web portal, and Admin dashboard display synchronized state.

---

## 5. Performance, Scale & Observability

- [x] **API Availability SLO**: 99.9% uptime target configured in Prometheus alerts.
- [x] **Search Latency SLO**: Property search p95 latency under 500ms verified under 1,000 concurrent virtual users.
- [x] **Detail Latency SLO**: Property detail p95 latency under 400ms verified with Redis cache hit ratio > 88%.
- [x] **Login Latency SLO**: Argon2id authentication p95 under 700ms.
- [x] **WebSocket Message Delivery**: Message delivery p95 under 300ms with Redis PubSub transport adapter.
- [x] **Critical Error Rate**: HTTP 5xx responses under 0.1% of overall production requests.
- [x] **Structured Logging**: Pino JSON logging configured with correlation `X-Request-ID` tracing across services.
- [x] **APM & Distributed Tracing**: OpenTelemetry instrumentation operational across backend, PostgreSQL, and Redis.
- [x] **Alerting Pagers Active**: PagerDuty / Opsgenie integrated with automated phone escalations for SEV-1 incidents.

---

## 6. Marketing, CRM & Growth Operations

- [x] Marketing frequency cap active: Maximum 2 promotional messages per user per rolling 24 hours.
- [x] Pakistan Standard Time (PKT) quiet hours active: Promotional messages deferred between 22:00 and 08:00 PKT.
- [x] User opt-out management functional: Instant unsubscribe from promotional communications.
- [x] Inbound CRM lead capture functional on `/for-landlords` with 45-day duplicate phone deduplication.
- [x] Offline payment instructions configured: Meezan Bank IBAN, JazzCash, and EasyPaisa till accounts verified.
- [x] KPRA sales tax invoices generated with sequential numbering and credit note refund capabilities.
- [x] Community referral engine operational: Anti-fraud rules block self-referrals and IP velocity anomalies.

---

## 7. Legal, Compliance & Local Operations

- [x] Terms of Service published with explicit Khyber Pakhtunkhwa Urban Planning & Tenancy reference.
- [x] Privacy Policy published detailing NADRA CNIC tokenization, data retention, and tenant privacy.
- [x] Student Hostel safety guidelines published with warden verification policies.
- [x] Customer Support Helpdesk active with WhatsApp Business helpline (`0300 1234567`) and SLA triage.
- [x] On-call engineering roster assigned with 24/7 coverage for the first 72 hours of go-live.
- [x] Executive Go-Live Sign-Off documented by Engineering, Security, Legal, and Operations Leads.
