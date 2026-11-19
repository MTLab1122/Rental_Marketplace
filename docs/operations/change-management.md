# Change Management Policy & Governance

## 1. Objectives & Principles

The Peshawar Rental Marketplace change management policy guarantees that all production modifications—spanning NestJS backend code, Next.js web applications, Flutter mobile releases, PostgreSQL schema migrations, Redis configurations, and cloud infrastructure updates—are executed safely, traceably, and without service disruption.

### Core Principles

1. **Zero Direct Production Access**: Direct mutations to production databases, Redis instances, or running application containers are strictly prohibited. All changes must originate from version-controlled git repositories and pass automated CI/CD pipelines.
2. **Automated Verification**: No pull request can merge without 100% green status on automated unit tests, integration tests, static type checks (`tsc`), and security linting.
3. **Mandatory Peer Review**: Every production-bound change requires approval from at least one domain peer and an engineering lead.
4. **Guaranteed Rollback Path**: Every deployment must have a verified, tested automated rollback mechanism (canary drain, database expand-contract compatibility, or mobile feature flag kill-switch).
5. **Change Advisory Board (CAB) for High-Risk Operations**: Infrastructure modifications, data migrations exceeding 50,000 rows, and major architectural releases require CAB sign-off.

---

## 2. Change Categorization Matrix

| Change Class                   | Description                                                                                                                                              | Examples                                                                                                      | Approval Requirement                                                       | Lead Time            | Testing Required                                                   |
| :----------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------- | :------------------- | :----------------------------------------------------------------- |
| **Standard Change**            | Low-risk, pre-approved, routine updates with established procedures.                                                                                     | Copy updates, translation fixes, SEO meta tag tweaks, dependency patch updates with green CI.                 | 1 Peer Reviewer                                                            | 1 hour               | Automated CI/CD test suite                                         |
| **Normal Change**              | Moderate-risk feature additions, schema additions (additive only), API endpoint additions, UI enhancements.                                              | Adding a new locality filter, new webhook handler, introducing a new notification channel.                    | 2 Peer Reviewers + Tech Lead                                               | 24 hours             | Full unit, integration, staging verification                       |
| **Emergency Change**           | Urgent fixes required to restore degraded service, plug active security vulnerabilities, or stop financial leakage.                                      | Hotfix for SEV-1 authentication bypass, fix for incorrect payment fee calculation, P0 crash on mobile launch. | On-Call Lead + Engineering Lead (post-incident retroactive CAB within 24h) | Immediate (< 30 min) | Targeted regression + hotfix test suite                            |
| **High-Impact / Major Change** | Structural schema refactoring (dropping columns, splitting tables), breaking API contract changes, auth provider swap, cloud provider networking change. | Migrating from Prisma to raw SQL, multi-region database failover test, dropping deprecated columns.           | Full CAB (Tech Lead, SRE Lead, Security Officer, Product Owner)            | 5 business days      | Staging rehearsal, backup verification, synthetic rollback dry-run |

---

## 3. Pull Request & Code Review Governance

### PR Quality Gates

All code contributions must pass through GitHub Actions / CI pipeline before human review:

- **Linting & Formatting**: Strict ESLint, Prettier, and Flutter analyze compliance with zero warnings.
- **Type Checking**: Clean run of `pnpm --filter shared-types build`, `pnpm --filter web typecheck`, `pnpm --filter admin typecheck`, and `nest build`.
- **Unit & Integration Tests**: 100% pass rate across backend (35+ test suites), web (12+ test suites), admin, and mobile unit tests.
- **Security Scans**: Snyk / Trivy dependency vulnerability scan with zero high or critical CVEs. No hardcoded credentials or API keys permitted (verified by GitGuardian / TruffleHog).
- **PR Description Standards**:
  - Clear summary of change and motivation.
  - Linked Jira/Issue ticket reference.
  - Verification checklist (how the author validated the change in local/staging).
  - Risk assessment (Low / Medium / High) and explicit rollback instructions.

