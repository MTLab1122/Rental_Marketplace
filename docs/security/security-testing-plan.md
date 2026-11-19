# Peshawar Rental Marketplace — Security Testing Plan & Verification

Phase 16: Security Hardening & Continuous Security Verification

This document specifies the automated and manual testing strategies that validate application-layer hardening.

---

## 1. Automated Security Test Suite Coverage

The automated test suite (`apps/api/src/common/security/security-hardening.spec.ts`) covers:

1. **Authorization & IDOR Protection:**
   - Tenant cannot modify another tenant's profile or favorites.
   - Landlord cannot modify or delete a property owned by another landlord.
   - Inquiries, messages, and bookings are accessible ONLY to the verified participants.
   - Admin audit logs reject modification and deletion commands.
2. **Privilege Escalation:**
   - Regular users cannot perform moderator or administrative actions.
   - Moderators cannot invoke Super Admin role changes or ledger wipes.
3. **Password Policy & Authentication:**
   - Password strength requires $\ge 12$ characters, allowing $64+$ characters without truncation.
   - Timing attack mitigation: password verification takes constant-time responses.
4. **Input Sanitization & Injection Defense:**
   - XSS script tags and event handlers are stripped.
   - CSV formula injection characters (`=`, `+`, `-`, `@`) are escaped.
   - SSRF validator rejects private RFC1918 subnets and AWS metadata addresses (`169.254.169.254`).
5. **Magic Byte Image Validation:**
   - Detects authentic JPEG, PNG, and WebP byte streams; rejects `.php`, `.exe`, or fake extensions.
6. **Abuse & Velocity Enforcement:**
   - Rejects submissions exceeding velocity quotas.

---

## 2. Security CI/CD Gateways

- **Static Application Security Testing (SAST):** `eslint-plugin-security` run via `pnpm lint`.
- **Dependency Vulnerability Scanning:** `pnpm audit --production` in deployment pipeline.
- **Secret Scanning:** Git pre-commit hooks scan for API keys, private certificates, and secrets.
