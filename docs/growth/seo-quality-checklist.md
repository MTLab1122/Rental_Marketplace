# SEO Quality Checklist

This checklist must be satisfied before any new programmatic route, dynamic listing page, or editorial guide is published and indexed.

## 1. Technical & Crawlability Checks

- [ ] **HTTP Status Code**: Page returns `200 OK` for live resources; `404 Not Found` for nonexistent resources; `410 Gone` for permanently removed inventory.
- [ ] **Canonical URL**: Exact canonical URL matching protocol (`https://`), domain (`rentpeshawar.pk`), and path without trailing slash.
- [ ] **Robots Directives**: Page has `index, follow` for public pages; `noindex, nofollow` for authenticated or sensitive query pages (`/api/`, `/admin/`, `/messages/`, etc.).
- [ ] **XML Sitemap Inclusion**: URL is present in `sitemap.xml` if and only if it is active, public, and approved.

## 2. On-Page Metadata & Content Standards

- [ ] **Title Tag**: Format matches `[Target Keyword / Property Title] | [Locality], Peshawar | RentPeshawar` (50–60 characters).
- [ ] **Meta Description**: Specific summary including rent, bedrooms, locality, and utility status (130–155 characters).
- [ ] **Heading Structure**: Single `H1` matching primary intent; logical `H2` and `H3` nesting.
- [ ] **Zero Thin Content**: Programmatic pages must feature active listing inventory or local market statistics.
- [ ] **Image Optimization**: All property and guide images include descriptive, contextual `alt` text; modern formats (WebP/AVIF) served with proper width/height attributes to prevent CLS.

## 3. Structured Data & Schema Validation

- [ ] **Schema Conformance**: JSON-LD passes Google Rich Results Test without critical errors.
- [ ] **Truth-in-Schema**:
  - `priceCurrency` is strictly `"PKR"`.
  - `availability` reflects true status (`InStock` for available, `Discontinued` for rented/inactive).
  - No fake reviews or artificially inflated `AggregateRating`.
- [ ] **Breadcrumbs**: Emits valid `BreadcrumbList` linking root -> Peshawar -> locality -> property.

## 4. Local & Answer Engine (AEO) Optimization

- [ ] **Direct Answer Block**: Editorial guides start with a concise 40–60 word answer paragraph.
- [ ] **Local Context**: References verified Peshawar landmarks, BRT stations, or educational institutions.
- [ ] **Internal Links**: Minimum 3 contextual internal links connecting related localities or categories.

## 5. Performance & Mobile Readiness

- [ ] **Core Web Vitals**:
  - LCP $\le 2.5\text{s}$
  - INP $\le 200\text{ms}$
  - CLS $\le 0.1$
- [ ] **Mobile Responsiveness**: Viewport tag properly configured; no tap targets closer than 8px.
