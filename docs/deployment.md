# Deployment & Infrastructure Guide

## 1. Overview

The platform uses containerized deployment managed via Docker and Docker Compose for local development and CI, with production-ready multi-stage Dockerfiles for Kubernetes / cloud container services.

---

## 2. Infrastructure Services (Docker Compose)

| Service               | Container Name             | Image                    | Port                       | Healthcheck              |
| --------------------- | -------------------------- | ------------------------ | -------------------------- | ------------------------ |
| PostgreSQL (PostGIS)  | `rental_peshawar_postgres` | `postgis/postgis:16-3.4` | `5432:5432`                | `pg_isready -U postgres` |
| Redis                 | `rental_peshawar_redis`    | `redis:7-alpine`         | `6379:6379`                | `redis-cli ping`         |
| MailHog               | `rental_peshawar_mailhog`  | `mailhog/mailhog:v1.0.1` | `1025` (SMTP), `8025` (UI) | HTTP Ping                |
| MinIO (S3 Compatible) | `rental_peshawar_minio`    | `minio/minio:latest`     | `9000` (S3), `9001` (Web)  | `mc ready local`         |

---

## 3. Production Multi-Stage Builds

All Dockerfiles reside under `infra/docker/`:

- `Dockerfile.api`: Builds the NestJS backend on `node:22-alpine` using pnpm pruned workspaces.
- `Dockerfile.web`: Builds the Next.js tenant portal with standalone output optimization.
- `Dockerfile.admin`: Builds the Next.js admin dashboard.

---

## 4. Database Migrations Workflow

1. Apply schema changes:
   ```bash
   pnpm --filter @rental-peshawar/api prisma:migrate:dev --name <migration_name>
   ```
2. Production migration deployment:
   ```bash
   pnpm --filter @rental-peshawar/api prisma:migrate:deploy
   ```
3. Validate schema integrity:
   ```bash
   pnpm --filter @rental-peshawar/api prisma:validate
   ```

---

## 5. Health & Readiness Monitoring

- **Liveness Probe**: `GET /health` (Returns 200 OK if Node event loop is responsive).
- **Readiness Probe**: `GET /ready` (Verifies live connections to PostgreSQL PostGIS and Redis).
- Orchestrators (Kubernetes/ECS) should decouple traffic from any replica returning non-200 on `/ready`.
