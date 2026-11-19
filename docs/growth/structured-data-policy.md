# Structured Data (Schema.org / JSON-LD) Policy

## 1. Compliance Baseline & Format

In adherence to Google Search Central guidelines, all structured data on Rental Peshawar is delivered exclusively via **JSON-LD** embedded in the initial server-rendered HTML. Microdata and RDFa formats are avoided.

---

## 2. Mandatory Schema Mappings by Entity

### A. Global WebSite & Organization

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "RealEstateAgent",
      "@id": "https://rentalpeshawar.pk/#organization",
      "name": "Rental Peshawar",
      "url": "https://rentalpeshawar.pk",
      "logo": "https://rentalpeshawar.pk/static/brand/logo.png",
      "areaServed": {
        "@type": "AdministrativeArea",
        "name": "Peshawar, Khyber Pakhtunkhwa, Pakistan"
      }
    },
    {
      "@type": "WebSite",
      "@id": "https://rentalpeshawar.pk/#website",
      "url": "https://rentalpeshawar.pk",
      "name": "Rental Peshawar",
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://rentalpeshawar.pk/properties?q={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    }
  ]
}
```

### B. Property Details Page (`Residence` / `Accommodation` + `Offer`)

```json
{
  "@context": "https://schema.org",
  "@type": "Apartment",
  "name": "2 Bed Family Apartment in Hayatabad Phase 5",
  "description": "Spacious 2 bedroom apartment for families in Hayatabad Phase 5, Peshawar with 24/7 security and dedicated parking.",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Hayatabad",
    "addressRegion": "Khyber Pakhtunkhwa",
    "addressCountry": "PK"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 33.9925,
    "longitude": 71.4382
  },
  "numberOfBedrooms": 2,
  "numberOfBathroomsTotal": 2,
  "offers": {
    "@type": "Offer",
    "price": "45000",
    "priceCurrency": "PKR",
    "availability": "https://schema.org/InStock",
    "validFrom": "2026-11-01",
    "url": "https://rentalpeshawar.pk/properties/2-bed-family-apartment-hayatabad-phase-5"
  }
}
```

---

## 3. Strict Truth-in-Schema Rules

1. **Zero Fake Reviews / Ratings**: `AggregateRating` is omitted unless genuine, verified tenant reviews exist in PostgreSQL (`Review` table). The schema rating must match the visible average rating exactly.
2. **Availability Consistency**: If a property is `RENTED` or `UNAVAILABLE`, the `offers.availability` must immediately flip to `https://schema.org/OutOfStock`.
3. **No Indexing of Blocked Resources**: Any listing page with `noindex` or `404` status must not output structured data claiming live stock.
4. **Visible Content Parity**: Every attribute marked in JSON-LD (rent, bedrooms, locality, amenities) must be plainly visible to human users reading the page.
