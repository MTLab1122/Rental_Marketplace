# Peshawar Rental Marketplace — API Security Architecture

Phase 16: Security Hardening & Zero-Trust API Defense

This document specifies API-layer defense mechanisms, security headers, input sanitization, and SSRF prevention.

---

## 1. Security Headers & TLS Enforcements

All HTTP responses from the API cluster include hardened OWASP-recommended headers:

```http
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'; frame-ancestors 'none';
Permissions-Policy: camera=(), microphone=(), geolocation=(self)
```

---

## 2. Server-Side Request Forgery (SSRF) Prevention

Any endpoint receiving an external URL (e.g., webhook subscriptions, remote image URLs) must pass `validateSafeExternalUrl`:

- Protocol must be strictly `https:` (or `http:` in development).
- Resolves hostname via DNS and validates resolved IP against RFC1918 private subnets:
  - `10.0.0.0/8`
  - `172.16.0.0/12`
  - `192.168.0.0/16`
  - `127.0.0.0/8` (Loopback)
  - `169.254.0.0/16` (AWS / Cloud Instance Metadata Services)
  - `::1` and `fc00::/7` (IPv6 loopback & ULA)
- Requests resolving to blocked subnets are immediately rejected with `400 Bad Request`.

---

## 3. Strict Input & Output Sanitization

- **Allowlist DTO Validation:** `ValidationPipe` configured with `whitelist: true`, `forbidNonWhitelisted: true`, and `transform: true`.
- **Stored XSS Prevention:** All rich text fields (property description, review comments, dispute messages) are sanitized via `sanitizeHtml` to strip executable tags (`<script>`, `<iframe>`, `onclick=`, etc.).
- **CSV / Formula Injection:** Administrative export endpoints prepend an apostrophe (`'`) to any cell value beginning with `=`, `+`, `-`, or `@`.
