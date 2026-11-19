# Access Review Policy & Identity Governance

## 1. Principle of Minimum Standing Privilege

All user accounts, API tokens, and administrative roles operate under the principle of least privilege. Permissions are granted based on verified business need and must be recertified periodically.

---

## 2. Access Review Cadence

| Access Tier                       | Scope                                                                           | Review Cadence | Reviewer         | Action on Non-Certification           |
| :-------------------------------- | :------------------------------------------------------------------------------ | :------------- | :--------------- | :------------------------------------ |
| **Tier 1: High Privilege**        | `SUPER_ADMIN`, AWS Root/IAM Admin, Database Superusers, Production Bastion SSH. | **Monthly**    | CISO & CTO       | Immediate revocation                  |
| **Tier 2: Operational Staff**     | `ADMIN`, `MODERATOR`, `SUPPORT`, Read-Only Analytics.                           | **Quarterly**  | Department Heads | Downgrade / Revocation                |
| **Tier 3: Third-Party / Vendors** | External auditors, contracted penetration testers, API partners.                | **Monthly**    | Security Lead    | Immediate termination on contract end |

---

## 3. Stale Account & Inactivity Policy

1. **90-Day Inactivity Deactivation**: Any administrative or staff account inactive for $> 90\text{ days}$ is automatically disabled by the identity provider.
2. **Immediate Offboarding SLA**: When an employee or contractor departs the organization, IT and HR procedures mandate de-provisioning of all SSO, GitHub, VPN, and database credentials within **4 hours** of exit notification.
3. **Role Change Deprovisioning**: When staff transfer roles (e.g., from Customer Support to Marketing), legacy permissions are revoked immediately prior to new role assignment.

---

## 4. Separation of Duties (SoD) Controls

- Developers cannot deploy directly to production without passing automated CI checks and obtaining peer review.
- Support staff can view inquiries and user reports but cannot modify rental agreements or execute financial refunds.
- Moderators can suspend listings and hide reviews but cannot change system settings or view database connection secrets.
