# Security Policy & Access Control Matrix

## 1. Authentication Architecture

The platform enforces a zero-trust authentication pipeline:

- **Access Tokens**: Short-lived (15 minutes), signed with `HS256` or `RS256` using `JWT_ACCESS_SECRET`. Contains `sub` (userId), `role`, `tenantType`, and `jti`.
- **Refresh Tokens**: Long-lived (7 days), hashed with SHA-256 before storage in PostgreSQL.
- **Rotating Refresh Tokens & Replay Detection**:
  - Each refresh token belongs to a `familyId`.
  - When a refresh token is used, it is immediately revoked and replaced with a new token in the same family.
  - If an already-revoked refresh token is presented, the system triggers a **compromise alert**, revokes the entire `familyId`, and immediately terminates all active sessions for that user.

---

## 2. Role-Based Access Control (RBAC) Matrix

| Operation                     | TENANT (Student) | TENANT (Family) | LANDLORD        | ADMIN     | SUPER_ADMIN |
| ----------------------------- | ---------------- | --------------- | --------------- | --------- | ----------- |
| View `STUDENTS_ONLY` Listings | Allowed          | Forbidden       | Allowed (Own)   | Allowed   | Allowed     |
| View `FAMILIES_ONLY` Listings | Forbidden        | Allowed         | Allowed (Own)   | Allowed   | Allowed     |
| Create Property               | Forbidden        | Forbidden       | Allowed (Draft) | Allowed   | Allowed     |
| Update Own Property           | Forbidden        | Forbidden       | Allowed         | Allowed   | Allowed     |
| Approve / Reject Property     | Forbidden        | Forbidden       | Forbidden       | Allowed   | Allowed     |
| Modify Localities             | Forbidden        | Forbidden       | Forbidden       | Allowed   | Allowed     |
| Access Audit Logs             | Forbidden        | Forbidden       | Forbidden       | Read-Only | Full Access |
| Manage System Admins          | Forbidden        | Forbidden       | Forbidden       | Forbidden | Allowed     |

---

## 3. Input Validation & Injection Defense

- **Class Validator / Zod**: Strict runtime schema validation for every incoming request. Non-whitelisted fields are stripped or rejected.
- **Prisma Parameterized Queries**: All SQL execution is fully parameterized to prevent SQL injection.
- **XSS Prevention**: HTML stripping in user-generated content (property descriptions, chat messages).
- **CORS Policies**: Explicit origin whitelisting across web portals and mobile clients.

---

## 4. Rate Limiting Strategy

Protected by Redis-backed sliding window rate limiters:

- **Global API**: 120 requests/minute per IP.
- **Authentication Endpoints (`/auth/login`, `/auth/register`)**: 10 requests/minute per IP.
- **Search Queries**: 60 requests/minute per IP.
- Responses return `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `Retry-After`.
