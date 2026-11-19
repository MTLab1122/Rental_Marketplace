# Pre-Deployment Security Review & Architecture Checklist

## 1. Feature Pre-Deployment Verification Checklist

Before any feature or schema modification is promoted to production, the engineering and security leads must verify each of the following controls:

### A. Authentication & Session Management

- [ ] Authentication required for all non-public endpoints (`JwtAuthGuard`).
- [ ] No JWTs transmitted via URL query parameters.
- [ ] Passwords validate against 12-character minimum and complexity policy.
- [ ] Refresh tokens rotate upon single-use; reuse triggers family revocation.
- [ ] TOTP Step-Up required for high-impact admin operations.

### B. Authorization & Data Isolation (IDOR Defense)

- [ ] Horizontal authorization checks executed at service layer (`PolicyEngineService`).
- [ ] Resource existence obscured on unauthorized queries (`404 Not Found`).
- [ ] Eligibility segregation strictly enforced (Students cannot view family-only units; Families cannot view student-only hostels).
- [ ] Audit logs unconditionally immutable across all roles.

### C. Input Sanitization & Attack Defense

- [ ] Class-validator DTO allowlists reject untrusted attributes (`whitelist: true, forbidNonWhitelisted: true`).
- [ ] HTML sanitization strips `<script>` and `javascript:` URIs.
- [ ] CSV export fields escaped against formula injection (`=`, `+`, `-`, `@`).
- [ ] SSRF validator blocks loopback, cloud metadata (`169.254.169.254`), and RFC1918 subnets.
- [ ] File uploads validate authentic magic bytes (`FF D8 FF` JPEG, `89 50 4E 47` PNG).
- [ ] Coordinates validated within Peshawar municipal boundaries.

### D. Infrastructure & Secrets Hygiene

- [ ] Zero hardcoded credentials, API keys, or private keys in source code.
- [ ] Environment safety guards reject dev secrets in production containers.
- [ ] Containers execute as unprivileged non-root user (`UID 1001`).
- [ ] Database and Redis ports isolated on private network with no public bindings.
- [ ] All automated unit, security, and typecheck suites pass 100%.
