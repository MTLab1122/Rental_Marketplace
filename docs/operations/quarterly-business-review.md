# Quarterly Business Review (QBR) Framework & Operating Cadence

## 1. Objectives & Executive Governance

The Quarterly Business Review (QBR) serves as the primary strategic alignment forum for the Peshawar Rental Marketplace. Every 12 weeks, the Executive Leadership team, Engineering Leads, Product Managers, Operations Directors, and Regional Growth Managers convene to evaluate marketplace liquidity, system reliability, commercial traction, and geographical expansion readiness.

### Core Objectives

1. **Holistic Marketplace Health**: Evaluate supply, demand, liquidity, and transaction velocity across Peshawar's 15 distinct municipal sub-markets.
2. **Reliability & SRE Governance**: Review SLO adherence, error budget expenditure, and infrastructure scalability.
3. **Unit Economics & Monetization**: Analyze Landlord CAC, LTV, revenue realization, and payment gateway efficiency.
4. **Strategic Roadmap Adjustment**: Allocate capital and engineering resources for the subsequent quarter based on empirical data.

---

## 2. Standard QBR Agenda & Schedule

The QBR is conducted over a single 3-hour executive session during the final week of each calendar quarter:

| Time              | Duration | Agenda Topic                               | Primary Presenter                | Key Artifacts                                        |
| :---------------- | :------- | :----------------------------------------- | :------------------------------- | :--------------------------------------------------- |
| **09:00 - 09:30** | 30 min   | Executive Summary & OKR Scorecard          | Chief Executive Officer          | OKR Dashboard, High-Level Financials                 |
| **09:30 - 10:15** | 45 min   | Marketplace Liquidity & Regional Deep-Dive | Head of Product & Growth         | Locality Liquidity Heatmaps, DOM Metrics             |
| **10:15 - 10:55** | 40 min   | SRE, Infrastructure & Security Review      | Head of Engineering / SRE Lead   | 11-SLO Scorecard, Error Budget Ledger, Threat Report |
| **10:55 - 11:35** | 40 min   | Commercialization, Revenue & Landlord NPS  | Head of Commercial Operations    | Revenue Waterfall, CAC/LTV, Landlord Retention       |
| **11:35 - 12:00** | 25 min   | Strategic Roadmap & Multi-City Expansion   | Product / Engineering Joint Lead | Roadmap Priorities, Regional Feasibility Studies     |

---

## 3. Marketplace Health & Locality Scorecard

Marketplace health is tracked across four core pillars: Supply, Demand, Liquidity, and Quality.

### Locality Liquidity Matrix (Sample Quarterly Benchmark)

| Locality (Peshawar)        | Active Listings | Monthly Tenant Inquiries | Supply/Demand Ratio | Median Days on Market (DOM) | Average Monthly Rent (PKR) | Verified Landlord % |
| :------------------------- | :-------------- | :----------------------- | :------------------ | :-------------------------- | :------------------------- | :------------------ |
| **Hayatabad (Phases 1–7)** | 1,420           | 11,800                   | 1 : 8.3             | 14 days                     | 42,000                     | 94.2%               |
| **University Town**        | 680             | 7,950                    | 1 : 11.7            | 11 days                     | 48,000                     | 96.5%               |
| **Saddar & Cantonment**    | 390             | 3,100                    | 1 : 7.9             | 19 days                     | 38,000                     | 89.1%               |
| **Gulbahar & City Area**   | 510             | 3,850                    | 1 : 7.5             | 22 days                     | 26,000                     | 84.7%               |
| **Warsak Road Corridor**   | 440             | 3,200                    | 1 : 7.3             | 25 days                     | 32,000                     | 88.0%               |
| **Regi Model Town**        | 280             | 1,980                    | 1 : 7.1             | 29 days                     | 24,000                     | 82.5%               |
| **DHA Peshawar**           | 160             | 950                      | 1 : 5.9             | 38 days                     | 55,000                     | 98.0%               |
| **Ring Road / Dalazak**    | 310             | 2,100                    | 1 : 6.8             | 26 days                     | 22,000                     | 81.0%               |

### Liquidity Health Thresholds

