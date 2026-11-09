# Local Development Guide

## 1. Prerequisites

- **Node.js**: v20.x or v22.x (Recommended: v22 LTS)
- **pnpm**: v12.x or v9.x (`npm install -g pnpm`)
- **Docker & Docker Compose**: v24.x+
- **Flutter SDK**: v3.27+ (for mobile app development)

---

## 2. Quickstart

### Step 1: Clone and Install Dependencies

```bash
git clone https://github.com/MTLab1122/Rental_Marketplace.git
cd Rental_Marketplace
pnpm install
```

### Step 2: Configure Environment

Copy the example environment configuration:

```bash
cp .env.example .env
```

### Step 3: Start Infrastructure Services

Start PostgreSQL with PostGIS, Redis, MailHog, and MinIO:

```bash
docker compose up -d
docker compose ps
```

### Step 4: Validate Database & Prisma Client

```bash
cd apps/api
npx prisma validate
npx prisma generate
cd ../..
```

### Step 5: Run Code Quality Checks & Tests

```bash
# Lint all packages
pnpm lint

# Strict typechecking across monorepo
pnpm typecheck

# Run unit and integration tests
pnpm test

# Build all packages and applications
pnpm build
```

---

## 3. Running Applications

| Application      | Command                                        | Local URL                      |
| ---------------- | ---------------------------------------------- | ------------------------------ |
| Backend API      | `pnpm --filter @rental-peshawar/api start:dev` | `http://localhost:4000/api/v1` |
| Swagger API Docs | (Started with Backend)                         | `http://localhost:4000/docs`   |
| Tenant Web App   | `pnpm --filter @rental-peshawar/web dev`       | `http://localhost:3000`        |
| Admin Console    | `pnpm --filter @rental-peshawar/admin dev`     | `http://localhost:3001`        |
| Flutter Mobile   | `cd apps/mobile && flutter run`                | Device / Emulator              |
| MinIO Console    | (Started via Docker)                           | `http://localhost:9001`        |
| MailHog UI       | (Started via Docker)                           | `http://localhost:8025`        |

---

## 4. Conventional Commit Standard

All commits must adhere to the Conventional Commits specification:

- `feat: add postgis polygon coordinate validation`
- `fix: resolve cursor pagination boundary calculation`
- `docs: update api conventions envelope format`
