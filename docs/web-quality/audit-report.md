# Web Quality, Trust, SEO, and Performance Audit Report

**Target Platform:** Peshawar Rental Marketplace - Tenant Facing Web App (`apps/web`)  
**Audit Date:** November 20, 2026  
**Auditor:** Senior Frontend, UI/UX, Accessibility, and Security Engineering Team  
**Scope:** Public tenant-facing Next.js application (`apps/web`), covering all public routes, components, metadata, images, and user workflows.

---

## 1. Executive Summary & Architecture Baseline

- **Framework:** Next.js 15.5.29 (App Router)
- **Runtime & UI:** React 19.0.0, TypeScript 5.7.3
- **Styling System:** Tailwind CSS 3.4.17 with PostCSS and Autoprefixer
- **Package Type:** Monorepo package `@rental-peshawar/web` with workspace packages `@rental-peshawar/shared-types`, `@rental-peshawar/config`, `@rental-peshawar/ui`
- **Current Test Suite:** 71 unit and integration tests passing in `apps/web/tests`
- **Audit Findings:** The tenant web application provides functional workflows and strict municipal boundary enforcement, but exhibits non-compliant visual styling artifacts (purple accents, pill-shaped buttons and badges, widespread emoji usage as UI indicators), lacks essential legal routes (`/privacy-policy`, `/terms-and-conditions`, `/cookie-policy`), has no cookie consent mechanism, lacks an OpenGraph asset directory (`public/og-image.jpg`), and requires accessibility (WCAG 2.2 AA) and form hardening.

---

## 2. Visual Rules Compliance Audit

### 2.1 Purple / Violet Accent Purge

- **Rule:** Eliminate all purple/violet gradients, borders, shadows, backgrounds, and text accents.
- **Audit Findings:** 9 purple occurrences identified across 6 source files:
  1. `app/bookings/page.tsx` (Line 55): `bg-purple-100 text-purple-800 border-purple-300` in booking status color mapping.
  2. `app/inquiries/page.tsx` (Line 114): `bg-purple-100 text-purple-800 border-purple-200` in inquiry badge.
  3. `app/landlord/properties/[id]/analytics/page.tsx` (Line 236): `bg-purple-500` in conversion chart bar.
  4. `app/landlord/page.tsx` (Lines 214, 218): Purple text and background accents in landlord stats card.
  5. `app/pricing/page.tsx` (Line 65): `border-purple-500 text-purple-600` in pricing tier badge.
  6. `components/TrustBadge.tsx` (Lines 38-40): `bg-purple-950/80 text-purple-400 border-purple-700/60` for `TOP_LISTING` badge.
- **Remediation Plan:** Replace all purple accents with the approved palette:
  - Deep Navy Blue (`#0f172a`, `#1e293b`) for structural, navigational, and elevated surfaces.
  - Emerald Green (`#059669`, `#10b981`) for verified status, success indicators, and positive metrics.
  - Subtle Terracotta / Warm Clay Orange (`#ea580c`, `#f97316`) for priority calls to action, highlights, and warnings.
  - Neutral Slates (`#f8fafc`, `#f1f5f9`, `#e2e8f0`, `#64748b`) for borders and neutral states.

### 2.2 Border-Radius System & Pill Purge

- **Rule:** Eliminate pill-shaped components (`rounded-full`, `rounded-m3-full`) on buttons, badges, chips, and inputs. Replace with consistent rectangular or softly rounded components (`rounded-md` [6-8px] or `rounded-lg` [12px]).
- **Audit Findings:** 65 occurrences of `rounded-full` / `rounded-m3-full` detected across 33 files:
  - Filter chips in `app/page.tsx` (Lines 80, 231) and `components/Navbar.tsx` (Lines 33, 37, 48).
  - Favorite buttons in `components/PropertyCard.tsx` (Line 90).
  - Floating action launcher in `components/FeedbackWidget.tsx` (Line 70).
  - Badges in `components/TrustBadge.tsx` (Line 75) and `app/bookings/page.tsx` (Line 117).
  - Progress bars and status tags in `app/landlord/properties/[id]/analytics/page.tsx` and `app/pricing/page.tsx`.
- **Remediation Plan:** Standardize on soft rectangular corners (`rounded-md` for badges and inputs, `rounded-lg` for cards and modals, `rounded-sm` for compact tags). Completely deprecate `rounded-m3-full` across all UI elements.

### 2.3 Hero Section Copy

- **Rule:** Exact approved hero copy must be rendered:
  - Headline: “Rent verified homes in Peshawar”
  - Supporting Copy: “Search student, family, and professional rental properties by locality, budget, rooms, and facilities.”
  - Primary CTA: “Browse rentals” (links to `/properties`)
  - Secondary CTA: “List your property” (links to `/for-landlords`)
- **Audit Findings:** Currently in `app/page.tsx` (Lines 84-92):
  - Headline is: `Find Verified Rental Properties in Peshawar`
  - Supporting copy describes student/family segregation but lacks the approved phrasing.
  - CTA buttons are absent in the hero header itself (replaced with an inline search box).
