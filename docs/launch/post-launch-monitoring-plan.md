# Peshawar Rental Marketplace: Post-Launch Monitoring & Observability Plan (v1.0.0-GA)

## 1. Monitoring Scope & Objectives

This document establishes the post-launch telemetry, synthetic monitoring, alerting rules, and observability health checks for the first 30 days of production operations.

The primary objective is proactive anomaly detection to guarantee the 99.9% availability SLO and protect user trust across Peshawar.

---

## 2. Real-Time Telemetry & Metric Baselines

### A. Application Performance Metrics (APM)

- **Request Volume (RPS)**: Measured across `/api/v1/properties`, `/api/v1/auth`, and `/api/v1/inquiries`.
- **Latency Percentiles**: Continuous p50, p95, and p99 tracking.
  - Alert Threshold: p95 > 500ms for 3 consecutive 1-minute intervals.
- **HTTP Error Rate (5xx)**:
  - Alert Threshold: 5xx > 0.1% over 5-minute rolling window triggers P2 alert; > 0.5% triggers P1 page.

### B. Database & Cache Observability

- **PostgreSQL**:
  - Connection Pool Utilization: Alert if active connections exceed 80% of `max_connections` (160/200).
  - Slow Query Log: Queries exceeding 250ms logged and alerted in Slack `#db-performance`.
  - Replication Lag: Alert if streaming replica lag exceeds 50MB or 15 seconds.
  - Disk Space: Alert if database volume exceeds 75% capacity.
- **Redis 7 Cluster**:
  - Memory Usage: Alert if memory exceeds 75% of `maxmemory` limit.
  - Eviction Rate: Alert if cache evictions occur on non-volatile keys.
  - Client Connections: Alert if active socket connections exceed 5,000.

### C. Message Queues & Event Outbox (BullMQ)

- **Outbox Queue Depth**: Alert if pending events in transactional outbox exceed 500 items.
- **Dead-Letter Queue (DLQ)**: Alert on ANY job moved to DLQ (immediate notification to on-call engineer).
- **Processing Latency**: Alert if notification queue processing lag exceeds 30 seconds.

---

## 3. Synthetic User Journey Monitoring

Automated synthetic probes run from Karachi, Lahore, and Islamabad data centers every 5 minutes:

1. **Student Discovery Journey**:
   - Query: `GET /api/v1/properties?tenantType=STUDENT&localityId=university-town`
   - Assertions: Status `200 OK`, latency < 400ms, all returned items have `eligibility == "STUDENTS_ONLY"`.
2. **Family Discovery Journey**:
   - Query: `GET /api/v1/properties?tenantType=FAMILY&localityId=hayatabad`
   - Assertions: Status `200 OK`, latency < 400ms, all returned items have `eligibility == "FAMILIES_ONLY"`.
3. **Peshawar Boundary Barrier Probe**:
   - Post simulated property with Islamabad coordinates (33.684, 73.047).
   - Assertion: Status `400 Bad Request` with `Property is outside Peshawar municipal boundary`.
4. **Health & Ready Probes**:
   - Ping `/api/v1/health` and `/api/v1/ready` every 30 seconds.

---

## 4. Alert Routing & Escalation Matrix

```
+-------------------------------------------------------------------------------------------------+
|                                 ALERT ROUTING ARCHITECTURE                                      |
+-------------------------------------------------------------------------------------------------+
|  [Prometheus / Sentry] ---> [Alertmanager]                                                      |
|                                    |                                                            |
|          +-------------------------+-------------------------+                                  |
|          | (P1: High Severity)     | (P2: Warning)           | (P3: Info/Cosmetic)              |
|          v                         v                         v                                  |
|   [PagerDuty Phone Page]     [Slack #alerts-prod]       [Daily Digest Email]                    |
|   SRE Lead & Architect       On-Call Engineer           Development Team                        |
+-------------------------------------------------------------------------------------------------+
```

---

## 5. Daily Production Health Review Schedule

During the first 14 days post-launch, the SRE and Product leads will conduct a daily 15-minute standup at 09:30 AM PKT to review:

1. 24-hour availability percentage and error budget consumed.
2. Latency percentiles across search and messaging.
3. Total new verified landlords and student/family registrations.
4. Moderation backlog status and average review turnaround time.
5. Sentry error triage and open customer support tickets.
