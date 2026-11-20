# Phase 24: Observability, Telemetry & Alerting Certification

## 1. Executive Summary

This document certifies the end-to-end observability stack of the **Rental Peshawar** platform. The architecture implements the Three Pillars of Observability—Structured Logs, Distributed Tracing with Correlation IDs, and Prometheus Metrics—with automated alerting across infrastructure and business boundaries.

---

## 2. Observability Architecture & Components

```
+---------------------------------------------------------------------------------------------------+
|                                  OBSERVABILITY PIPELINE OVERVIEW                                  |
+---------------------------------------------------------------------------------------------------+
|  [HTTP Ingress / Nginx]  ---> Generates 'X-Request-ID' (UUIDv4)                                   |
|            |                                                                                      |
|            v                                                                                      |
|  [NestJS Application]    ---> Pino JSON Structured Logger (redacting passwords, tokens, CNICs)   |
|            |             ---> Prometheus Metrics Exporter (HTTP duration, SLO gauges, queues)    |
|            |             ---> Sentry Error Boundary (captures unhandled exceptions & breadcrumbs) |
|            |                                                                                      |
|            +-------------------+----------------------------+                                     |
|                                |                            |                                     |
|                                v                            v                                     |
|                      [Promtail & Loki]             [Prometheus & Grafana]                         |
|                      - Centralized log aggregation - 11 SLOs & Error Budgets                      |
|                      - Security audit trail        - Alertmanager (Slack/Email)                   |
+---------------------------------------------------------------------------------------------------+
```

---

## 3. Telemetry & Alerting Rules Matrix

| Alert Name                     | Monitored Metric / Condition                        | Evaluation Window | Severity  | Notification Channel        | Auto-Remediation / Runbook                   |
| :----------------------------- | :-------------------------------------------------- | :---------------: | :-------: | :-------------------------- | :------------------------------------------- |
| **HighErrorRate**              | HTTP 5xx responses $> 1.0\%$                        |     5 minutes     | **SEV-1** | PagerDuty / On-Call SMS     | Canary rollback if deployment active         |
| **SlowQuerySpike**             | PostgreSQL queries $> 500\text{ms}$                 |     3 minutes     | **SEV-2** | SRE Slack `#alerts-db`      | Log slow query plan to Sentry                |
| **QueueBacklogHigh**           | BullMQ waiting jobs $> 150$                         |    10 minutes     | **SEV-2** | Backend Slack `#alerts-ops` | Auto-scale background worker pods            |
| **RedisMemoryPressure**        | Redis memory usage $> 85\%$ maxmemory               |     5 minutes     | **SEV-2** | SRE Slack `#alerts-infra`   | Trigger volatile cache eviction              |
| **WebSocketDisconnectSpike**   | Abrupt drop in active WS sockets $> 40\%$           |     2 minutes     | **SEV-2** | Real-time `#alerts-chat`    | Check Nginx WebSocket proxy timeouts         |
| **PaymentWebhookFailure**      | Failed 1Link / Kuickpay webhook validations         |     Immediate     | **SEV-1** | Finance `#alerts-payments`  | Freeze affected invoices for manual review   |
| **PrivilegeEscalationAttempt** | Non-admin attempting to invoke admin routes         |     Immediate     | **SEV-1** | Security `#alerts-sec`      | Auto-block source IP for 60 minutes          |
| **TlsCertExpiryWarning**       | Let's Encrypt TLS certificate $< 21$ days to expiry |    Daily check    | **SEV-3** | DevOps `#alerts-infra`      | Trigger Certbot automated renewal            |
| **BackupJobFailure**           | Daily pg_dump WAL archive job returns non-zero      |     Immediate     | **SEV-1** | On-Call Lead & DBA          | Retries backup immediately to secondary disk |

---

## 4. Structured Logging Standard

All application logs are emitted as single-line JSON adhering to the platform standard:

```json
{
  "level": 30,
  "time": 1732007425000,
  "pid": 412,
  "hostname": "api-worker-prod-01",
  "reqId": "e2a392e1-4567-4a8b-9876-000000000001",
  "actorId": "usr-landlord-789",
  "action": "PROPERTY_CREATE",
  "locality": "Hayatabad",
  "latencyMs": 48.2,
  "statusCode": 201,
  "msg": "Property created successfully"
}
```

---

## 5. Observability Certification Conclusion

Log redaction, distributed request tracing, Prometheus telemetry, and automated alerting channels are certified fully operational. The platform is **APPROVED FOR REAL-TIME MONITORING**.