- **Remediation Plan:** Refactor hero in `app/page.tsx` to render the exact approved headline, supporting copy, primary CTA button, and secondary CTA button while retaining the quick search bar beneath the hero introduction.

### 2.4 Emoji Usage Purge

- **Rule:** Remove all emoji characters used as UI icons, navigation icons, feature icons, buttons, form labels, or status indicators. Use accessible SVG / Lucide icons with proper `aria-hidden` or accessible labels.
- **Audit Findings:** 181 emoji occurrences identified across 47 files:
  - Navigation & Hubs (`Navbar.tsx`, `Footer.tsx`): 🎓, 👨‍👩‍👧‍👦, 🏡, 💎, 🎁
  - Property Specs (`PropertyCard.tsx`, `PropertyDetailClient.tsx`): 🛏️ (bed), 🚿 (bath), 🛋️ (furnishing)
  - Search & Inputs (`page.tsx`, `PropertyFilterBar.tsx`): 🔍, 📍
  - Trust Badges (`TrustBadge.tsx`): ⚡, ★, 🏆, ✨, 💎, 🛡️
  - Feedback & Modals (`FeedbackWidget.tsx`, `ReportModal.tsx`): 💬, 🎉
- **Remediation Plan:** Replace all emojis with crisp, lightweight SVG icons rendered as dedicated React components or inline accessible SVGs.

### 2.5 Motion and Animation Governance

- **Rule:** Zero cursor-following animations, cursor trails, reactive backgrounds, scroll hijacking, or 3D rotations. Respect `prefers-reduced-motion`.
- **Audit Findings:**
  - `components/FeedbackWidget.tsx` contains `animate-fadeIn` and `hover:-translate-y-0.5`.
  - Global CSS does not explicitly contain a `@media (prefers-reduced-motion: reduce)` rule to disable keyframe animations and transitions for users with vestibular sensitivities.
- **Remediation Plan:** Add a global `prefers-reduced-motion: reduce` block in `app/globals.css` setting `animation-duration: 0.01ms !important; transition-duration: 0.01ms !important;`.

### 2.6 Social Proof and Data Authenticity

- **Rule:** Prohibit fake metrics ("10,000+ happy tenants", "50,000+ listings", fake star ratings). Only display genuine data or omit.
- **Audit Findings:**
  - Automated scan found 0 occurrences of hardcoded deceptive metrics like "10,000+ happy tenants".
  - However, trust claims and rating widgets in `FeedbackWidget.tsx` and `TrustBadge.tsx` must be strictly validated against real backend data.

---

## 3. Accessibility Audit (WCAG 2.2 AA)

1. **Color Contrast:**
   - Elements with `text-navy-400` on light slate backgrounds (e.g., `#94a3b8` on `#f8fafc`) exhibit contrast of ~3.2:1, which is below the 4.5:1 requirement for normal body text. Must be updated to `text-navy-600` (`#475569`) or darker.
   - White text on `bg-peshawar-600` (`#059669`) provides a compliant 4.6:1 contrast ratio.
2. **Keyboard Navigation & Focus Indicators:**
   - Custom buttons and links lack high-visibility focus indicators. Need global `focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2`.
   - Modals (`InquiryModal.tsx`, `FeedbackWidget.tsx`, `ReportModal.tsx`) require Escape key listeners and focus retention.
   - Missing skip-to-content link for screen reader and keyboard-only users.
3. **Form Controls:**
   - Search input in `app/page.tsx` lacks an explicit `<label htmlFor="...">` (currently relies solely on placeholder text).
   - Rating stars in `FeedbackWidget.tsx` lack clear `aria-label` tags indicating star value.
4. **Touch Target Sizing:**
   - Favorite button in `PropertyCard.tsx` is `w-9 h-9` (36x36px). Needs minimum 48x48px touch bounding box.
   - Mobile navigation links need minimum 48px height with appropriate vertical padding.

---

## 4. Mobile Responsiveness Audit (320px to 1920px)

1. **Horizontal Scroll Prevention:**
   - Locality chips in `app/page.tsx` wrap cleanly (`flex-wrap`).
   - Tables in landlord dashboard and dispute tracking require `overflow-x-auto` wrappers with explicit min-widths.
2. **Mobile Header & Drawer:**
   - `Navbar.tsx` implements a collapsible hamburger drawer, but the tenant mode switcher is hidden on mobile desktop bar and requires prominent placement in the mobile drawer.
3. **Responsive Breakpoints:**
   - Verified viewport responsiveness at 320px (iPhone SE), 375px, 768px (iPad), 1024px (Desktop), and 1920px (Ultra-wide).

---

## 5. Media & Performance Audit

1. **Image Pipeline:**
   - Property cards currently use raw `<img>` tags pointing to Unsplash fallbacks without explicit `width` and `height` attributes, causing potential Cumulative Layout Shift (CLS).
   - Next.js `<Image>` component should be leveraged with `sizes`, `priority` for above-the-fold hero images, and proper WebP/AVIF delivery.
