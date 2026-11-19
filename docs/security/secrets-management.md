# Secrets Management & Key Rotation Architecture

## 1. Principles of Secrets Management

1. **Zero Secret Persistence in VCS**: No plaintext secrets, API keys, private certificates, or production connection strings may ever be committed to Git.
2. **Dynamic Ingestion**: Secrets are injected as environment variables at container launch via AWS Secrets Manager, HashiCorp Vault, Doppler, or encrypted SOPS files.
3. **Least Privilege by Role**: Application runtime containers only receive credentials required for their domain.
4. **Automated Secret Rotation**: Every credential class operates on an established rotation lifecycle.

---

## 2. Secrets Inventory & Rotation Schedule

| Secret Key                | Purpose                            | Rotation Frequency | Rotation Mechanism                          | Downtime Impact     |
| :------------------------ | :--------------------------------- | :----------------- | :------------------------------------------ | :------------------ |
| `JWT_ACCESS_SECRET`       | Signing user access tokens         | 90 days            | Dual-key verification grace period (24 hrs) | Zero (Key rollover) |
| `JWT_REFRESH_SECRET`      | Signing refresh tokens             | 90 days            | Immediate re-signing, old tokens revoked    | Zero                |
| `DATABASE_URL` (app_user) | PostgreSQL application credentials | 60 days            | Create temp user -> swap -> drop old        | Zero                |
| `DATABASE_URL` (migrator) | Schema migration credentials       | 60 days            | CI/CD secret update                         | Zero                |
| `REDIS_PASSWORD`          | In-memory cache authentication     | 90 days            | Redis `ACL SETUSER` dual password           | Zero                |
| `S3_SECRET_ACCESS_KEY`    | Media bucket access                | 90 days            | IAM dual access key rollover                | Zero                |
| `GOOGLE_MAPS_API_KEY`     | Peshawar geocoding & maps          | 180 days           | Dual API key in Google Cloud Console        | Zero                |
| `FCM_SERVER_KEY`          | Mobile push notifications          | 180 days           | Firebase Service Account rollover           | Zero                |
| `SMTP_PASSWORD`           | Transactional email delivery       | 90 days            | AWS SES / SendGrid API key swap             | Zero                |

---

## 3. Secret Rotation Procedure (Runbook)

### A. JWT Secret Rollover

```bash
# 1. Generate new 64-character high-entropy secret
NEW_JWT_SECRET=$(openssl rand -hex 32)

# 2. Update secondary verification secret in Secrets Manager
aws secretsmanager update-secret --secret-id rental/prod/jwt_previous --secret-string "$CURRENT_JWT_SECRET"
aws secretsmanager update-secret --secret-id rental/prod/jwt_access --secret-string "$NEW_JWT_SECRET"

# 3. Trigger rolling deployment of API instances
kubectl rollout restart deployment/rental-api -n production
```

### B. PostgreSQL Password Rotation

```sql
-- 1. Create temporary application role
CREATE ROLE app_user_next WITH LOGIN PASSWORD 'NextSecurePass2026!';
GRANT app_user TO app_user_next;

-- 2. Update backend secret in Secrets Manager to 'app_user_next'
-- 3. Restart backend service pool to bind to new role
-- 4. Verify healthy traffic, then deprecate old user
DROP ROLE app_user_prev;
```

---

## 4. Secret Leakage Detection & Alerting

1. **Pre-commit Hooks**: `gitleaks` and `lint-staged` inspect every git commit locally.
2. **CI Pipeline Scanning**: GitHub Actions workflow fails build immediately if high-entropy strings or private keys match regex patterns.
3. **Log Sanitization**: NestJS Pino logger masks fields named `password`, `token`, `secret`, `authorization`, `cnic`, `phone`.
