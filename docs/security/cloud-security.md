# Cloud Security, Object Storage & IAM Governance

## 1. Cloud Architecture & Identity Model

The Rental Peshawar platform utilizes cloud infrastructure adhering to the principle of least privilege, strict resource boundary isolation, and immutable audit trails across AWS, GCP, and self-hosted environments.

---

## 2. Object Storage Security (S3 & MinIO)

### Bucket Architecture & Classification

To prevent accidental public exposure of private identity verifications, media is partitioned into two distinct bucket pathways:

```
Bucket: rental-peshawar-media
  ├── public-properties/        -> Public read via CDN, NO direct S3 list, authenticated write only
  └── private-verifications/   -> Strictly PRIVATE, NO public read/list, accessible only via 15-min signed URLs
```

### Security Policy Controls

1. **Public Write Blocked**: `s3:PutObject` from anonymous principals is denied unconditionally.
2. **Bucket Listing Blocked**: `s3:ListBucket` is prohibited for public/anonymous users to prevent content enumeration.
3. **Pre-Signed Uploads & Downloads**:
   - Uploads: Generated exclusively by `MediaService` with 15-minute expiration (`ExpiresIn: 900`).
   - Private Verification Reads: Admin access only, issuing short-lived signed URLs (15-minute TTL).
4. **Server-Side Encryption**:
   - `s3:PutObject` requires `x-amz-server-side-encryption` (`AES256` or `aws:kms`).
5. **CORS Restrictions**:
   - `AllowedOrigins`: Explicitly restricted to `https://rentalpeshawar.pk` and `https://admin.rentalpeshawar.pk`. Wildcards (`*`) are disallowed for private paths.

---

## 3. Cloud IAM Governance

1. **Role-Based Workload Identities (OIDC)**:
   - CI/CD deployment pipelines utilize GitHub Actions OIDC federation (`sts:AssumeRoleWithWebIdentity`) rather than long-lived static AWS access keys.
   - Container workloads assume IAM roles via EKS IAM Roles for Service Accounts (IRSA) or GCP Workload Identity.
2. **Least-Privilege Policy Example (Media Storage IAM Policy)**:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowAppReadWriteOwnPrefix",
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::rental-peshawar-media/*"
    },
    {
      "Sid": "DenyUnencryptedObjectUploads",
      "Effect": "Deny",
      "Action": "s3:PutObject",
      "Resource": "arn:aws:s3:::rental-peshawar-media/*",
      "Condition": {
        "StringNotEquals": {
          "s3:x-amz-server-side-encryption": "AES256"
        }
      }
    }
  ]
}
```

---

## 4. Media Lifecycle & Retention Policies

1. **Uncompleted Uploads**: Multipart uploads incomplete after 24 hours are automatically aborted.
2. **Rejected Documents**: Verifications rejected by moderators are moved to glacier/cold storage after 30 days and purged after 90 days.
3. **Soft-Deleted Properties**: Associated media marked as deleted is permanently expunged after a 30-day recovery window.