### Prohibited Changes

The following are unconditionally blocked by CI or code review rules:

- Direct raw SQL queries that bypass parameterized statements or ORM abstractions.
- Database migrations containing non-additive operations (e.g., `DROP COLUMN`, `RENAME COLUMN` in a single step) without a preceding phase of deprecation.
- Modification of core tenant eligibility segregation (students vs. families) without explicit Product Owner sign-off.
- Any change removing or disabling Peshawar municipal geofence validation (33.90°N–34.15°N, 71.35°E–71.70°E).
- Committing plain text credentials, secrets, or `.env` files into source control.

---

## 4. Database Schema Migration Governance

The Peshawar platform handles critical transaction data (rental leases, tenant CNIC verifications, payment logs). Schema migrations must follow the **Expand and Contract** pattern:

```
+------------------------------------------------------------------------------------------------+
|                              EXPAND AND CONTRACT PATTERN                                       |
+------------------------------------------------------------------------------------------------+
|  Phase 1: EXPAND                                                                               |
|  - Add new column or table as nullable or with safe defaults.                                  |
|  - Deploy code that dual-writes to both old and new columns.                                   |
|  - Read from old column.                                                                       |
|                                                                                                |
|  Phase 2: BACKFILL & SWITCH                                                                    |
|  - Run asynchronous background job (BullMQ) to backfill legacy rows.                          |
|  - Verify 100% parity between old and new columns.                                             |
|  - Deploy code that switches reads to the new column while continuing dual writes.              |
|                                                                                                |
|  Phase 3: CONTRACT                                                                             |
|  - Stop writing to legacy column.                                                              |
|  - After 1 full release cycle with zero regressions, drop legacy column in separate migration. |
+------------------------------------------------------------------------------------------------+
```

### Migration Safety Rules

1. **Locking Safeguards**: All migrations must specify `SET lock_timeout = '2s'` and `SET statement_timeout = '10s'` to prevent table lock escalation during peak daytime hours in Peshawar (10:00 AM – 10:00 PM PKT).
2. **Concurrent Indexing**: All new database indexes must be created using `CREATE INDEX CONCURRENTLY` in PostgreSQL.
3. **Backup Guarantee**: Automated snapshots are triggered prior to executing major migration batches.

---

## 5. Rollback Procedures & Runbooks

Every change must include an actionable, tested rollback strategy:

### Web & Backend Rollback

- **Canary Drain**: If error rate exceeds 1% during a canary deployment, the ingress router (Traefik/Cloudflare/Kubernetes) automatically shifts 100% traffic back to the stable replica pool within 60 seconds.
- **Fast Revert**: If an issue is discovered post-100% rollout, the on-call engineer triggers the GitHub Actions `Rollback to Previous SHA` workflow, which redeploys the last known stable Docker image without recompilation.

### Database Rollback

- Reversible migration scripts (`down` migrations) must be committed alongside every `up` migration.
- If data corruption occurs, point-in-time recovery (PITR) to a pre-migration timestamp is executed on an isolated staging clone first to verify integrity before cutting over.

### Mobile App Rollback

- Native binary rollbacks (iOS/Android) cannot be forced immediately on client devices due to app store caching and gradual updates.
- All new mobile features are guarded by server-driven Remote Feature Flags. In case of a critical mobile crash or logic bug, the flag is toggled to `OFF` via the Admin Reliability dashboard, instantly deactivating the feature across all mobile clients within 60 seconds without an app store resubmission.

---

## 6. Audit Logging & Compliance

All change events are automatically logged into the immutable operational audit log:

- PR merge event (author, approvers, commit SHA, timestamp).
- CI/CD pipeline build and test results.
- Deployment trigger (initiating engineer, target environment, image digest).
- Database migration execution log (execution duration, affected row count).
- Feature flag toggle events in Admin dashboard (admin user ID, flag name, previous state, new state, justification).
