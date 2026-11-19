# Peshawar Rental Marketplace: Release Notes (v1.0.0-GA)

**Release Version**: v1.0.0-GA  
**Target City**: Peshawar, Khyber Pakhtunkhwa, Pakistan  
**Commit**: Production Certified

---

## 1. Overview

We are proud to announce the General Availability (GA) release of the **Peshawar Rental Marketplace**, the dedicated municipal-grade rental platform designed to bring transparency, safety, and zero-commission living to students, families, and landlords across Peshawar.

By replacing opaque real estate brokerages with verified NADRA-compliant listings, separate student vs. family portals, and digital lease workflows, Rental Peshawar sets a new benchmark for Pakistani PropTech.

---

## 2. Key Features & Highlights

### A. Non-Negotiable Tenant Eligibility Segregation

- **Student Mode**: Curated specifically for university and college students attending University of Peshawar, Islamia College, Khyber Medical College, IM|Sciences, CECOS, and FAST-NUCES. Features student hostels, shared dorms, meal plan verifications, study tables, and solar backup ratings.
- **Family Mode**: Dedicated family portal featuring independent upper and lower portions, standalone homes, and apartments. Emphasizes independent Wapda/solar meters, tube-well water confirmations, peaceful gated streets, and proximity to top schools and parks.
- **Strict Privacy Barrier**: Cross-role data leaks are completely blocked at the database, search indexing, and inquiry API layers.

### B. Peshawar Municipal Bounding Box & Locality Engine

- Properties strictly validated within the official Peshawar municipal perimeter (33.90°N–34.15°N, 71.35°E–71.70°E).
- 15 municipal localities with localized rental intelligence: Hayatabad (Phases 1-7), University Town, Peshawar Cantt, Saddar, Warsak Road, Regi Model Town, DHA Peshawar, Gulbahar, Dalazak Road, Charsadda Road, Kohat Road, Ring Road, GT Road, Board Bazar, and Industrial Estate.

### C. Landlord Direct Onboarding (0% Dealer Fee)

- Landlords save up to 100% on traditional broker commissions (typically 1 full month rent).
- 7-step listing wizard with duplicate photo protection, title deed verification, and listing quality scoring.
- Verification badge awarded upon NADRA CNIC and municipal utility bill audit.

### D. Secure Messaging & Real-Time Inquiries

- Tenant inquiries gated by eligibility verification.
- Real-time WebSocket messaging with end-to-end conversation auditing and abuse reporting.
- Landlord contact details and WhatsApp click-to-chat links revealed only upon mutual inquiry acceptance.

### E. Digital Tenancy Agreements & Escrow Workflow

- Legally vetted KP Tenancy Act compliant rental agreements generated digitally.
- Dual-party cryptographic signing with tamper-evident audit trails.
- Offline and digital security deposit workflows backed by structured ledger accounting and refund protection.

### F. High-Performance Discovery, SEO & AEO

- Programmatic SEO pages for every locality and category combination (`/rentals/peshawar/:locality/:category`).
- Schema.org compliant structured data with truth-in-schema pricing and real-time availability.
- Sub-500ms p95 search latency powered by Redis caching and PostGIS spatial indexing.

### G. Commercialization & Monetization

- **Free Forever for Tenants**: Zero search fees, zero contact charges, zero commission.
- **Landlord Tiers**: Free Starter (up to 2 active listings), Pro Landlord (8 listings, verified badge, 2 free boosts), and Agency Suite (35 listings, bulk upload, team seats).
- **Listing Boosts**: Featured badges, top search placements, and locality sponsorships.
- **Pakistani Payment Methods**: Meezan Bank IBAN transfer, JazzCash, EasyPaisa with automated KPRA tax invoices and credit notes.

### H. Multi-Platform Synchronization

- Native Flutter mobile application for Android and iOS.
- Responsive Next.js web application for desktop and mobile web browsers.
- Next.js Administrative Command Center for moderation, verifications, fraud analysis, and commercial management.

---

## 3. Security & Operational Hardening

- **Argon2id** password hashing with 64MB memory cost.
- **NADRA CNIC Tokenization**: AES-256-GCM encryption on all identity documents.
- **Zero-Trust Network Perimeter**: Cloudflare WAF, strict rate limiting, and CORS restrictions.
- **Immutable Audit Logging**: Every administrative action, privilege grant, and financial transaction permanently logged.
- **Marketing Compliance**: Pakistan Standard Time quiet hours (22:00–08:00 PKT) and daily frequency caps (max 2 messages/day).

---

## 4. System Requirements & Compatibility

- **Web**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+, Mobile Safari, Chrome Mobile.
- **Android**: Android 8.0 (API Level 26) or higher.
- **iOS**: iOS 14.0 or higher.
- **Backend API**: Node.js 22 LTS, PostgreSQL 16 with PostGIS 3.4+, Redis 7+.

---

## 5. Upgrade & Migration Notes

- Database migrations 01 through 20 are cumulative. Run `pnpm --filter api prisma:migrate:deploy` prior to launching container services.
- Seed data has been verified and validated. Run `pnpm --filter api prisma:seed` for base locality geometries.
