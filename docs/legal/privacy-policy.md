# Privacy Policy — Rental Peshawar

**Effective Date:** November 2026  
**Jurisdiction:** Khyber Pakhtunkhwa, Islamic Republic of Pakistan  
**Applicability:** Tenants (Students and Families), Landlords, Property Managers, and Platform Operators.

---

## 1. Scope & Objective

Rental Peshawar operates as an ethical, segregated rental marketplace dedicated exclusively to the metropolitan area of Peshawar, Khyber Pakhtunkhwa. This Privacy Policy outlines how personal data, identity documentation (CNIC, student ID cards), property metadata, and communication records are collected, stored, processed, and safeguarded.

## 2. Personal Data We Collect

1. **Tenant Profiles:**
   - **Student Tenants:** Full name, phone number, institutional email, university name, student ID / roll number, and student identity card scans.
   - **Family Tenants:** Full name, phone number, email address, family size, marital/household status, and emergency contact details.
2. **Landlord Profiles:**
   - Full name, phone number, WhatsApp contact, CNIC number (13 digits), CNIC front and back scans, selfie/liveness verification, and property ownership documentation.
3. **Property Listings:**
   - Geolocation coordinates (latitude and longitude), physical address, photographs, rent rates, security deposit, and utility availability.
4. **Communications & Logs:**
   - In-app inquiry submissions, visit scheduling requests, direct messages, report submissions, IP addresses, device identifiers, and immutable audit logs.

## 3. Data Protection & Cryptographic Security

- **CNIC Security:** CNIC numbers are hashed using SHA-256 (`cnicNumberHash`) for deduplication checks and encrypted with AES-256-GCM (`cnicNumberEncrypted`) at rest. Only masked numbers (`17301-*******-1`) are displayed to administrators.
- **Identity Document Quarantine:** CNIC scans and student ID cards are stored in private, non-public object storage buckets accessible solely through short-lived signed URLs.
- **Session Security:** Passwords hashed using `bcrypt` (12 rounds). Refresh tokens are rotated with automated family reuse detection.

## 4. Segregation and Privacy Controls

- Student listings and family listings are isolated at the database query level via strict PostGIS spatial and eligibility filters.
- Landlord WhatsApp phone numbers are strictly concealed until a tenant submits an inquiry that the landlord accepts.
- Public search engines (Google, Bing) and sitemaps index only approved public listings and localities; no personal user dashboards or private chat messages are ever exposed.

## 5. User Rights & Data Retention

- Users may request account soft-deletion or data export by contacting `privacy@rentalpeshawar.pk`.
- Audit logs associated with security actions, suspensions, and moderation decisions are preserved immutably for legal compliance under Pakistani law.
