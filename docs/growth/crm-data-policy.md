# CRM Data Governance & Lead Management Policy

## 1. CRM Lead Lifecycle Stages

```
NEW ───► CONTACTED ───► QUALIFIED ───► CONVERTED (Listing Created & Approved)
 │           │              │
 ├──► DUPLICATE            ├──► NURTURE (Follow-up scheduled)
 └──► INVALID              └──► LOST (Rented elsewhere / Not interested)
```

1. **NEW**: Fresh inbound lead captured via web form, WhatsApp, or campaign landing page. SLA: Must be assigned within 5 minutes.
2. **CONTACTED**: Relationship agent attempted phone call or sent personalized WhatsApp message.
3. **QUALIFIED**: Property details verified, ownership confirmed, and target rent agreed.
4. **NURTURE**: Landlord property is undergoing renovation or lease expires in 30–60 days.
5. **CONVERTED**: Landlord successfully registered on platform and first verified listing is published.
6. **LOST / INVALID / DUPLICATE**: Documented reason required (e.g. out of municipal bounds, fake lead, existing active landlord).

## 2. Lead Deduplication Rules

- **Phone Normalization**: All contact numbers are sanitized to the Pakistani standard E.164 format: `+923XXXXXXXXX`.
- **Match Criteria**: An incoming lead is marked `DUPLICATE` if:
  - The normalized phone matches an existing `Lead` created within the last 45 days; OR
  - The normalized phone or email matches an existing registered `User` account.
- Duplicate submissions are merged into the original lead record as a new `ContactAttempt` with updated UTM campaign parameters.

## 3. Access Control & Role-Based Permissions

- **Tier 1 Support Agent**: Can view assigned leads, log call attempts, and schedule callbacks. Phone numbers are displayed through a click-to-call gateway.
- **Acquisition Manager / Team Lead**: Can assign and reassign leads, edit lead status, and export aggregated reports without raw PII.
- **Admin / Super Admin**: Full CRM management and lead deletion access.

## 4. Immutable Audit Trails & Notes

- Every status transition creates a permanent `LeadStatusHistory` record documenting `oldStatus`, `newStatus`, `changedById`, and timestamp.
- Internal comments regarding landlords or operators must be objective, factual, and strictly professional in `LeadNote`.
