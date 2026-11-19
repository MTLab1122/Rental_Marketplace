# Peshawar Rental Marketplace: Support & Operations Handover (v1.0.0-GA)

## 1. Scope & Support Operating Model

This document formalizes the handover from Engineering to the Peshawar Operations & Customer Experience team.

- **Operating Hours**: Monday to Sunday, 08:00 AM to 10:00 PM PKT.
- **Support Channels**:
  - Official WhatsApp Business Helpline: `+92 300 1234567`
  - In-App Support Chat & Inquiry Messaging Desk
  - Email Helpdesk: `support@rentalpeshawar.pk`
- **Location**: Peshawar Operations Center, University Road, Peshawar, KP.

---

## 2. Operational Workflows & Responsibilities

### Workflow A: Landlord Verification & Listing Moderation Desk

1. **Trigger**: Landlord submits property listing with CNIC and utility bill.
2. **Review SLA**: < 2 hours for Pro Landlords; < 6 hours for Starter Landlords.
3. **Verification Checklist**:
   - Check CNIC format (13 digits: `17301-XXXXXXX-X`) matches Peshawar / KP NADRA records.
   - Verify electricity consumer number against Peshawar Electric Supply Company (PESCO) database.
   - Confirm listing coordinates lie within Peshawar municipal grid (33.90°N–34.15°N, 71.35°E–71.70°E).
   - Ensure student hostel has clear warden contact, gate curfew rules, and mess inclusions.
4. **Action**: Click "Approve", "Request Changes", or "Reject" with predefined Urdu/English reason templates.

### Workflow B: Dispute Triage & Security Deposit Escrow

1. **Trigger**: Tenant or landlord flags a booking dispute (e.g., condition mismatch, deposit refund delay).
2. **Response SLA**: < 1 hour acknowledgment; resolution within 48 hours.
3. **Mediation Protocol**:
   - Temporary hold placed on escrow payout in the administrative ledger.
   - Review digital tenancy agreement and initial move-in inspection photos.
   - Review chat log between landlord and tenant in the admin console.
   - Issue mediated refund or release funds based on Khyber Pakhtunkhwa Urban Planning & Tenancy rules.

### Workflow C: Suspicious Listing & Fraud Radar Triage

1. **Trigger**: Platform AI or tenant reports a listing for fake pricing or duplicate photos.
2. **Immediate Action**: Listing is placed in `UNDER_REVIEW` status; hidden from public search immediately.
3. **Investigation**:
   - Check image SHA-256 hash against existing verified listings.
   - Verify landlord phone number against known scammer blacklists.
   - If confirmed fraudulent: Permanently ban landlord account, blacklist phone number, issue credit note if tenant made deposit.

---

## 3. Support Severity Levels & Escalation Paths

| Severity  | Description                                         | First Response | Escalation Target            | Engineering Contact   |
| :-------- | :-------------------------------------------------- | :------------- | :--------------------------- | :-------------------- |
| **SEV-1** | Safety emergency, harassment, unauthorized access   | < 15 mins      | Legal / Law Enforcement Desk | On-Call Lead Engineer |
| **SEV-2** | Escrow payment dispute, listing offline erroneously | < 1 hour       | Operations Manager           | Backend Specialist    |
| **SEV-3** | General inquiry, listing edit assistance            | < 4 hours      | Support Specialist           | Support Tier 2        |
| **SEV-4** | Feedback, locality expansion requests               | < 24 hours     | Product Specialist           | Product Manager       |

---

## 4. Emergency Contacts & Escalation Contacts

- **Head of Peshawar Operations**: Haji Muhammad Usman (`ops@rentalpeshawar.pk`)
- **AppSec Incident Response Lead**: `security@rentalpeshawar.pk`
- **Peshawar Police Rescue Emergency**: 15 / KP Police Citizen Portal Integration
