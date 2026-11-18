# Production Dockerfile for Rental Peshawar NestJS API
FROM node:20-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@12.18.0 --activate

# Copy root workspace configurations
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Generate Prisma Client & Build Packages
RUN pnpm --filter @rental-peshawar/shared-types build
RUN pnpm --filter @rental-peshawar/config build
RUN cd apps/api && npx prisma generate
RUN pnpm --filter @rental-peshawar/api build

# Runner Stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install openssl for Prisma and curl for health checks
RUN apk add --no-cache openssl curl

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules

USER nestjs

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/v1/health || exit 1

CMD ["node", "apps/api/dist/src/main.js"]
