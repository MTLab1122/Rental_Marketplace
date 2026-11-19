# Peshawar Rental Marketplace — Web Application Security Standards

Phase 16: Security Hardening (Next.js Public Portal & Admin Console)

This document establishes web client security requirements, session isolation, and defense-in-depth controls against browser-based attack vectors.

---

## 1. Cross-Site Scripting (XSS) Defenses

- **Automatic React JSX Escaping:** React automatically escapes all string outputs by default, mitigating traditional reflective XSS.
- **Dangerous HTML Sanitization:** Any usage of `dangerouslySetInnerHTML` is prohibited unless explicitly sanitized through `DOMPurify` on the client and `sanitizeHtml` on the backend.
- **Content Security Policy (CSP):**
  ```http
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https://cdn.rentalpeshawar.pk; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://api.rentalpeshawar.pk wss://api.rentalpeshawar.pk; frame-ancestors 'none';
  ```

---

## 2. Cross-Site Request Forgery (CSRF) Defenses

- **Strict Bearer Authorization:** State-changing requests (`POST`, `PATCH`, `DELETE`) require custom HTTP headers (`Authorization: Bearer <token>`, `Content-Type: application/json`), which cannot be submitted by cross-origin HTML form elements.
- **Cookie Flags:** Where session tokens are stored in browser cookies:
  - `HttpOnly`: Inaccessible to JavaScript via `document.cookie`.
  - `Secure`: Transmitted strictly over HTTPS connections.
  - `SameSite=Lax`: Prevents cross-site submission on cross-origin requests.

---

## 3. Prototype Pollution Defenses

- Deep cloning and object assignment use hardened assignment routines (`Object.assign(Object.create(null), ...)`) or explicit object spread to prevent `__proto__`, `constructor`, or `prototype` property overrides.
