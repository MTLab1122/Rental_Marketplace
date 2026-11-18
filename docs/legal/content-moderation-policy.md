# Content Moderation Policy — Rental Peshawar

This policy governs the review, approval, rejection, and removal of listings, photos, and user messages on Rental Peshawar.

## 1. Automated Checks (Level 1)

- **Boundary Verification:** Coordinates are validated against PostGIS Peshawar boundary polygon. Out-of-bounds coordinates are rejected immediately (HTTP 422).
- **Eligibility Validation:** Mismatches between eligibility and property type (e.g. Student + House, Family + Hostel) are blocked at the DTO layer.
- **Profanity & Contact Leakage Filter:** Phone numbers in public property descriptions or titles are stripped or flagged to prevent bypassing the verification workflow.

## 2. Human Moderation Queue (Level 2)

- All new and edited listings enter `PENDING_REVIEW` status.
- Trained moderators verify:
  - Photo quality and originality (no watermark, no nudity, no irrelevant content).
  - Accurate pricing reflecting prevailing Peshawar locality benchmarks.
  - Realistic descriptions with authentic amenities.
- Standard Moderation SLA: Review within 4 hours.

## 3. Community Reporting & Rapid Takedown (Level 3)

- When a listing receives a report with categories `FAKE_LISTING`, `UNSAFE_PROPERTY`, or `HARASSMENT`, it is prioritized in the Admin Report Resolution console.
- An administrator may execute immediate listing takedown (`takedownListing`), which immediately changes property status to `SUSPENDED`, purges it from search discovery, and alerts the landlord with an audit-backed reason.
- Landlords have the legal right to submit an appeal via the Ombudsman workflow in the Support module.
