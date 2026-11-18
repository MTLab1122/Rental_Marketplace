# Production Launch Playbook — Rental Peshawar

This document outlines the standard operating procedure (SOP) for launching and certifying the production release of Rental Peshawar.

---

## 1. Pre-Launch Environment Verification

Verify all environment variables across API, Web, and Admin:

- `DATABASE_URL`: Production PostgreSQL connection string with PostGIS extension enabled and connection pool limits (`connection_limit=50`).
- `REDIS_HOST`, `REDIS_PASSWORD`: Production Redis cluster/instance.
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`: High-entropy 256-bit secrets.
- `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`: Private storage configuration for encrypted CNIC documents and public CDN for property images.
- `FCM_SERVER_KEY`: Firebase Cloud Messaging credentials for mobile push delivery.
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_PHONE`: Primary super-administrator credentials.

---

## 2. Production Database Deployment & Reference Seeding

Run database migrations:

```bash
cd apps/api
npx prisma migrate deploy
```

Execute operational reference seeding only:

```bash
cd apps/api
npx prisma db seed --production-reference-only
```

> [!IMPORTANT]
> The `--production-reference-only` flag guarantees that ONLY system roles, permissions, verified amenities, initial 15 Peshawar localities, and the Peshawar metropolitan service boundary are seeded. Zero fake users, fake listings, or mock reviews are inserted into production.

---

## 3. Supply Acquisition & Launch Supply Gate

Before public marketing campaigns commence, the supply gate must be certified via the Supply Governance API:

- **Total Verified Active Listings:** Minimum 100 verified listings.
- **Student-Only Inventory:** Minimum 30 approved listings.
- **Family-Only Inventory:** Minimum 30 approved listings.
- **Priority Locality Distribution:** Minimum 10 listings each in:
  1. University Town
  2. Hayatabad
  3. University Road
  4. Saddar
  5. Regi Model Town

Query verification endpoint:

```bash
curl -H "Authorization: Bearer $ADMIN_TOKEN" https://api.rentalpeshawar.pk/api/v1/supply/targets
```

Ensure `launchReadiness.overallStatus` returns `READY_FOR_PUBLIC_MARKETING`.

---

## 4. Production Smoke & Health Checks

Verify container status and responsiveness:

```bash
# 1. API Health & Ready endpoints
curl -I https://api.rentalpeshawar.pk/api/v1/health
curl -I https://api.rentalpeshawar.pk/api/v1/ready

# 2. Dynamic XML Sitemap
curl -I https://api.rentalpeshawar.pk/api/v1/growth/seo/sitemap.xml

# 3. Web & Admin Apps
curl -I https://rentalpeshawar.pk
curl -I https://admin.rentalpeshawar.pk
```

Expected: `HTTP/2 200 OK` across all endpoints with TLS 1.3 encryption.
