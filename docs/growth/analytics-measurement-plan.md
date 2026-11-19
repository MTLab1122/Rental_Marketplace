# Analytics & Measurement Plan (SEO & Growth)

## 1. Overview & Objectives

This measurement plan outlines event tracking, conversion goals, and organic attribution mechanisms across the tenant web app (`apps/web`) and mobile clients.

## 2. Core Search & Discovery Events

All discovery interactions are tracked via a client/server analytics dispatcher:

| Event Name              | Trigger Condition                           | Parameters                                                                  |
| :---------------------- | :------------------------------------------ | :-------------------------------------------------------------------------- |
| `page_view`             | Initial page load (SSR & client navigation) | `page_path`, `page_title`, `referrer`, `locality`                           |
| `property_view`         | User opens property details page            | `property_id`, `locality`, `property_type`, `rent_pkr`, `landlord_verified` |
| `search_filter_applied` | Filter adjusted on search/locality page     | `locality`, `property_type`, `min_rent`, `max_rent`, `amenities`            |
| `locality_view`         | User opens programmatic locality hub        | `locality_slug`, `inventory_count`, `average_rent`                          |
| `guide_read`            | User scrolls past 50% on editorial guide    | `guide_slug`, `category`, `reading_time_sec`                                |

## 3. High-Intent Conversion Events

Conversions indicate genuine tenant/landlord transaction velocity:

| Conversion Event    | Trigger                                   | Value Attribution                    |
| :------------------ | :---------------------------------------- | :----------------------------------- |
| `favorite_toggle`   | Listing saved to favorites                | Engagement indicator                 |
| `inquiry_initiated` | Inquiry modal opened                      | Lead intent                          |
| `inquiry_submitted` | Formal inquiry sent to landlord           | Primary conversion (Weight: 1.0)     |
| `whatsapp_click`    | Landlord direct contact clicked           | Primary conversion (Weight: 0.8)     |
| `booking_start`     | Rental booking request created            | High-intent transactional conversion |
| `booking_complete`  | Rental booking confirmed & deposit placed | Revenue conversion                   |

## 4. Attribution & UTM Governance

- **Default UTM Parameters**:
  - `utm_source`: `google`, `bing`, `facebook`, `whatsapp`, `newsletter`
  - `utm_medium`: `organic`, `cpc`, `referral`, `social`
  - `utm_campaign`: Campaign slug (e.g., `peshawar-student-fall2026`)
  - `utm_content`: Specific link placement or banner ID
- **Organic Traffic Isolation**: Organic landing pages must strip tracking parameters from canonical tags to prevent index dilution.

## 5. Google Search Console & Monitoring Cadence

- Sitemaps submitted: `https://rentpeshawar.pk/sitemap.xml`
- Weekly indexing audits: Monitor excluded URLs, crawl anomalies, and Core Web Vitals field data.
- Search performance reporting: Track average position, clicks, and impressions for target Peshawar keyword clusters.
