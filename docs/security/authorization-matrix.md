# Peshawar Rental Marketplace — Centralized Authorization Matrix

Phase 16: Security Hardening & Zero-Trust Access Control (RBAC & ABAC)

This document establishes the non-negotiable authorization rules enforced across the service layer and controller guards. Access is **deny-by-default**.

---

## 1. Role Definitions

- **TENANT:** Registered searcher seeking accommodation (Student or Family profile).
- **LANDLORD:** Property owner or authorized property manager in Peshawar.
- **SUPPORT:** Platform customer support agent (read-only investigations, report triage).
- **MODERATOR:** Content and review moderator (approves/rejects listings and user reports).
- **ADMIN:** Operational administrator (manages users, localities, verification queues).
- **SUPER_ADMIN:** Platform executive administrator (role assignment, security policies, ledger audit).

---

## 2. Resource Access Control Matrix

| Resource & Operation            | TENANT | LANDLORD |   SUPPORT   |  MODERATOR  |    ADMIN     | SUPER_ADMIN  | Enforced Rule & Policy                                                    |
| :------------------------------ | :----: | :------: | :---------: | :---------: | :----------: | :----------: | :------------------------------------------------------------------------ |
| **Profile: View Own**           |   ✅   |    ✅    |     ✅      |     ✅      |      ✅      |      ✅      | Allowed for authenticated owner (`sub === userId`).                       |
| **Profile: View Other**         |   ❌   |    ❌    | 👁️ (Masked) | 👁️ (Masked) |      ✅      |      ✅      | Regular users cannot inspect arbitrary user profiles.                     |
| **Profile: Update Own**         |   ✅   |    ✅    |     ❌      |     ❌      |      ❌      |      ❌      | Only owner can update details. Phone/email change revokes refresh tokens. |
| **Property: Create**            |   ❌   |    ✅    |     ❌      |     ❌      |      ✅      |      ✅      | Requires verified landlord profile. Coordinates within Peshawar bounds.   |
| **Property: Edit Own**          |   ❌   |    ✅    |     ❌      |     ❌      |      ✅      |      ✅      | Landlord can edit only properties where `landlordId === sub`.             |
| **Property: Edit Other**        |   ❌   |    ❌    |     ❌      |     ❌      |      ❌      |      ❌      | **STRICTLY FORBIDDEN**. Returns 404 (does not leak existence).            |
| **Property: Delete Own**        |   ❌   |    ✅    |     ❌      |     ❌      |      ✅      |      ✅      | Soft-deletes listing (`deletedAt = now`).                                 |
| **Property: Approve / Reject**  |   ❌   |    ❌    |     ❌      |     ✅      |      ✅      |      ✅      | Moderators & Admins only. Records audit trail with reviewer ID.           |
| **Inquiry: Create**             |   ✅   |    ❌    |     ❌      |     ❌      |      ❌      |      ❌      | Tenants only. Max 15 inquiries/hr rate limit.                             |
| **Inquiry: View Own**           |   ✅   |    ✅    |     👁️      |     👁️      |      ✅      |      ✅      | Caller must be the inquiring tenant OR the property landlord.             |
| **Inquiry: View Other**         |   ❌   |    ❌    |     ❌      |     ❌      |      ❌      |      ❌      | **FORBIDDEN (IDOR Protected)**. Returns 404.                              |
| **Message: Send in Thread**     |   ✅   |    ✅    |     ❌      |     ❌      |      ❌      |      ❌      | User must be an active participant in `ConversationParticipant`.          |
| **Booking: Create Request**     |   ✅   |    ❌    |     ❌      |     ❌      |      ❌      |      ❌      | Tenants only after accepted inquiry.                                      |
| **Booking: Accept / Decline**   |   ❌   |    ✅    |     ❌      |     ❌      |      ✅      |      ✅      | Landlord owning the property only.                                        |
| **Payment: Refund**             |   ❌   |    ❌    |     ❌      |     ❌      | 🔑 (Step-Up) | 🔑 (Step-Up) | Requires step-up TOTP verification for financial transactions.            |
| **Audit Logs: View**            |   ❌   |    ❌    |     ❌      |     ❌      |      ✅      |      ✅      | Admins & Super Admins only. Read-only.                                    |
| **Audit Logs: Modify / Delete** |   ⛔   |    ⛔    |     ⛔      |     ⛔      |      ⛔      |      ⛔      | **ABSOLUTELY FORBIDDEN FOR ALL ROLES (IMMUTABLE LOGS)**.                  |
| **Roles: Assign / Revoke**      |   ❌   |    ❌    |     ❌      |     ❌      |      ❌      | 🔑 (Step-Up) | Super Admin only with MFA challenge.                                      |

---

## 3. Service Layer Ownership Enforcement Principle

Route guards (e.g., `@Roles()`, `JwtAuthGuard`) only verify identity and permission levels. They **do not protect against IDOR (Insecure Direct Object References)**.

Every domain service method verifies entity ownership directly against the database:

```typescript
const property = await this.prisma.property.findUnique({ where: { id } });
if (!property || (property.landlordId !== currentUserId && !isAdmin)) {
  throw new NotFoundException(`Property with ID ${id} not found`); // 404 prevents resource enumeration
}
```
