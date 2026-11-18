# Support & Trust Operations Playbook — Rental Peshawar

This playbook guides support engineers and moderators in resolving disputes, investigating fraud, and processing appeals.

---

## 1. Support Ticket Lifecycle

- **Triage SLA:**
  - `URGENT` (Safety hazard, harassment, extortion): Response within 1 hour.
  - `HIGH` (Deposit dispute, unauthorized listing): Response within 4 hours.
  - `MEDIUM` / `LOW` (General inquiry, account question, feedback): Response within 24 hours.

## 2. Dispute Resolution Workflow

1. **Initial Assessment:** Review conversation history between tenant and landlord in `ConversationModule`.
2. **Mediation Notice:** Dispatch official in-app message to both parties outlining platform guidelines.
3. **Escalation & Resolution:**
   - If landlord unjustly withholds deposit, landlord's verified badge is suspended pending resolution.
   - If tenant engaged in property destruction, tenant account is reviewed for suspension.
   - Record resolution notes in `AuditLog` and update ticket status to `RESOLVED`.

## 3. Fraud Investigation & Listing Takedown

1. **Report Trigger:** Triggered by report categories `FAKE_LISTING`, `WRONG_LOCATION`, or `UNSAFE_PROPERTY`.
2. **Investigation:** Compare property photos with duplicate detection hash and check NADRA CNIC consistency.
3. **Action:**
   - Execute `POST /api/v1/support/listings/takedown`.
   - Property status transitions to `SUSPENDED`.
   - Listing is instantly purged from search and sitemap.
   - Landlord receives automated notification citing specific reason.

## 4. Appeals & Ombudsman Process

1. Landlords or tenants whose listings or accounts are suspended can submit an appeal via `POST /api/v1/support/appeals`.
2. Appeals are independently reviewed by a Super Admin or designated Ombudsman.
3. Decision is final and logged immutably in the system audit trail.
