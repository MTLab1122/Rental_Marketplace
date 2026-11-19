# Peshawar Rental Marketplace: Known Issues & Technical Backlog (v1.0.0-GA)

## 1. Status Overview

All Critical (P0) and Major (P1) issues across all 20 development phases have been resolved, certified, and regression tested. The issues documented below are non-launch-blocking, minor cosmetic or transient edge cases scheduled for maintenance update v1.1.0.

---

## 2. Documented Non-Blocking Issues & Workarounds

### Issue 1: Transient Delay in WhatsApp Cloud Webhook Delivery under High Telco Congestion

- **Severity**: Low (P3).
- **Description**: During heavy cellular traffic spikes in Peshawar (e.g., Friday evenings), WhatsApp webhook delivery from Meta servers may experience transient latency of 15–45 seconds.
- **Workaround / Fallback**: The platform's BullMQ retry queue automatically retries webhooks with exponential backoff (1s, 5s, 15s). Real-time In-App WebSocket notifications and SMS failovers ensure the user is notified immediately without relying solely on WhatsApp.
- **Resolution Roadmap**: Target v1.1.0 introduces parallel multi-session WhatsApp gateway fallback.

### Issue 2: Offline Bank Transfer Verification SLA Window

- **Severity**: Low (P3).
- **Description**: Pro Landlord offline bank transfers (Meezan Bank, JazzCash, EasyPaisa) require manual audit reference validation by the accounting desk before listing boosts are activated.
- **Workaround**: Automated confirmation SMS is dispatched immediately with reference tracking, and accounting desk operates with a guaranteed < 30 minute activation SLA between 08:00 and 22:00 PKT.
- **Resolution Roadmap**: Direct bank API integration via 1Link Open Banking API scheduled for Phase 22.

### Issue 3: Safari iOS Low-Power Mode WebSocket Heartbeat Throttle

- **Severity**: Low (P4).
- **Description**: On iOS devices with Low Power Mode enabled, WebSockets in backgrounded Safari tabs may delay ping/pong heartbeats, triggering reconnect toasts when returning to the tab.
- **Workaround**: Reconnection logic in `PropertyDetailClient.tsx` and mobile app automatically re-fetches unread message states upon window focus.
- **Resolution Roadmap**: Add Server-Sent Events (SSE) fallback mode for mobile browsers in v1.1.0.

### Issue 4: PostGIS Exact Boundary Edge Cases on Frontier Road

- **Severity**: Low (P4).
- **Description**: Certain rural parcels on the far western boundary of Regi Model Town abutting Khyber District may be rejected if GPS accuracy reports > 50-meter variance.
- **Workaround**: Landlords are prompted to manually adjust pin to the verified municipal street road frontage.
- **Resolution Roadmap**: High-resolution municipal GIS shapefile update from Peshawar Development Authority (PDA) planned for Q2 2026.

---

## 3. Maintenance Release Schedule (v1.1.0)

- **Code Freeze**: 4 weeks post-GA.
- **Target Release Date**: 6 weeks post-GA.
- **Scope**:
  - Live 1Link Pakistani payment gateway integration (pending State Bank of Pakistan sandbox certification).
  - Urdu voice message transcription for landlord-tenant chat.
  - Automated PESCO electricity bill verification OCR.
