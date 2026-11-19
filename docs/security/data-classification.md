# Peshawar Rental Marketplace — Data Classification Policy

Phase 16: Security Hardening & Information Security Standards

This policy governs the classification, storage, transmission, encryption, and lifecycle retention of all information assets across the platform.

---

## 1. Classification Tiers

| Classification Level                      | Definition                                                                        | Examples                                                                                              | Storage Standard                                                                      | Transmission Standard                                   | Retention / Destruction                                                                             |
| :---------------------------------------- | :-------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------ | :------------------------------------------------------ | :-------------------------------------------------------------------------------------------------- |
| **Level 1: Public**                       | Information approved for unrestricted public distribution without harm.           | Approved listing titles, public photos, amenity lists, locality boundaries, platform FAQs.            | PostgreSQL / S3 CDN. Read-only publicly.                                              | HTTPS (TLS 1.3), CDN edge caching.                      | Indefinite or until listing deletion.                                                               |
| **Level 2: Internal**                     | Operational data intended for platform staff and system logging.                  | System metrics, queue health statistics, aggregated analytics, application logs (sanitized).          | Elasticsearch / Redis / PostgreSQL.                                                   | TLS 1.3, internal Docker network only.                  | 90 days for operational logs.                                                                       |
| **Level 3: Confidential**                 | Sensitive business or user data requiring authenticated authorization.            | Unlisted property drafts, tenant inquiries, private chat messages, lease agreements, search history.  | PostgreSQL with AES-256 at rest. Authorized queries only.                             | TLS 1.3 encrypted, JWT-authenticated.                   | Retained during active account lifecycle; deleted upon GDPR erasure.                                |
| **Level 4: Restricted (PII & Financial)** | Critical regulatory, financial, or identity information carrying legal liability. | Pakistani CNIC numbers, CNIC front/back scans, verification selfies, bank account numbers, passwords. | PostgreSQL encrypted at rest; CNIC masked (`XXXXX-XXXXXXX-1`), MinIO private buckets. | TLS 1.3 mandatory; never sent to external AI providers. | Verification images deleted after 1 year of verification approval; ledger kept 7 years for tax law. |

---

## 2. PII Redaction & Masking Rules

1. **Pakistani CNIC Numbers:**
   - Database storage: Stored in encrypted column or masked format (`17301-*******-1`).
   - Client display: Always displayed masked except to verified admins performing manual identity audits.
   - Logs & AI endpoints: Strictly filtered by `PiiMaskerUtil` before output.
2. **Phone Numbers & WhatsApp Links:**
   - Never displayed publicly on unauthenticated search or listing index pages.
   - Contact reveal is strictly gated: revealed ONLY when a landlord formally accepts a tenant's inquiry (`InquiryStatus.ACCEPTED`).
3. **Password Credentials:**
   - Never stored in plaintext.
   - Salted and hashed using `bcrypt` (12 rounds) with minimum 12-character complexity constraint.
   - Plaintext passwords strictly omitted from all application logs, error traces, and DTOs.
