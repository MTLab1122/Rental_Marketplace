# Peshawar Rental Content Strategy & Editorial Standards

## 1. Content Philosophy (People-First & Locally Verified)

Rental Peshawar rejects automated spun articles, doorway pages, and keyword-stuffed text. Every published guide, locality profile, and property narrative must adhere to Google's Helpful Content Standards (E-E-A-T: Experience, Expertise, Authoritativeness, and Trustworthiness).

---

## 2. Topic Clusters & Content Hubs

```mermaid
flowchart TD
    Pillar[Pillar Guide: Complete Peshawar Rental Guide] --> Cluster1[Student Accommodation Hub]
    Pillar --> Cluster2[Family Rental Guide]
    Pillar --> Cluster3[Legal, Deposit & Scam Prevention Hub]

    Cluster1 --> Guide1A[Hostels Near UoP & UET]
    Cluster1 --> Guide1B[Student vs Family Eligibility Rules]

    Cluster2 --> Guide2A[Hayatabad Family Living Guide]
    Cluster2 --> Guide2B[Electricity Load-Shedding & Solar Rent Factors]

    Cluster3 --> Guide3A[Security Deposit Law & Receipts in Peshawar]
    Cluster3 --> Guide3B[How to Avoid Rental Scams in KPK]
```

---

## 3. Editorial & Local Accuracy Guidelines

1. **Local Context Mandate**: Content must reflect genuine Peshawar realities (e.g., Peshawar BRT Zu Peshawar routes, feeder buses, load-shedding generator backup norms, local water table considerations in Hayatabad vs Warsak Road).
2. **Transparent Author Information**:
   - Every guide must cite a verified local author or editorial reviewer with verified Peshawar real estate knowledge.
   - Visible "Last Updated" timestamp matching Schema.org `dateModified`.
3. **No Thin Locality Pages**:
   - Locality pages (`/rentals/peshawar/[localitySlug]`) must only be indexable if there is either active verified inventory or substantial locality guidance.
   - Empty or low-inventory localities are merged or set to `noindex` until genuine supply is onboarded.
4. **Verified Price Statistics**: Average rent figures displayed on locality pages are dynamically computed from active listings in PostgreSQL (`LocalityPricingInsight`), never fabricated.
