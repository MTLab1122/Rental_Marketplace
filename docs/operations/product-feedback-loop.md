# Product Feedback Loop & Customer Intelligence

## 1. Vision & Strategy

The Peshawar Rental Marketplace thrives by staying deeply connected to the ground realities of tenants and landlords in Khyber Pakhtunkhwa. The Product Feedback Loop establishes a systematic, continuous mechanism to capture, quantify, and act upon user sentiments, local friction points, and feature requests.

### Core Objectives

1. **Real-Time Sentiment Monitoring**: Detect user frustration, broken journeys, or unaddressed complaints before they escalate into marketplace churn.
2. **Close the Loop**: Every dissatisfied user (rating $\le 2$ stars or submitting a critical complaint) receives proactive concierge follow-up within 4 operational hours.
3. **Evidence-Based Roadmapping**: Quantify user feature demands to prioritize engineering sprints with verified customer validation.
4. **Local Cultural Sensitivity**: Address Peshawar-specific rental pain points such as utility reliability (gas/water), family vs. bachelor housing dynamics, and language preferences (Urdu and Pashto).

---

## 2. Multi-Channel Feedback Architecture

```
+---------------------------------------------------------------------------------------------------+
|                                MULTI-CHANNEL FEEDBACK COLLECTION                                  |
+---------------------------------------------------------------------------------------------------+
|  [Tenant Web Widget]       [Mobile In-App Prompts]     [Field Agent Concierge]  [Review Sentiment] |
|  - Floating Feedback Hub   - Post-Viewing CSAT (1-5★)  - Landlord On-Site Notes - NLP Theme Mining |
|  - Bug / Feature / Praise  - Search Abandonment Poll   - CNIC Verification Desk - Gas/Water/Load   |
|            |                         |                            |             Shedding Tags     |
|            +-------------------------+----------------------------+-------------------+           |
|                                                  |                                                |
|                                                  v                                                |
|                                    [Central Feedback Ingestion API]                               |
|                                    - POST /api/v1/feedback                                        |
|                                    - Persona tagging (Tenant/Landlord/Agent)                      |
|                                    - Locality tagging (Hayatabad, Gulbahar, etc.)                 |
|                                                  |                                                |
|                                                  v                                                |
|                        +-------------------------+-------------------------+                      |
|                        |                                                   |                      |
|                        v                                                   v                      |
|          [Score <= 2 Stars: High Alert]                      [Score >= 3 Stars: Aggregation]      |
|          - Instant Admin Notification                        - Bi-Weekly Trend Clustering         |
|          - Concierge WhatsApp Outreach (<4h)                 - Product Backlog Prioritization     |
+---------------------------------------------------------------------------------------------------+
```

---

## 3. Feedback Channels & Metrics

### A. In-App User Feedback Widget (`apps/web` & `apps/mobile`)

- **Triggers**: Available on all pages via persistent floating action button and header link.
- **Fields Collected**:
  - `rating`: 1 to 5 Stars.
  - `category`: `BUG`, `FEATURE_REQUEST`, `SEARCH_QUALITY`, `LANDLORD_ISSUE`, `GENERAL_FEEDBACK`.
  - `comment`: Free-text input (supports English, Urdu, and Roman Urdu/Pashto).
  - `pageUrl`: Contextual path where the feedback was triggered.
  - `metadata`: Device type, browser, network speed category.

### B. Post-Transaction CSAT (Customer Satisfaction Score)

- **Target Event**: Triggered 24 hours after a scheduled property viewing or confirmed lease agreement.
- **Key Question**: _"How satisfied were you with your interaction with the landlord and the accuracy of the listing?"_ (Scale 1–5).
- **Target Metric**: Platform CSAT $\ge 4.5 / 5.0$.

### C. Quarterly Net Promoter Score (NPS)

- **Target Segment**: Active landlords with $\ge 1$ listing and tenants who have made $\ge 3$ inquiries in the last 90 days.
- **Key Question**: _"How likely are you to recommend Rental Peshawar to a colleague or family member?"_ (0–10 scale).
- **NPS Classification**:
  - **Promoters (9–10)**: Invited to join Landlord Advisory Circle or write Google/Play Store reviews.
  - **Passives (7–8)**: Monitored for feature gaps.
  - **Detractors (0–6)**: Routed directly to Customer Support Lead for root-cause interviews.
- **Target Metric**: Landlord NPS $\ge +45$; Tenant NPS $\ge +50$.

### D. Field Agent & Concierge Notes

- Peshawar on-site verification agents record qualitative landlord sentiments during photo shoots and physical inspections:
  - Landlord hesitation regarding digital rent collection.
  - Requests for physical paper lease agreement templates in Urdu.
  - Concerns regarding bachelor student tenants in residential sectors.

---

## 4. Peshawar-Specific Feedback Themes & Action Protocols

| Recurrent Feedback Theme                      | Typical User Voice                                                                                              | System Response & Feature Action                                                                                                         |
| :-------------------------------------------- | :-------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------- |
| **Utility Shortages (Gas/Water/Electricity)** | _"Listing said 24/7 gas but Sui Gas pressure drops to zero from 6 PM to 10 PM in Warsak Road."_                 | Added verified utility badges to property listings: "Dedicated Gas Tube Well", "Solar Backup Installed", "Heavy-Duty Generator Support". |
| **Bachelor vs. Family Segregation**           | _"We visited the apartment in University Town but landlord said families only, though listing didn't specify."_ | Enforced mandatory tenant eligibility selector on property creation; hard search filter preventing wasted viewings.                      |
| **Language Accessibility**                    | _"Elderly landlords in Gulbahar prefer communicating in Pashto or Urdu voice notes."_                           | Implemented WhatsApp direct concierge integration with native Pashto and Urdu speaking representatives.                                  |
| **Student Hostel Security**                   | _"Female students at Khyber Medical College need verified hostel security information."_                        | Created dedicated verified female student hostel badge requiring biometric gate guard verification.                                      |

---

## 5. Triage & SLA Matrix

| Feedback Rating          | Severity             | Automatic Action                                                                                    | Human SLA               | Responsible Role         |
| :----------------------- | :------------------- | :-------------------------------------------------------------------------------------------------- | :---------------------- | :----------------------- |
| **1 Star (Critical)**    | SEV-2 Customer Alert | Dispatches priority notification to Admin dashboard; creates high-priority Zendesk/CRM ticket.      | $< 4$ operational hours | Customer Experience Lead |
| **2 Stars (Negative)**   | Moderate Alert       | Enters weekly friction review queue; auto-acknowledges with empathetic apology email/SMS.           | $< 24$ hours            | Support Concierge        |
| **3 Stars (Neutral)**    | Standard Metric      | Logged for statistical trend analysis; reviewed during Weekly Operational Review.                   | No direct contact       | Product Analyst          |
| **4–5 Stars (Positive)** | Delight Opportunity  | Automated thank you; displays prompt: _"Would you like to share your review on Google Play Store?"_ | Automated               | Growth Lead              |

---

## 6. Closing the Loop: From Feedback to Product Backlog

Feedback is not stored in a silo. Every Tuesday during sprint grooming:

1. Product Managers review top 5 feedback clustering topics.
2. User stories derived from feedback are labeled `origin:customer-feedback` in Jira.
3. When a feature derived from customer feedback is released, the originating users receive a personalized notification:
   > _"Hello [Name], you recently suggested adding solar backup filtering for Hayatabad properties. We've just launched this feature! Thank you for helping us make Rental Peshawar better."_
