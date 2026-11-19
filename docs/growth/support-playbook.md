# Customer Support & Operations Playbook

## 1. Support Channels & Operating Hours

- **In-App Messaging & Support Tickets**: 24/7 logging; real-time agent responses 8:00 AM – 10:00 PM PKT.
- **WhatsApp Business Concierge**: Automated triage bot + live agent routing for quick landlord assistance.
- **Emergency Safety Helpline**: Dedicated emergency line for active safety incidents, illegal lockouts, or fraud reports.

## 2. Service Level Agreements (SLAs)

| Issue Severity       | Category                                                               | Initial Response SLA | Target Resolution                                   |
| :------------------- | :--------------------------------------------------------------------- | :------------------- | :-------------------------------------------------- |
| **SEV 1 - Critical** | Harassment, physical threat, severe fraud, unauthorized lockout        | < 15 minutes         | Immediate account suspension & emergency escalation |
| **SEV 2 - High**     | Payment / escrow dispute, identity verification block, missing deposit | < 1 hour             | < 6 hours                                           |
| **SEV 3 - Medium**   | Listing moderation delay, billing invoice query, referral reward delay | < 4 hours            | < 24 hours                                          |
| **SEV 4 - Low**      | General feedback, feature request, amenity update assistance           | < 12 hours           | < 48 hours                                          |

## 3. Standard Troubleshooting Protocols

### 3.1 Landlord Inquiring About Moderation Delay

1. Check listing status in Admin Console (`/admin/properties`).
2. If pending review: confirm whether photos meet resolution threshold and CNIC verification is valid.
3. If rejected: explain the exact corrective action needed (e.g. upload exterior street photo or clarify utility terms).

### 3.2 Tenant Reporting Deposit Issue

1. Check whether booking was executed through RentPeshawar Digital Agreement & Escrow.
2. If through platform escrow: initiate formal `Dispute` workflow; freeze payout funds pending mutual release or mediation.
3. If handled offline in cash without platform agreement: issue advisory guidelines, offer police verification documentation assistance, and record internal landlord trust warning.
