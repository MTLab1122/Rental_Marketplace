# Disaster Recovery & Business Continuity Plan — Rental Peshawar

**Recovery Time Objective (RTO):** < 30 Minutes  
**Recovery Point Objective (RPO):** < 5 Minutes

---

## 1. Backup Regimes

1. **Automated Database Backups (PostgreSQL):**
   - **Continuous WAL Archiving:** Point-In-Time Recovery (PITR) enabled via continuous Write-Ahead Log archiving to S3.
   - **Daily Full Logical Dumps:** Compressed `pg_dump` executed every 24 hours at 03:00 PKT and synced to multi-region offsite storage.
2. **Object Storage Backups (MinIO / S3):**
   - Versioning enabled on property media and CNIC document buckets.
   - Cross-region asynchronous replication.
3. **Configuration & Secrets:**
   - Terraform / Docker Compose infrastructure-as-code maintained in version control.
   - Secrets managed via encrypted environment vaults.

---

## 2. Disaster Recovery Scenarios & Procedures

### Scenario A: Database Corruption or Primary Host Failure

1. **Detect:** Automated healthcheck alert triggers via Prometheus / PagerDuty.
2. **Promote:** Promote the standby PostgreSQL read replica to primary.
3. **Update Connection String:** Update `DATABASE_URL` in container orchestration or DNS alias.
4. **Verify Integrity:** Run `npx prisma migrate status` to confirm schema synchronization.
5. **Resume Traffic:** Shift load balancer routing back to active cluster.

### Scenario B: Accidental Data Deletion / Ransomware

1. Initiate PITR restore to an isolated target instance using the latest clean WAL timestamp prior to the incident.
2. Verify geospatial postgis tables and user profiles.
3. Repoint backend API to the restored instance.

### Scenario C: Redis Cache Crash

1. API handles Redis disconnections gracefully by falling back to direct database verification for critical paths.
2. Redis container auto-restarts (`restart: always`) and reconstructs key state from append-only file (`appendonly.aof`).
