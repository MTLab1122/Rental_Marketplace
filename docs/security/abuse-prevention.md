# Peshawar Rental Marketplace — Abuse Prevention & Velocity Control

Phase 16: Security Hardening & Marketplace Defense

This document specifies velocity limits, rate limiting, bot protection, and shadow-ban heuristics designed to safeguard Peshawar marketplace operations against spam, denial of service, and scraping.

---

## 1. Velocity Constraints & Rate Limits

| Action                        | Velocity Limit                | Scope            | Triggered Penalty                                   |
| :---------------------------- | :---------------------------- | :--------------- | :-------------------------------------------------- |
| **User Login**                | 5 failed attempts per 15 mins | Account & IP     | 15-minute temporary lockout + email security alert. |
| **Property Creation**         | 10 listings per day           | Landlord Account | Rate-limited with `429 Too Many Requests`.          |
| **Inquiry Submission**        | 15 inquiries per hour         | Tenant Account   | Rate-limited with `429 Too Many Requests`.          |
| **Direct Chat Messaging**     | 30 messages per minute        | User Account     | Message queued with delay / throttled.              |
| **Complaint / Report Filing** | 5 reports per day             | User Account     | Rate-limited; requires manual support ticket.       |
| **Review Submission**         | 3 reviews per day             | Tenant Account   | Enforces 1 review per completed verified booking.   |
| **Public Search Queries**     | 60 requests per minute        | IP Address       | Progressive HTTP 429 throttling.                    |

---

## 2. Disposable Email & Malicious Bot Defense

1. **Disposable Email Filter:**
   - Registrations matching disposable or temporary email providers (`tempmail`, `10minutemail`, `mailinator`, `guerrillamail`) are rejected during signup DTO validation.
2. **Pakistani Phone Number Validation:**
   - Must conform to E.164 standard (`+923XXXXXXXXX`) with valid mobile network codes (Jazz 030X, Telenor 034X, Zong 031X, Ufone 033X).
3. **Shadow-Banning / Account Restriction:**
   - Accounts scoring in the **CRITICAL** fraud tier (> 80) are placed under a shadow restriction where their public inquiries and listings are suppressed from search results pending human administrative audit.