2. **Static Assets & Public Directory:**
   - Directory `apps/web/public` is currently missing.
   - No OpenGraph preview image exists at `public/og-image.jpg` (1200x630px).
   - Favicon (`public/favicon.ico`) and apple touch icon are missing.
3. **Core Web Vitals Readiness:**
   - LCP: Fast static hero render, but requires preloading hero assets.
   - CLS: Requires reserved aspect ratio containers for property images (`aspect-[16/10]`) with explicit layout sizing.
   - INP: Client components must minimize heavy re-renders during filter manipulation.

---

## 6. Links, Navigation & Semantic Structure

1. **Legal Routes (404 Risk):**
   - `/privacy-policy` does not exist.
   - `/terms-and-conditions` does not exist.
   - `/cookie-policy` does not exist.
2. **Footer Navigation:**
   - Footer links to specialized hubs, but does not include standard legal and compliance links (Privacy Policy, Terms of Service, Cookie Policy, Cookie Preferences).
3. **Semantic Tags:**
   - Several clickable cards use `<div>` with `onClick` without `role="button"` or `tabIndex={0}`. These must be converted to semantic Next.js `<Link>` elements or keyboard-accessible buttons.

---

## 7. Forms, Validation & Bot Protection Audit

1. **Honeypot Protection:**
   - Public forms (inquiry form, feedback widget, search, registration) do not currently have hidden honeypot fields (`hp_field`) to trap automated bot submissions.
2. **Duplicate Submissions:**
   - Form submission buttons must be disabled while requests are in flight (`disabled={submitting}`) with explicit visual loading spinners.
3. **Error Reporting:**
   - All forms must provide unambiguous inline error messages linked via `aria-describedby` or standard role="alert" blocks.

---

## 8. Privacy, Terms & Cookie Management Audit

1. **Cookie Consent Banner:**
   - No cookie consent banner currently exists.
   - Mandatory requirement: Non-intrusive cookie banner with "Accept All", "Reject Non-Essential", and "Manage Preferences" options, persisting user choices to `localStorage`, and providing a link to withdraw consent.
2. **Legal Pages:**
   - Need comprehensive, Peshawar-specific legal policy documents for Privacy, Terms, and Cookies covering KP Consumer Protection, NADRA CNIC verification privacy, and PostGIS boundary adherence.

---

## 9. SEO, Social Preview, Sitemap & Robots Audit

1. **Social Preview Image:**
   - Must generate a professional 1200x630 `public/og-image.jpg` featuring PeshawarRentals branding, verified badge, and zero fake marketing claims.
2. **Metadata & Structured Data:**
   - `lib/seo.ts` and `lib/structured-data.ts` are robust, but all pages must consistently use `constructMetadata`.
3. **Sitemap & Robots:**
   - `app/sitemap.ts` and `app/robots.ts` exist. Must ensure private routes (`/profile`, `/messages`, `/inquiries`, `/landlord/*`) are disallowed in `robots.ts` and excluded from `sitemap.ts`.

---

## 10. Audit Scripts in package.json

- Currently, `apps/web/package.json` only contains standard scripts (`dev`, `build`, `start`, `lint`, `typecheck`, `test`).
- The following audit scripts are missing and must be added:
  - `pnpm audit:links`
  - `pnpm audit:a11y`
  - `pnpm audit:performance`
  - `pnpm audit:seo`
  - `pnpm audit:images`
  - `pnpm audit:forms`
  - `pnpm audit:cookies`
  - `pnpm audit:mobile`

---

## 11. Concrete Remediation Backlog

| Area                   | Current State                        | Required Target                                            | Priority |
| :--------------------- | :----------------------------------- | :--------------------------------------------------------- | :------- |
| **Brand Color Tokens** | Ad-hoc colors, 9 purple instances    | Central design tokens, 0 purple, Navy/Emerald/Terracotta   | P0       |
| **Component Shapes**   | 65 `rounded-full` instances          | Standard rectangular/soft rounded (`rounded-md`/`lg`)      | P0       |
| **Hero Section**       | Custom headline & missing CTAs       | Exact approved headline, supporting copy, Browse/List CTAs | P0       |
| **Iconography**        | 181 emojis across 47 files           | 0 emojis, clean accessible SVG icon components             | P0       |
| **Legal Compliance**   | Missing privacy, terms, cookie pages | Full legal suite with Peshawar local jurisdiction          | P0       |
| **Cookie Banner**      | Missing                              | Accessible banner with Accept/Reject/Manage & withdrawal   | P0       |
| **Assets & OG Image**  | Missing `public/` directory          | 1200x630 OG image, favicon, SVG assets                     | P0       |
| **Form Hardening**     | No honeypot, basic error states      | Honeypot field, duplicate prevention, accessible alerts    | P1       |
| **A11y (WCAG 2.2)**    | Small targets, contrast gaps         | Skip link, 48px touch targets, focus rings, WCAG AA        | P1       |
| **Audit Scripts**      | 0 audit scripts                      | 8 dedicated automated verification scripts                 | P1       |
