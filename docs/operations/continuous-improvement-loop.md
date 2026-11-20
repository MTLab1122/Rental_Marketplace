# Continuous Improvement Loop & Incident Management Policy

## 1. Governance & Principles

Continuous improvement at **Rental Peshawar** follows Google SRE incident lifecycle management and blameless postmortem culture.

Every production incident, defect, security anomaly, or major customer escalation is treated as a learning opportunity to systematically strengthen architectural guardrails, eliminate root causes, and permanently prevent regression.

---

## 2. The 11-Stage Incident Resolution & Improvement Lifecycle

```mermaid
flowchart LR
    Detect["1. Detect"] --> Triage["2. Triage"]
    Triage --> Contain["3. Contain"]
    Contain --> Resolve["4. Resolve"]
    Resolve --> Recover["5. Recover"]
    Recover --> Postmortem["6. Postmortem"]
    Postmortem --> RootCause["7. Root Cause"]
    RootCause --> Action["8. Preventive Action"]
    Action --> Test["9. Regression Test"]
    Test --> Runbook["10. Runbook Update"]
    Runbook --> Roadmap["11. Roadmap Feed"]
```

### Stage Responsibilities

1. **Detect**: Automated detection via Prometheus alerts, health check monitors, or security anomaly filters.
2. **Triage**: Incident Commander (IC) classifies severity (SEV-1 Critical, SEV-2 Major, SEV-3 Minor).
3. **Contain**: Immediate mitigation (e.g. traffic redirection, circuit breaker trip, temporary rate limit, rollback).
4. **Resolve**: Safe hotfix or operational adjustment restoring normal service.
5. **Recover**: Full service validation and monitoring confirmation for at least 30 minutes.
6. **Postmortem**: Blameless postmortem drafted within 48 hours for any incident consuming $> 20\%$ error budget.
7. **Root Cause**: 5-Whys analysis identifying systemic, process, or architectural failure points.
8. **Preventive Action**: Creation of at least one P0/P1 non-negotiable engineering ticket.
9. **Regression Test**: Automated unit/integration test added to test suite reproducing the failure condition.
10. **Runbook Update**: SRE runbook updated with exact symptoms and operational resolution steps.
11. **Roadmap Feed**: Long-term architectural safeguards incorporated into the next quarterly sprint backlog.

---

## 3. Error Budget Policy & Release Freezes

In accordance with Google SRE principles:

| 30-Day Error Budget Consumed  | Operational Action Required                           | Engineering Impact                                     |
| :---------------------------: | :---------------------------------------------------- | :----------------------------------------------------- |
|  **$0\% - 50\%$ (Nominal)**   | Normal feature releases permitted.                    | Feature development proceeds at full velocity.         |
|  **$50\% - 80\%$ (Warning)**  | Heightened monitoring; Canary deploy mandatory.       | Releases require Tech Lead peer sign-off.              |
| **$80\% - 100\%$ (Critical)** | Feature release gate restricted; SRE review required. | Only reliability & bug fixes allowed.                  |
|   **$> 100\%$ (Exhausted)**   | **FEATURE RELEASE FREEZE DECLARED.**                  | 100% of engineering bandwidth diverted to reliability. |

### Single-Incident 20% Rule

If a single incident consumes $> 20\%$ of the 4-week error budget:

1. Feature releases to that service are temporarily frozen.
2. An executive postmortem is mandatory within 72 hours.
3. At least one P0 architectural action must be implemented, tested, and deployed before feature releases resume.

---

## 4. Blameless Postmortem Template

Every postmortem must include:

- **Incident Summary & Timeline**: Exact timestamps (UTC and PKT) from detection to recovery.
- **Impact Assessment**: Number of tenants/landlords affected, failed transactions, error budget consumed.
- **Root Cause Analysis (5-Whys)**: Technical, environmental, and human factors without personal blame.
- **Trigger Condition**: What initiated the failure chain.
- **What Went Well / What Went Poorly**: Team response and tooling evaluation.
- **Where We Got Lucky**: Latent failures avoided by chance.
- **Action Items**: Explicit owner, Jira ticket ID, priority (P0/P1), and hard delivery deadline.
