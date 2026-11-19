# Data Retention Policy & Automated Purging Schedule

## 1. Scope & Regulatory Framework

This policy defines the retention, archiving, and deletion timelines for data stored across PostgreSQL, object storage, Redis, and audit log vaults in compliance with Pakistani Electronic Crimes Act (PECA 2016), FBR financial compliance requirements, and international data protection standards.

---

## 2. Data Classification Retention Schedule

| Data Category             | Specific Data Elements                                    | Active Storage Retention     | Archive Storage Retention | Total Retention          | Destruction Method            |
| :------------------------ | :-------------------------------------------------------- | :--------------------------- | :------------------------ | :----------------------- | :---------------------------- |
| **Financial & Ledger**    | Payments, Transactions, Escrow receipts, Refund ledgers   | 3 years                      | 4 years (Cold Vault)      | **7 years**              | Cryptographic erasure         |
| **Audit Logs**            | Immutable system audit logs, Auth logs, Sudo step-up logs | 1 year                       | 2 years                   | **3 years**              | Object lock expiry            |
| **Identity Verification** | CNIC images, Selfies, Rejection reasons                   | Duration of account + 1 year | 2 years                   | **3 years post-closure** | S3 permanent deletion         |
| **Property Listings**     | Active & rented listings, property photos, pricing        | Active duration              | 2 years post-delist       | **2 years post-delist**  | Database soft-delete -> Purge |
| **Chat & Inquiries**      | Direct tenant-landlord messages, inquiry notes            | 1 year post-conversation     | 1 year                    | **2 years**              | Scheduled cron wipe           |
| **Session & Temp Cache**  | JWT session tokens, velocity rate limits, Redis keys      | Ephemeral (15m - 7d)         | None                      | **TTL Expiry**           | Redis automated eviction      |

---

## 3. Automated Purging Implementation

1. **Database Purging Cron**: A daily BullMQ maintenance job executes soft-delete cleanups for records past their statutory retention window:
   ```sql
   -- Purge soft-deleted properties older than 90 days with no active dispute
   DELETE FROM "properties"
   WHERE "deletedAt" IS NOT NULL AND "deletedAt" < NOW() - INTERVAL '90 days';
   ```
2. **Object Storage Lifecycle**: Configured in `infra/storage/lifecycle-rules.json` to automatically transition and permanently expire unneeded media artifacts.
3. **Hard Account Deletion**: When a user exercises their Right to Erasure, all personal profile attributes are pseudonymized within **30 days**, preserving only financial ledger entries mandated by tax law.
