# Production Reliability Policy & SRE Governance

## 1. Reliability as a Core Feature

At the Peshawar Rental Marketplace, reliability is not an afterthought; it is our primary product requirement. If the portal is unavailable or slow, students miss hostel bookings, families cannot find safe housing, and landlords lose rental income.

### Core Principles

1. **Design for Partition & Offline Realities**: Local networks and utilities experience outages. The application gracefully degrades without breaking.
2. **Blast Radius Minimization**: Failures in third-party services (e.g., WhatsApp, Maps, SMS gateway) must never bring down core property discovery or inquiry submission.
3. **Automated Defense**: Systems must defend themselves via circuit breakers, adaptive rate limiting, and automatic dead-letter queue retries.
4. **Zero Unmonitored Deployments**: Code is not considered shipped until telemetry proves it performs within defined SLO boundaries.

---

## 2. Failure Isolation & Bulkheading

```
+-------------------------------------------------------------------------------------------------+
|                                 FAILURE BULKHEAD TOPOLOGY                                       |
+-------------------------------------------------------------------------------------------------+
|  [Incoming Traffic] -> [Cloudflare Edge WAF & Rate Limiting]                                    |
|                                    |                                                            |
|       +----------------------------+----------------------------+                               |
|       | Read Traffic (90%)                                      | Write Traffic (10%)           |
|       v                                                         v                               |
|  [Redis Query Cache & Stale-If-Error]                      [NestJS Core API Cluster]            |
|  Serves searches & details during DB blips                 Enforces strict ACID transactions    |
|       |                                                         |                               |
|       v                                                         v                               |
|  [PostgreSQL Read Replicas]                                [PostgreSQL Primary]                 |
|                                                                 |                               |
|                                                            [BullMQ Outbox]                      |
|                                                            - WhatsApp (Async, circuit breaker)  |
|                                                            - Push (Async, FCM queue)            |
|                                                            - Emails (Async, retry queue)        |
+-------------------------------------------------------------------------------------------------+
```

### Circuit Breakers & Fallback Mechanisms

- **Payment Gateway**: If Pakistani payment API calls fail > 5 times in 60s, open circuit and automatically switch to manual offline bank transfer workflow (Meezan Bank IBAN, JazzCash Till) without rejecting booking requests.
- **WhatsApp Cloud API**: If Meta API latency > 5s or error rate > 5%, fall back immediately to in-app notification and SMS without delaying message delivery.
- **Geocoding & Maps**: If map provider experiences downtime, fall back to cached municipal center points and locality polygons.

---

## 3. On-Call Engineering & Incident Escalation

- **Roster**: Two primary on-call engineers rotating weekly + one secondary engineering lead.
- **Paging Protocol**: Automated phone calls via PagerDuty for SEV-1; SMS/Slack for SEV-2.
- **Acknowledgment SLA**:
  - SEV-1 (Critical Outage): < 15 minutes.
  - SEV-2 (High Degradation): < 30 minutes.
  - SEV-3 (Moderate Issue): < 2 hours.
