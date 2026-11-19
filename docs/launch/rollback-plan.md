# Peshawar Rental Marketplace: Production Rollback Plan (v1.0.0-GA)

## 1. Rollback Policy & Authority

In accordance with Google SRE guidelines, the Peshawar Rental Marketplace adopts a **Rollback-First Policy**. If severe unexpected behavior, data corruption risk, or an SLO breach occurs during or immediately following deployment, the team must roll back immediately rather than attempting to debug or "hot-fix forward" in production.

- **Rollback Decision Owner**: Lead Systems Architect / SRE Lead.
- **Rollback Target SLA**: Complete system restored to previous known healthy state in **< 15 minutes**.
- **Data Protection Principle**: Zero loss of legitimate user data (registrations, bookings, messages).

---

## 2. Rollback Triggers & Abort Conditions

A rollback is initiated immediately upon any of the following triggers during canary rollout or within 4 hours of cutover:

1. **Availability Alert**: Production HTTP 5xx error rate exceeds 0.5% for > 3 minutes.
2. **Latency Degradation**: p95 API response time exceeds 1,000ms for > 5 minutes.
3. **Security Vulnerability**: Any critical CVE or unauthorized access vector discovered in production.
4. **Data Isolation Breach**: Any leakage of family-only property data to student accounts or vice-versa.
5. **Database Deadlocks**: Persistent connection pool exhaustion or unrecoverable lock contention.
6. **Payment/Escrow Inconsistency**: Double deduction or unrecorded ledger entries.

---

## 3. Rollback Playbook by Component

```
+-------------------------------------------------------------------------------------------------+
|                                 ROLLBACK EXECUTION FLOW                                         |
+-------------------------------------------------------------------------------------------------+
|  1. Declare Rollback -> 2. Traffic Diversion -> 3. Service Reversion -> 4. Schema Compatibility |
|                                                                                                 |
|   [Cloudflare DNS]       [Container Orchestrator]        [PostgreSQL / Redis]                   |
|   Route 100% traffic     Revert container tags          Validate backward                       |
|   to Blue (Previous)     to v0.9.x / Last Good          compatibility or WAL                   |
+-------------------------------------------------------------------------------------------------+
```

### Component A: Cloudflare Edge & Traffic Routing

Immediately divert incoming traffic away from the canary deployment:

```bash
# Set Cloudflare routing weight to 0% for Canary, 100% for Blue (Previous Stable)
curl -X PATCH "https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/load_balancers/${LB_ID}" \
     -H "Authorization: Bearer ${CF_API_TOKEN}" \
     -H "Content-Type: application/json" \
     --data '{"default_pools": ["pool-previous-stable"]}'
```

### Component B: NestJS Backend API Rollback

1. Pull and redeploy previous certified stable container image:

```bash
# Docker Compose environment
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d --no-build api-previous
```

2. Verify API health on local loopback before restoring public traffic:

```bash
curl -f http://localhost:3000/api/v1/health || exit 1
```

### Component C: Web & Admin Frontend Rollback

1. Switch Next.js deployment alias or container version:

```bash
# Revert Next.js Web and Admin containers
docker compose -f docker-compose.prod.yml up -d --no-build web-previous admin-previous
```

2. Flush Cloudflare edge cache for static and SSR routes:

```bash
curl -X POST "https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/purge_cache" \
     -H "Authorization: Bearer ${CF_API_TOKEN}" \
     -H "Content-Type: application/json" \
     --data '{"purge_everything": true}'
```

### Component D: Database & Schema Rollback

All migrations across Phases 1–20 are structured as additive and non-destructive. Columns and tables are not dropped in GA migrations.

- If a migration introduced a defect:
  1. If additive only: Keep new columns/tables in place; roll back application code that writes to them. This ensures zero data loss.
  2. If an emergency schema rollback is required:

```bash
# In staging replica or maintenance mode:
npx prisma migrate resolve --rolled-back "20260226_commercialization_growth_operations"
```

3. If data corruption occurred: Restore PostgreSQL database using Point-In-Time Recovery (PITR) to timestamp immediately prior to migration execution:

```bash
pg_restore --clean --if-exists -h $DB_HOST -U $DB_USER -d rental_peshawar_prod pitr_backup.dump
```

### Component E: Redis Cache Invalidation

Following an API or database rollback, flush stale query and session caches:

```bash
# Flush query caches while preserving rate-limiter tokens
redis-cli -h $REDIS_HOST -a $REDIS_AUTH EVAL "return redis.call('del', unpack(redis.call('keys', 'cache:property:*')))" 0
```

---

## 4. Post-Rollback Verification & Health Checks

After rolling back, the SRE Lead must execute the following automated verification suite:

1. `GET /api/v1/health` returns `200 OK` with database and Redis reported as `UP`.
2. Property search endpoint returns valid listings within 200ms.
3. User login and session verification succeeds.
4. Tenant eligibility filter correctly restricts student/family searches.
5. Inbound lead form functional.

---

## 5. Post-Mortem & Incident Retrospective SLA

- A formal Blameless Post-Mortem must be convened within **24 hours** of any production rollback.
- Root Cause Analysis (RCA) document published within **48 hours**.
- Corrective actions tracked as P0 work items before rescheduling go-live.
