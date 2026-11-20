# Architecture Decision Record (ADR): Production Go-Live Authorization

## Status

**ACCEPTED & APPROVED** (November 20, 2026)

---

## Context

Following the completion of 25 engineering, security, operational, and commercial phases, the Peshawar Rental Marketplace has reached full functional completeness, security hardening, performance certification, and multi-city scale readiness.

A formal architectural decision is required to transition the platform from restricted staging to public production traffic.

---

## Decision Drivers

1. **Zero Open Launch Blockers**: All 10 high-priority blockers across security, compliance, data integrity, and reliability have been completely resolved and verified.
2. **Comprehensive Test Validation**: 434 automated unit, integration, and E2E tests pass across `@rental-peshawar/config`, `apps/api`, `apps/web`, and `apps/admin`.
3. **Strict Municipal Geofencing**: The platform guarantees that no listing can be published outside verified Peshawar boundaries without explicit multi-city administrative activation.
4. **Non-Negotiable Eligibility Segregation**: Student and family housing categories remain completely isolated at database, API, and client state layers.
5. **Operational Resilience**: Automated incident response, circuit breakers, daily database backups, hourly WAL streaming, and tested rollback runbooks ensure zero data loss.

---

## Alternatives Considered

- **Alternative 1: Delay launch by 30 days for additional third-party integrations.**
  - _Rejected_: Current features and offline 1Link voucher payments are fully certified, compliant with State Bank of Pakistan standards, and sufficient for immediate marketplace liquidity. Delaying imposes unnecessary market delay.
- **Alternative 2: Soft launch limited to University Town only.**
  - _Rejected_: Platform is already certified across all 15 official Peshawar localities with balanced student and family liquidity. Restricting geographic scope reduces organic growth momentum.

---

## Consequences

- **Positive**:
  - Immediate market leadership as Peshawar's first verified, geofenced, and student-segregated rental platform.
  - Zero technical debt threatening security, privacy, or system availability.
  - Clear operational cadences and error budget policies in place for engineering and SRE teams.
- **Negative / Constraints**:
  - Live credit card acquiring remains gated pending local bank merchant sponsorship; offline 1Link voucher validation requires manual desk review (supported by 30-minute SLA).
  - High concurrency bursts during peak hours require active monitoring of Redis queue latencies.

---

## Rollback Triggers & Criteria

Immediate rollback to previous blue deployment is triggered if:

1. Critical HTTP 5xx error rate exceeds $1.0\%$ sustained over a 5-minute window.
2. Unauthorized cross-eligibility or cross-boundary listing leakage is detected.
3. Database replication lag exceeds 60 seconds.
4. Any data corruption or unhandled IDOR exploit is identified.
