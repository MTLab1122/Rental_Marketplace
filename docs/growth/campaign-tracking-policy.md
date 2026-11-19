# Campaign Tracking & Attribution Policy

## 1. UTM Parameter Governance

All incoming acquisition links from digital ads, influencer marketing, social media, and newsletters must conform to standard lowercase kebab-case syntax:

| Parameter      | Allowed Values / Conventions                                                                         | Example                  |
| :------------- | :--------------------------------------------------------------------------------------------------- | :----------------------- |
| `utm_source`   | Platform origin: `google`, `facebook`, `instagram`, `tiktok`, `whatsapp`, `newsletter`, `offline_qr` | `google`                 |
| `utm_medium`   | Channel type: `cpc`, `cpa`, `social`, `referral`, `qr_flyer`, `direct`                               | `cpc`                    |
| `utm_campaign` | Objective + Audience + Season: `[city]-[target]-[season]-[year]`                                     | `pesh-students-fall2026` |
| `utm_term`     | Target search keyword or audience cluster                                                            | `hostels_near_uop`       |
| `utm_content`  | Creative asset / variant identifier: `banner_v1`, `video_ugc_02`                                     | `video_ugc_02`           |

## 2. Multi-Touch Attribution Model

RentPeshawar records both **First-Touch** and **Last-Touch** parameters in `CampaignAssignment` records:

- **First-Touch Attribution**: Identifies which top-of-funnel campaign originally introduced the user to RentPeshawar.
- **Last-Touch Attribution**: Identifies the immediate marketing trigger that caused the user to submit an inquiry, register as a landlord, or complete a booking.
- **Conversion Window**: 30-day lookback window for web cookie sessions; 90-day window for mobile app installs.

## 3. Strict PII & Privacy Prohibitions

1. **Never Place PII in URLs**: It is strictly prohibited to encode phone numbers, CNIC numbers, tenant names, or plain-text email addresses in UTM parameters, referrer strings, or deep links.
2. **Server-Side Sanitization**: The API gateway automatically strips sensitive query keys before saving campaign telemetry logs.
3. **Cookie Consent & Respect**: Users who opt out of analytics tracking have their marketing identifiers hashed and randomized.
