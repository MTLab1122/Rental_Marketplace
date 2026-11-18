# Production Dockerfile for Rental Peshawar Web Application
FROM node:20-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@12.18.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages/ ./packages/
COPY apps/web/ ./apps/web/

RUN pnpm install --frozen-lockfile

RUN pnpm --filter @rental-peshawar/shared-types build
RUN pnpm --filter @rental-peshawar/config build
RUN pnpm --filter @rental-peshawar/web build

# Runner Stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

RUN apk add --no-cache curl
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/package.json ./
COPY --from=builder /app/apps/web/package.json ./apps/web/
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/web/node_modules ./apps/web/node_modules

USER nextjs

EXPOSE 3001

HEALTHCHECK --interval=20s --timeout=5s --retries=3 \
  CMD curl -f http://localhost:3001 || exit 1

CMD ["node_modules/.bin/next", "start", "apps/web", "-p", "3001"]
