# Service Level Objective (SLO) Policy

## 1. Overview & SRE Framework

This document defines the 11 binding Service Level Objectives (SLOs) governing the Peshawar Rental Marketplace. Every service boundary has measurable Service Level Indicators (SLIs), defined evaluation windows, and strict error budget consequences.

---

## 2. Master SLO Catalog

| #      | Service Boundary                 | Indicator (SLI) Formula                                                                                                  | Monthly Target (SLO) | Window         | Primary Monitoring Metric                                         |
| :----- | :------------------------------- | :----------------------------------------------------------------------------------------------------------------------- | :------------------- | :------------- | :---------------------------------------------------------------- |
| **1**  | **API Overall Availability**     | $\frac{\text{Successful HTTP Requests (2xx, 3xx, 4xx)}}{\text{Total HTTP Requests}} \times 100$                          | **99.90%**           | 30-Day Rolling | `http_requests_total{status!~"5.."}`                              |
| **2**  | **Property Search Availability** | $\frac{\text{Search Responses within } < 500\text{ms}}{\text{Total Search Requests}} \times 100$                         | **99.50%**           | 30-Day Rolling | `http_request_duration_seconds{route="/properties",le="0.5"}`     |
| **3**  | **Property Detail Availability** | $\frac{\text{Detail Responses within } < 400\text{ms}}{\text{Total Detail Requests}} \times 100$                         | **99.50%**           | 30-Day Rolling | `http_request_duration_seconds{route="/properties/:id",le="0.4"}` |
| **4**  | **Authentication Availability**  | $\frac{\text{Successful Logins/Registrations}}{\text{Total Auth Attempts}} \times 100$                                   | **99.90%**           | 30-Day Rolling | `auth_requests_total{status="success"}`                           |
| **5**  | **Real-Time Messaging**          | $\frac{\text{WebSocket Messages Delivered within } < 300\text{ms}}{\text{Total WebSocket Messages Sent}} \times 100$     | **99.00%**           | 30-Day Rolling | `websocket_message_delivery_latency{le="0.3"}`                    |
| **6**  | **Notification Delivery**        | $\frac{\text{In-App & Push Notifications Delivered within } < 60\text{s}}{\text{Total Queued Notifications}} \times 100$ | **98.50%**           | 30-Day Rolling | `notification_delivery_duration_seconds{le="60"}`                 |
| **7**  | **Media / Image Upload**         | $\frac{\text{Successful Image Uploads & Optimization}}{\text{Total Image Upload Requests}} \times 100$                   | **99.00%**           | 30-Day Rolling | `media_upload_status{status="completed"}`                         |
| **8**  | **Payment & Escrow**             | $\frac{\text{Successfully Reconciled Invoices/Escrow Intents}}{\text{Total Valid Payment Submissions}} \times 100$       | **99.95%**           | 30-Day Rolling | `payment_reconciliation_total{status="reconciled"}`               |
| **9**  | **Admin Dashboard**              | $\frac{\text{Successful Admin Requests (2xx)}}{\text{Total Admin Requests}} \times 100$                                  | **99.50%**           | 30-Day Rolling | `admin_http_requests_total{status!~"5.."}`                        |
| **10** | **Mobile Crash-Free Sessions**   | $\frac{\text{Sessions without Crash}}{\text{Total Mobile Sessions}} \times 100$                                          | **99.50%**           | 30-Day Rolling | Firebase Crashlytics Crash-Free Metric                            |
| **11** | **Web User Interaction**         | $\frac{\text{User Clicks/Interactions without Client Error}}{\text{Total Tracked Web Actions}} \times 100$               | **99.00%**           | 30-Day Rolling | Sentry Client Error Rate Tracker                                  |

---

## 3. SLI Measurement & Prometheus Rules

```yaml
# Prometheus Alerting Rule Example for API Availability SLO
groups:
  - name: peshawar_slo_alerts
    rules:
      - alert: ApiAvailabilitySloBurnRateHigh
        expr: (
          sum(rate(http_requests_total{status=~"5.."}[1h]))
          /
          sum(rate(http_requests_total[1h]))
          ) > 0.001 * 14.4 # Consuming 10% of monthly budget in 1 hour
        for: 2m
        labels:
          severity: critical
          slo: api_availability
        annotations:
          summary: 'API Availability SLO Error Budget burning at 14.4x rate'
          description: 'Current error rate exceeds acceptable failure budget. Immediate triage required.'
```

---

## 4. Maintenance Windows & Exclusions

- **Scheduled Maintenance Window**: Tuesdays from 03:00 to 04:30 AM PKT (lowest traffic window in Khyber Pakhtunkhwa).
- **Advance Notice**: 48 hours advance in-app notification banner for scheduled maintenance.
- **Exclusions**: Dwell time during pre-announced maintenance windows does not penalize customer-facing error budgets provided downtime is $< 30$ minutes.
