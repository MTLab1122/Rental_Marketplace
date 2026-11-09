# Rental Marketplace Peshawar (KP, Pakistan)

[![CI Pipeline](https://github.com/MTLab1122/Rental_Marketplace/actions/workflows/ci.yml/badge.svg)](https://github.com/MTLab1122/Rental_Marketplace/actions/workflows/ci.yml)
[![Node.js](https://img.shields.io/badge/Node.js-22_LTS-green.svg)](https://nodejs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11-red.svg)](https://nestjs.com/)
[![Next.js](https://img.shields.io/badge/Next.js-15_App_Router-black.svg)](https://nextjs.org/)
[![Flutter](https://img.shields.io/badge/Flutter-3.27-blue.svg)](https://flutter.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL_16-PostGIS_3.4-336791.svg)](https://postgis.net/)
[![pnpm](https://img.shields.io/badge/pnpm-12-orange.svg)](https://pnpm.io/)

Production-ready rental property platform engineered exclusively for **Peshawar, Khyber Pakhtunkhwa, Pakistan**.

---

## Non-Negotiable Core Invariants

1. **Strict Eligibility Segregation**: Every listing is strictly `STUDENTS_ONLY` or `FAMILIES_ONLY`. Zero mixed search results or recommendations.
2. **Peshawar Geofencing**: All listings are verified against the official municipal boundary polygon via PostGIS.
3. **15 Verified Localities**: Properties must belong to an active, recognized Peshawar locality.
4. **Mandatory Admin Verification**: Listings must pass administrative verification before becoming publicly visible.
5. **Soft Deletion & Auditability**: Inquiries, leases, and historical listings are permanently preserved via immutable audit logs.

---

## Monorepo Layout

```
rental-peshawar/
├── apps/
│   ├── api/            # NestJS 11 REST API, Swagger, WebSockets, Prisma, PostGIS, Pino
│   ├── web/            # Next.js 15+ App Router tenant web portal
│   ├── admin/          # Next.js 15+ App Router governance & verification console
│   └── mobile/         # Flutter mobile app (Riverpod, GoRouter, Material 3)
├── packages/
│   ├── shared-types/   # Domain enums, DTOs, API envelopes, error codes
│   ├── config/         # Peshawar boundary polygon, localities, validated env schema
│   └── ui/             # Design tokens (Emerald, Terracotta, Slate), typography, spacing
├── docs/               # Architecture, database design, API conventions, PRD, PDR
├── infra/              # Docker Compose, Dockerfiles, PostGIS initialization scripts
└── .github/workflows/  # Complete CI/CD GitHub Actions pipeline
```

---

## Quickstart

```bash
# 1. Install dependencies across all monorepo workspaces
pnpm install

# 2. Configure environment variables
cp .env.example .env

# 3. Start local container stack (PostgreSQL + PostGIS, Redis, MailHog, MinIO)
docker compose up -d

# 4. Validate Prisma schema
cd apps/api && npx prisma validate && cd ../..

# 5. Run linting, typechecking, and tests
pnpm lint
pnpm typecheck
pnpm test

# 6. Build all packages and applications
pnpm build
```

---

## Interactive Documentation

- **Swagger / OpenAPI**: `http://localhost:4000/docs`
- **Liveness Probe**: `GET http://localhost:4000/health`
- **Readiness Probe**: `GET http://localhost:4000/ready`
- **Tenant Portal**: `http://localhost:3000`
- **Admin Console**: `http://localhost:3001`