- **Healthy Liquidity**: Supply/Demand ratio between **1 : 7 and 1 : 12**; Median DOM $< 21$ days.
- **Supply Constrained (High Demand)**: Supply/Demand ratio $> 1 : 12$; Median DOM $< 12$ days. Action: Deploy landlord field acquisition agents to sign up more inventory.
- **Demand Constrained (Oversupply)**: Supply/Demand ratio $< 1 : 6$; Median DOM $> 30$ days. Action: Target localized Facebook/Google Ads campaigns to tenants in that specific zone.

---

## 4. SRE & Technical Reliability Review

The Engineering organization presents a 90-day reliability audit:

```
+---------------------------------------------------------------------------------------------------+
|                                  QUARTERLY RELIABILITY SCORECARD                                  |
+---------------------------------------------------------------------------------------------------+
|  Monitored Metric                                Target         Actual Q3        Status          |
|  -----------------------------------------------------------------------------------------------  |
|  API Availability (SLO-01)                       >= 99.90%      99.94%           PASS (Green)    |
|  Search Latency p95 (SLO-02)                     < 350 ms       282 ms           PASS (Green)    |
|  Property Details p95 (SLO-03)                   < 250 ms       195 ms           PASS (Green)    |
|  Media Upload Success (SLO-04)                   >= 99.50%      99.68%           PASS (Green)    |
|  Notification Latency p95 (SLO-05)               < 30 sec       14.2 sec         PASS (Green)    |
|  Error Budget Consumption                        < 100%         42.8%            HEALTHY (Green) |
|  SEV-1 Critical Outages                          0              0                PASS (Green)    |
|  SEV-2 Major Incidents                           <= 2           1 (Redis jitter) RESOLVED (PIR)  |
|  Mean Time to Recovery (MTTR)                    < 30 min       18.4 min         PASS (Green)    |
+---------------------------------------------------------------------------------------------------+
```

---

## 5. Commercial Performance & Unit Economics

### Revenue Streams

1. **Landlord Subscriptions**:
   - Starter Tier: Free (up to 2 active listings).
   - Pro Tier (PKR 3,500/mo): Up to 10 active listings, verified badge, priority search placement.
   - Enterprise/Agency Tier (PKR 12,000/mo): Unlimited listings, dedicated concierge, bulk CSV import.
2. **Featured & Bumped Listings**:
   - 7-day featured spotlight: PKR 1,200.
   - Instant search bump: PKR 400.
3. **Lease Drafting & CNIC Verification Concierge**:
   - Digital tenancy agreement pack: PKR 1,500 per lease.

### Unit Economics Benchmarks

- **Landlord Customer Acquisition Cost (CAC)**: PKR 1,850 (blended digital ads + on-site field agent visit).
- **Landlord 12-Month Lifetime Value (LTV)**: PKR 18,400.
- **LTV / CAC Ratio**: **9.9x** (highly sustainable unit economics).
- **Monthly Recurring Revenue (MRR) Growth**: Target 15% quarter-over-quarter.

---

## 6. Multi-City Expansion Feasibility Framework

As the Peshawar core marketplace achieves self-sustaining liquidity, the QBR evaluates geographical expansion into neighboring Khyber Pakhtunkhwa cities using strict operational gates:

```
+---------------------------------------------------------------------------------------------------+
|                                 MULTI-CITY EXPANSION GATE CRITERIA                                |
+---------------------------------------------------------------------------------------------------+
|  1. PESHAWAR CORE MATURITY                                                                        |
|     - Peshawar active listings > 4,000 verified units.                                            |
|     - Monthly GMV facilitated > PKR 150 Million.                                                  |
|     - Platform error budget consumption consistently < 60% for 3 consecutive months.              |
|                                                                                                   |
|  2. MARDAN EXPANSION GATES                                                                       |
|     - Local university student density (Abdul Wali Khan University, BKMC) analyzed.              |
|     - 200 seed landlords pre-committed via local real estate association partnership.             |
|     - PostGIS geofence configured for Mardan Municipal boundaries (34.15°N - 34.30°N).            |
|                                                                                                   |
|  3. ABBOTTABAD EXPANSION GATES                                                                    |
|     - Strong seasonal student & medical house-officer rental demand (Ayub Medical College).       |
|     - Summer climate rent premium dynamics modeled.                                               |
|     - PostGIS geofence configured for Abbottabad Cantonment & Galliat boundaries.                 |
+---------------------------------------------------------------------------------------------------+
```
