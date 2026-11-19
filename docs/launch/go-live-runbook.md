# Peshawar Rental Marketplace: Go-Live Operational Runbook (v1.0.0-GA)

## 1. Overview & War Room Operations

This runbook provides the sequential, hour-by-hour operational steps required for production cutover and go-live.

- **War Room Location**: Peshawar Engineering HQ (Ground Floor Conference) & Virtual Discord/Meet Bridge.
- **Incident Channel**: `#war-room-golive-2026`
- **Voice Bridge**: Active 08:00 to 22:00 PKT on Launch Day.
- **Lead Controller**: SRE Lead & Systems Architect.

---

## 2. Pre-Flight Preparation (T - 24 Hours to T - 2 Hours)

```bash
# 1. Verify clean repository and release tag
git checkout main
git pull origin main
git verify-commit HEAD

# 2. Verify all environment configurations
cat .env.production | grep -E "DATABASE_URL|REDIS_URL|JWT_SECRET|CLOUDFLARE_API_KEY"

# 3. Validate Prisma schema and migrations
cd apps/api
npx prisma validate
npx prisma migrate status

# 4. Execute pre-flight build test across all workspaces
cd ../..
pnpm install
pnpm typecheck
pnpm test
```

---

## 3. Launch Day Hour-by-Hour Execution

### T - 02:00 Hours: Infrastructure Isolation & Seeding

1. SRE Lead verifies primary and replica PostgreSQL health.
2. Confirm PostGIS spatial extensions active:
   ```sql
   SELECT postgis_version();
   ```
3. Execute production database migration:
   ```bash
   cd apps/api && npx prisma migrate deploy
   ```
4. Seed base Peshawar localities:
   ```bash
   cd apps/api && npx prisma db seed
   ```
5. Confirm zero mock data in production database:
   ```sql
   SELECT count(*) FROM "properties" WHERE title ILIKE '%test%' OR title ILIKE '%demo%';
   -- MUST RETURN 0
   ```

### T - 01:00 Hour: Internal Smoke Testing

1. Spin up internal API containers.
2. Run automated health check:
   ```bash
   curl -s http://localhost:3000/api/v1/health | jq .
   ```
3. Test authentication endpoints:
   - Tenant Registration & Profile Completion.
   - Landlord Registration & Listing Creation within Peshawar boundary.
   - Admin Login with MFA step-up verification.

### T - 00:00 (09:00 PKT): Phase 2 Canary (5% Traffic)

1. Update Cloudflare load balancer weight:
   - Canary: 5%
   - Baseline: 95%
2. Monitor SRE dashboard for 30 minutes:
   - Search p95 latency: Target < 500ms
   - 5xx Error rate: Target < 0.1%
   - Database CPU: Target < 25%

### T + 03:00 Hours (12:00 PKT): Phase 3 Canary (25% Traffic)

1. Increase Cloudflare traffic allocation:
   - Canary: 25%
2. Activate Push Notification channels & WhatsApp inquiry forwarding.
3. Validate WebSocket connection metrics (Socket.io) under live concurrent user load.

### T + 06:00 Hours (15:00 PKT): Phase 4 Canary (50% Traffic)

1. Increase traffic allocation to 50%.
2. Moderate first live landlord listings submitted in University Town & Hayatabad.
3. Verify audit log immutability and ledger transactions.

### T + 09:00 Hours (18:00 PKT): Phase 5 General Availability (100% Traffic)

1. Route 100% traffic to production cluster.
2. Release Flutter APK to Google Play Store and Apple App Store production tracks.
3. Publish public announcement on social channels and press releases.
4. Growth team activates Peshawar student ambassador program.

---

## 4. Post-Cutover Verification Commands

```bash
# 1. Verify Public API Health
curl -I https://api.rentalpeshawar.pk/api/v1/health

# 2. Verify Ready Endpoint
curl -s https://api.rentalpeshawar.pk/api/v1/ready | jq .

# 3. Verify Public Sitemap Status
curl -I https://rentalpeshawar.pk/sitemap.xml

# 4. Verify Robots.txt
curl -s https://rentalpeshawar.pk/robots.txt | grep -E "Disallow|Allow"

# 5. Check Redis Connection Count
redis-cli -h $REDIS_HOST -a $REDIS_AUTH info clients

# 6. Check BullMQ Job Queue Backlog
redis-cli -h $REDIS_HOST -a $REDIS_AUTH llen "bull:notifications:wait"
```

---

## 5. Escalation Matrix during Cutover

| Severity  | Definition                                          | Notification            | Lead Responder            | Target Resolution       |
| :-------- | :-------------------------------------------------- | :---------------------- | :------------------------ | :---------------------- |
| **SEV-1** | Full site outage, data leak, payment corruption     | Phone Call / PagerDuty  | SRE Lead + Lead Architect | < 15 mins (or Rollback) |
| **SEV-2** | Latency > 1s, messaging failure, search degradation | SMS & Slack `#war-room` | Senior Backend Engineer   | < 30 mins               |
| **SEV-3** | Non-critical UI glitch, minor copy issue            | Slack `#war-room`       | Frontend Engineer         | < 4 hours               |
