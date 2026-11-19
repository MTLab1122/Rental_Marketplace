# Product Experimentation Policy & Safety Guardrails

## 1. Principles & Purpose

The Peshawar Rental Marketplace uses structured experimentation (A/B testing, feature flagging, and multivariate rollouts) to scientifically validate product improvements. While experimentation accelerates innovation, it must operate within strict ethical, legal, and operational boundaries.

### Guiding Principles

- **Customer Trust First**: Experimentation must never mislead, deceive, or degrade the core safety and trust of tenants and landlords.
- **Hypothesis-Driven**: Every experiment must document a clear hypothesis, primary outcome metric, sample size calculation, and duration before launch.
- **Deterministic & Consistent**: A user assigned to variant B must consistently see variant B across all devices and sessions until the experiment concludes.
- **Fail-Safe by Default**: If an experiment triggers anomalous errors or performance degradation, the system must automatically kill the experiment and revert users to the control group.

---

## 2. Non-Negotiable Experimentation Guardrails

```
+---------------------------------------------------------------------------------------------------+
|                              STRICT SAFETY INVARIANTS (NEVER OVERRIDDEN)                          |
+---------------------------------------------------------------------------------------------------+
|  1. ELIGIBILITY INVARIANT                                                                         |
|     - Experiments MUST NEVER bypass, alter, or relax tenant eligibility segregation              |
|       (e.g., student vs. family housing rules).                                                   |
|                                                                                                   |
|  2. GEOGRAPHIC BOUNDARY INVARIANT                                                                 |
|     - Experiments MUST NEVER bypass municipal Peshawar location boundaries                       |
|       (Latitude: 33.90°N - 34.15°N, Longitude: 71.35°E - 71.70°E).                               |
|                                                                                                   |
|  3. CONTENT MODERATION INVARIANT                                                                  |
|     - Experiments MUST NEVER allow unapproved, suspended, or rejected listings to appear in       |
|       public search results. Only 'APPROVED' properties may be served.                           |
|                                                                                                   |
|  4. PRIVACY & PII INVARIANT                                                                       |
|     - Experiments MUST NEVER expose raw CNIC numbers, landlord phone numbers, or exact residential|
|       addresses prior to verified booking confirmation.                                           |
|                                                                                                   |
|  5. FAIR PRICING & ANTI-DISCRIMINATION INVARIANT                                                  |
|     - Experiments MUST NEVER present dynamic or discriminatory rent prices based on user ethnicity,|
|       religion, gender, or locality of origin.                                                    |
+---------------------------------------------------------------------------------------------------+
```

---

## 3. Feature Flag & Experiment Evaluation Engine

Experiments are evaluated server-side via the `ExperimentationService` using deterministic hashing:

$$\text{bucket} = \left(\text{CRC32}(\text{userId} + \text{":"} + \text{experimentKey}) \pmod{100}\right)$$

### Evaluation Rules

1. **Targeting Attributes**:
   - `role`: Filter by `TENANT`, `LANDLORD`, or `AGENT`.
   - `locality`: Filter by specific Peshawar zones (e.g. `HAYATABAD`, `UNIVERSITY_TOWN`, `GULBAHAR`).
   - `platform`: `web`, `mobile_android`, `mobile_ios`.
   - `appVersion`: Semantic version ranges (e.g. `>= 1.4.0`).
2. **Override Allowlist**:
   - Internal QA and engineering accounts can be hard-coded into specific variants for manual validation.

### Sample Experiment Configuration Schema

```json
{
  "key": "exp_search_map_preview_v2",
  "name": "Map-First Property Card Layout in Hayatabad",
  "description": "Tests interactive map pin preview on mobile property cards vs. static photo carousel",
  "enabled": true,
  "percentage": 50,
  "targetRoles": ["TENANT"],
  "targetLocalities": ["HAYATABAD"],
  "variants": [
    { "key": "control", "weight": 50 },
    { "key": "interactive_map", "weight": 50 }
  ],
  "guardrails": {
    "max5xxRate": 0.002,
    "maxP95LatencyMs": 400
  }
}
```

---

## 4. Statistical Rigor & Sample Sizing

To ensure statistical validity and prevent premature conclusions:

- **Minimum Duration**: Experiments must run for a minimum of **14 consecutive days** to account for day-of-week cyclicality (e.g., Friday prayer hours, Sunday family viewing surges).
- **Statistical Significance**: Results are evaluated at a **95% confidence level** ($\alpha = 0.05$) with an 80% statistical power ($\beta = 0.20$).
- **Sample Size Threshold**: Minimum 1,000 unique users per variant before initiating statistical testing.

### Key Metrics Hierarchy

| Metric Category      | Metric Name            | Definition                                                        | Target Direction       |
| :------------------- | :--------------------- | :---------------------------------------------------------------- | :--------------------- |
| **Primary Metric**   | Search-to-Inquiry Rate | $\%$ of unique searchers who submit a WhatsApp or in-app inquiry  | $\uparrow$ Increase    |
| **Secondary Metric** | Time to First Viewing  | Hours from initial listing discovery to confirmed viewing request | $\downarrow$ Decrease  |
| **Guardrail Metric** | Error Rate             | Total HTTP 5xx responses generated by variant endpoints           | Must remain $< 0.2\%$  |
| **Guardrail Metric** | Cancellation Rate      | $\%$ of scheduled viewings cancelled by landlord or tenant        | Must remain $< 5\%$    |
| **Guardrail Metric** | App Crash Rate         | Crash-free sessions on mobile variant                             | Must remain $> 99.8\%$ |

---

## 5. Automated Circuit Breakers & Kill-Switches

The platform provides an instant emergency kill-switch managed through the Admin Reliability portal:

1. **Automated Circuit Breaker**: If Prometheus metrics detect that variant B generates an error rate $> 1.0\%$ or p95 latency $> 600\text{ms}$ over a 5-minute sliding window, the experiment is automatically disabled (`enabled: false`) without requiring human intervention.
2. **Global Admin Override**: System administrators can disable any experiment or feature flag with a single click in `apps/admin/app/reliability/page.tsx`.
3. **Propagation Speed**: Flag state changes are published over Redis Pub/Sub, updating all API and frontend edge caches within **3 seconds**.

---

## 6. Experiment Lifecycle & Decommissioning

```
[Proposal & Hypothesis]
       v
[Guardrail & Ethics Review]
       v
[Staging Validation & QA Allowlist]
       v
[Canary Rollout (10% -> 50%)]
       v
[Full Experiment Run (14 Days Min)]
       v
[Statistical Analysis & Decision]
       +---> WINNER: 100% Rollout -> Clean up dead flag code within 2 sprints
       +---> NEUTRAL / LOSER: Rollback to Control -> Remove flag within 1 sprint
```

### Technical Debt Hygiene

Feature flags must not remain in the codebase indefinitely. Once an experiment concludes and a permanent decision is made, the conditional code branches and flag definitions must be removed from the repository within **two sprint cycles** to prevent code rot and technical debt accumulation.
