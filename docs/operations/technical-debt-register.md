# Technical Debt Register & Remediation Strategy

## 1. Governance & Principles

Technical debt is an inevitable consequence of rapid product delivery and market expansion. In the Peshawar Rental Marketplace, technical debt is treated with engineering rigor: it is cataloged, cost-quantified, prioritized, and systematically retired.

### Core Policies

1. **The 20% Rule**: Exactly 20% of engineering bandwidth in every bi-weekly sprint is dedicated strictly to technical debt burndown, architectural refactoring, and test coverage improvements.
2. **Explicit Debt Tracking**: Tech debt cannot exist as informal TODO comments in source code. Every significant debt item must be registered in this document and assigned a Jira tracking ticket.
3. **Cost of Delay Prioritization**: Debt items that threaten data integrity, security boundaries, or system availability (P0/P1) take precedence over developer ergonomics or minor performance optimizations.
4. **Zero Debt on Security & Compliance**: Debt compromising tenant eligibility rules, geofencing validation, or user PII encryption is not tolerated and must be resolved within the active release cycle.

---

## 2. Active Technical Debt Register

| Debt ID    | Subsystem                | Description & Root Cause                                                                                                                    | Impact & Symptoms                                                                                                                                     | Cost of Delay                                                                             | Remediation Strategy                                                                                                                     | Effort           | Owner           | Priority | Target Milestone | Status      |
| :--------- | :----------------------- | :------------------------------------------------------------------------------------------------------------------------------------------ | :---------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------- | :--------------- | :-------------- | :------- | :--------------- | :---------- |
| **TD-001** | `apps/api` (Media)       | Media processing (Sharp image optimization & watermark overlay) executes inside the primary NestJS web worker process.                      | High CPU spikes during batch listing uploads (5+ photos) leading to occasional 200ms p95 API latency jitter.                                          | Potential API response degradation during landlord rush hours (5:00 PM – 8:00 PM).        | Decouple Sharp image processing into an isolated BullMQ background worker pod with dedicated CPU limits.                                 | 5 pts (3 days)   | Backend Lead    | **P1**   | Sprint 23.1      | Prioritized |
| **TD-002** | `database` (PostGIS)     | Spatial queries for multi-polygon bounding boxes in Peshawar localities rely on standard GiST index without spatial clustering.             | Geospatial boundary queries in Hayatabad & University Town take ~85ms under high concurrency.                                                         | DB CPU overhead increases linearly as listing density surpasses 5,000 active properties.  | Execute `CLUSTER properties USING idx_properties_location_gist` and implement bounding-box Redis caching for static locality boundaries. | 3 pts (2 days)   | DBA / Data Lead | **P2**   | Sprint 23.2      | Prioritized |
| **TD-003** | `apps/mobile` (Flutter)  | Network caching for property cards uses standard HTTP cache rather than persistent SQLite Hive/Isar storage.                                | Slow image and card rendering when tenants enter low-connectivity spots (e.g. subterranean shops in Saddar or cellular deadzones in Regi Model Town). | Tenant search abandonment and lower mobile app engagement in fringe network zones.        | Implement offline-first local SQLite cache with automatic background sync upon cellular reconnection.                                    | 8 pts (5 days)   | Mobile Lead     | **P1**   | Sprint 23.1      | In Progress |
| **TD-004** | `apps/api` (Billing)     | Landlord subscription verification currently executes synchronized database queries on every listing creation rather than tokenized claims. | Adds 12–18ms to listing submission latency; redundant read queries on the subscriptions table.                                                        | Database read connection pool saturation during commercial promotional campaigns.         | Cache active subscription tier claims in Redis session with 15-minute TTL and invalidation hooks on tier upgrades.                       | 3 pts (1 day)    | Backend Lead    | **P2**   | Sprint 23.2      | Prioritized |
| **TD-005** | `apps/admin` (Frontend)  | Admin listing moderation table currently fetches 50 records with nested landlord and verification objects via single monolithic endpoint.   | Admin dashboard page load takes ~1.2s on high-latency mobile hotspot connections used by field agents.                                                | Moderation turnaround time slows down slightly during field inspections.                  | Refactor admin API to return paginated lightweight summaries; lazy-load full property verification payloads in drawer modals.            | 5 pts (3 days)   | Frontend Lead   | **P2**   | Sprint 23.3      | Identified  |
| **TD-006** | `infrastructure` (Redis) | Single-instance Redis handles both BullMQ event queues and API response cache without namespace eviction separation.                        | Risk that aggressive API caching could evict long-lived background queue jobs under memory pressure.                                                  | Unpredictable job delays or dropped background email/SMS tasks under extreme burst loads. | Deploy dual Redis instances: Redis-Queue (persistent, no-eviction policy) and Redis-Cache (`volatile-lru` policy).                       | 5 pts (2 days)   | SRE Lead        | **P1**   | Sprint 23.2      | Prioritized |
| **TD-007** | `testing` (E2E)          | Automated end-to-end Cypress test suite takes 18 minutes to complete in GitHub Actions due to serial execution.                             | Developer wait time on PR verification hampers release velocity.                                                                                      | Developers tempted to skip full local E2E runs before creating PRs.                       | Shard E2E tests into 4 parallel GitHub Actions matrix runners; reduce total pipeline duration to under 5 minutes.                        | 5 pts (3 days)   | QA Lead         | **P2**   | Sprint 23.3      | Identified  |
| **TD-008** | `apps/api` (SEO)         | Sitemap generator recalculates XML entries dynamically on request rather than caching static files to disk/S3.                              | High crawler traffic (Googlebot / Bingbot) triggers repeated DB queries for 15 locality sitemaps.                                                     | Bot-induced database CPU load during daily search engine indexing passes.                 | Implement cron-based static XML sitemap generation to S3/Cloud Storage with 24-hour cache headers.                                       | 3 pts (1.5 days) | Growth Eng      | **P2**   | Sprint 23.2      | Prioritized |

---

## 3. Debt Evaluation & Intake Workflow

To prevent uncontrolled accumulation of debt, every new piece of tech debt is evaluated using the following matrix:

```
+-------------------------------------------------------------------------------------------------+
|                                 TECH DEBT INTAKE DECISION TREE                                  |
+-------------------------------------------------------------------------------------------------+
|                                                                                                 |
|   Does this issue compromise Security, CNIC privacy, or Eligibility Rules?                      |
|       |                                                                                         |
|      YES ---> [P0 BLOCKER: Fix immediately; do not release to production]                       |
|       |                                                                                         |
|      NO                                                                                         |
|       v                                                                                         |
|   Does this issue threaten SLOs, Error Budget, or cause data corruption?                        |
|       |                                                                                         |
|      YES ---> [P1 HIGH: Schedule in next sprint; utilize 20% tech debt allocation]              |
|       |                                                                                         |
|      NO                                                                                         |
|       v                                                                                         |
|   Does this issue affect developer velocity, build times, or minor UX latency?                  |
|       |                                                                                         |
|      YES ---> [P2 MEDIUM: Prioritize in quarterly backlog; assign to domain owner]              |
|       |                                                                                         |
|      NO  ---> [P3 LOW: Log in register; address during planned component refactoring]           |
+-------------------------------------------------------------------------------------------------+
```

---

## 4. Quarterly Burndown & Accountability

- **Weekly Review**: The Tech Lead and SRE Lead review the active register during the Weekly Operational Review (WOR).
- **Target Velocity**: Minimum of 2 registered debt items must be fully remediated and marked `Resolved` per bi-weekly sprint.
- **Reporting**: Quarterly debt retirement metrics are presented to the executive committee during the Quarterly Business Review (QBR).
