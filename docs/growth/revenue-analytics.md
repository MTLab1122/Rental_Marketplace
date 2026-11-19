# Revenue Analytics & Unit Economics Framework

## 1. Core Financial & Marketplace Metrics

### 1.1 Recurring SaaS & Subscription Metrics

- **Monthly Recurring Revenue (MRR)**:
  $$\text{MRR} = \sum (\text{Active Landlord Paid Subscriptions} \times \text{Monthly Fee})$$
- **Annual Recurring Revenue (ARR)**:
  $$\text{ARR} = \text{MRR} \times 12$$
- **Average Revenue Per Landlord (ARPL)**:
  $$\text{ARPL} = \frac{\text{Total Commercial Revenue (Subscriptions + Promos + Agreements)}}{\text{Total Active Landlords}}$$
- **Monthly Churn Rate**:
  $$\text{Churn Rate} = \frac{\text{Cancelled Subscriptions in Month } t}{\text{Active Subscriptions at Start of Month } t} \times 100\%$$

### 1.2 Unit Economics & Acquisition Efficiency

- **Customer Acquisition Cost (CAC - Landlord)**:
  $$\text{CAC}_{\text{Landlord}} = \frac{\text{Total Paid Ad Spend + Direct Agent Commission}}{\text{Total Newly Verified Onboarded Landlords}}$$
  _Target_: $\le \text{PKR } 1,800\text{ per verified active landlord}$.
- **Lifetime Value (LTV - Landlord)**:
  $$\text{LTV} = \frac{\text{Gross Margin} \times \text{ARPL}}{\text{Monthly Churn Rate}}$$
  _Target_: $\text{LTV} : \text{CAC} \ge 3.5 : 1$.

## 2. Revenue Segmentation Dimensions

All financial telemetry records (`RevenueEvent`) are sliced along critical operational dimensions:

1. **Locality Breakdown**: Revenue generated in Hayatabad vs University Town vs Warsak Road vs Saddar.
2. **Property Type**: Hostels vs Independent Upper/Lower Portions vs Modern Apartments.
3. **Tenant Demographic**: Students vs Professional Families.
4. **Acquisition Channel**: Organic SEO vs Meta Ads vs Field Sales vs Landlord Referrals.

## 3. Cohort Retention Tracking

Monthly landlord cohorts are tracked over 3, 6, 12, and 24 months to monitor:

- Listing replenishment rate (re-listing properties after lease expiry).
- Retention on Pro and Agency plans.
- Average time to first qualified inquiry ($< 72\text{ hours}$ benchmark).
