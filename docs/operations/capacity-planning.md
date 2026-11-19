# Capacity Planning, Growth Forecasting & Scaling Runbook

## 1. Growth Modeling & Workload Forecasting

This document projects system demand, storage growth, database connection limits, and operational costs across 1x (Current GA baseline), 2x, 5x, and 10x scaling milestones.

---

## 2. Multi-Tier Workload & Resource Projections

| Metric / Resource                    | 1x Baseline (Current GA) | 2x Growth (Month 3) | 5x Growth (Month 6) | 10x Scale (Year 1) | Scaling Action Trigger               |
| :----------------------------------- | :----------------------- | :------------------ | :------------------ | :----------------- | :----------------------------------- |
| **Registered Tenants**               | 2,500                    | 5,000               | 12,500              | 25,000             | Index tuning on tenant search        |
| **Active Landlords**                 | 350                      | 700                 | 1,750               | 3,500              | Landlord verification team scaling   |
| **Active Property Listings**         | 600                      | 1,200               | 3,000               | 6,000              | Locality polygon partitioning        |
| **Search Queries / Day**             | 18,000                   | 36,000              | 90,000              | 180,000            | Redis cluster sharding               |
| **Concurrent WebSocket Connections** | 250                      | 500                 | 1,250               | 2,500              | Redis adapter horizontal scaling     |
| **Daily Inquiries & Messages**       | 1,200                    | 2,400               | 6,000               | 12,000             | Outbox batch size expansion          |
| **Database Storage (PostgreSQL)**    | 12 GB                    | 25 GB               | 65 GB               | 140 GB             | Storage auto-expansion threshold 75% |
| **Redis Cache Memory**               | 1.2 GB                   | 2.4 GB              | 6.0 GB              | 12.0 GB            | Memory cap trigger at 75%            |
| **Media / Image Storage**            | 45 GB                    | 90 GB               | 225 GB              | 450 GB             | S3 / Cloudinary lifecycle rules      |

---

## 3. Capacity Thresholds & Automated Scaling Triggers

```
+-------------------------------------------------------------------------------------------------+
|                                 SCALING TRIGGER WORKFLOW                                        |
+--------------------------+-----------------------+----------------------------------------------+
| RESOURCE                 | WARNING (70%)         | ACTION TRIGGER (80%)                         |
+--------------------------+-----------------------+----------------------------------------------+
| Database CPU Utilization | Alert SRE on Slack    | Spin up PostgreSQL read replica              |
| DB Connection Pool       | PgBouncer pool at 140 | Increase max pool size; scale worker pods    |
| Redis Memory Usage       | Memory at 3.0 GB      | Flush transient query keys; upgrade instance |
| BullMQ Queue Backlog     | > 250 pending jobs    | Double concurrency factor on worker pods     |
| Node.js Event Loop Lag   | > 45 ms lag           | Scale container replica count horizontally   |
+--------------------------+-----------------------+----------------------------------------------+
```

### Scaling Runbooks

#### Trigger 1: PostgreSQL Read Replica Activation

When database CPU exceeds 70% sustained for 15 minutes or read queries exceed 1,200 QPS:

1. Provision read-only replica in secondary availability zone.
2. Update `DATABASE_READ_URL` in environment configuration.
3. Configure Prisma client multi-read routing: write traffic directed to primary, read searches to replica.

#### Trigger 2: BullMQ Asynchronous Worker Scale-Out

When pending background tasks (notifications, geofencing audits, emails) exceed 500 items:

1. Increase worker replica count in Docker Compose / Kubernetes:
   ```bash
   docker compose -f docker-compose.scale.yml up -d --scale api-worker=4
   ```
2. Verify queue latency drops below 10 seconds.

---

## 4. Cost Forecasting & Infrastructure Unit Economics

| Component                         | 1x Current ($/mo) | 2x Scale ($/mo) | 5x Scale ($/mo) | 10x Scale ($/mo) | Optimization Lever                    |
| :-------------------------------- | :---------------- | :-------------- | :-------------- | :--------------- | :------------------------------------ |
| **Cloud Compute (API & Web)**     | $65               | $110            | $220            | $400             | Spot / Reserved instances             |
| **Database (Managed PostgreSQL)** | $45               | $85             | $160            | $280             | Connection pooling & read replicas    |
| **Redis Cluster**                 | $25               | $35             | $65             | $110             | Cache eviction policy tuning          |
| **Object Storage & CDN**          | $20               | $35             | $75             | $140             | Image WebP/AVIF compression           |
| **Telephony, SMS & WhatsApp**     | $30               | $60             | $150            | $300             | Frequency capping & in-app fallback   |
| **Total Monthly Spend (USD)**     | **$185**          | **$325**        | **$670**        | **$1,230**       | —                                     |
| **Total Monthly Spend (PKR)**     | ~PKR 51,000       | ~PKR 90,000     | ~PKR 185,000    | ~PKR 340,000     | Covered by Pro Landlord subscriptions |
