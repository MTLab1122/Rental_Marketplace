# Container and Image Security Standards

## 1. Container Hardening Principles

All containers in the Rental Peshawar ecosystem are built and executed according to the CIS Docker Benchmark and Kubernetes Hardening Guidance:

1. **Minimal Base Images**: Production images inherit exclusively from `alpine:3.20` or Google Distroless images (`gcr.io/distroless/nodejs20-debian12`).
2. **Non-Root Execution**: Containers run as unprivileged users (`UID 1001` or `UID 10001`). Root execution (`UID 0`) is prohibited in staging and production.
3. **Immutable Root Filesystem**: Runtime containers operate with `read_only: true`. Any ephemeral writes (such as temp files) are directed to in-memory `tmpfs` mounts.
4. **Dropped Linux Capabilities**: All default capabilities are explicitly dropped (`cap_drop: [ALL]`). No container retains `CAP_SYS_ADMIN` or `CAP_NET_RAW`.
5. **No New Privileges**: `security_opt: ["no-new-privileges:true"]` prevents privilege escalation via setuid/setgid binaries.

---

## 2. Container Resource Constraints (DoS Defense)

Uncontrolled container resources can lead to host exhaustion. Every production service configures strict memory and CPU quotas:

| Container Service   | CPU Request | CPU Limit       | Memory Request | Memory Limit | Ephemeral Storage Limit |
| :------------------ | :---------- | :-------------- | :------------- | :----------- | :---------------------- |
| **rental-api**      | 500m        | 2000m (2 cores) | 512Mi          | 2048Mi       | 1024Mi                  |
| **rental-web**      | 250m        | 1000m (1 core)  | 256Mi          | 1024Mi       | 512Mi                   |
| **rental-admin**    | 250m        | 1000m (1 core)  | 256Mi          | 1024Mi       | 512Mi                   |
| **rental-postgres** | 1000m       | 4000m (4 cores) | 2048Mi         | 8192Mi       | Volume backed           |
| **rental-redis**    | 250m        | 1000m (1 core)  | 256Mi          | 1024Mi       | Volume backed           |

---

## 3. Production Dockerfile Hardening Template

```dockerfile
# Multi-stage build pattern
FROM node:20-alpine AS builder
WORKDIR /app
# Build artifacts...

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Install minimal required libraries
RUN apk add --no-cache openssl curl && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

# Copy compiled artifacts only
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules

# Run as non-root user
USER nestjs

# Explicit Healthcheck
HEALTHCHECK --interval=15s --timeout=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/v1/health || exit 1

EXPOSE 3000
CMD ["node", "dist/main.js"]
```

---

## 4. Image Vulnerability Scanning & SBOM

1. **Trivy Image Scan**: Every built image is scanned in CI/CD. The build is terminated if `CRITICAL` or unpatched `HIGH` CVEs exist.
2. **Pinned Digests**: Production manifests refer to images by immutable SHA256 digest (`image@sha256:...`) to prevent tag mutation attacks.
3. **Software Bill of Materials (SBOM)**: CycloneDX / SPDX SBOM is generated during release tagging.
