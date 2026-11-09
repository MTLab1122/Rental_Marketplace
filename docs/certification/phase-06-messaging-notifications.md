# Phase 6 Certification: Inquiries, Real-Time Messaging, Notifications, and Communication Safety

**Status:** Certified & Verified  
**Date:** November 10, 2026  
**System:** Peshawar Verified Rental Marketplace

---

## 1. Executive Summary

Phase 6 delivers an end-to-end, real-time communication platform built specifically for Peshawar's rental market. It establishes secure tenant-to-landlord inquiries, real-time WebSocket messaging via Socket.IO, multi-channel notifications with FCM device token management, communication safety (blocking, reporting, rate limiting), and authorized WhatsApp contact revelation without leaking private landlord phone numbers on public listing pages.

All functionality has been implemented and certified across:

1. **Database & Schema Layer**: PostgreSQL with Prisma ORM (indexes, relations, cascading rules).
2. **Backend API (`apps/api`)**: NestJS WebSocket Gateway, REST controllers, rate-limit guards, audit logging.
3. **Shared Contracts (`packages/shared-types`)**: DTOs, Enums, Error Codes, Permission Codes.
4. **Next.js Web (`apps/web`)**: Inquiries dashboard, real-time two-column Chat with Socket.IO, Notifications center, WhatsApp deep links.
5. **Flutter Mobile (`apps/mobile`)**: Riverpod state management, Socket.IO client, real-time ChatScreen, InquiriesScreen with WhatsApp launcher, NotificationsScreen.

---

## 2. Implemented Features & Endpoints

### 2.1 Inquiry Management APIs

| Method   | Endpoint                                | Description                                                       | Guard / Policy                                     |
| -------- | --------------------------------------- | ----------------------------------------------------------------- | -------------------------------------------------- |
| `POST`   | `/api/v1/inquiries`                     | Create rental inquiry & start conversation                        | Student/Family eligibility check; 10/hr rate limit |
| `GET`    | `/api/v1/inquiries`                     | List tenant's own inquiries                                       | Tenant JWT                                         |
| `GET`    | `/api/v1/inquiries/my`                  | Explicit alias for tenant's own inquiries                         | Tenant JWT                                         |
| `GET`    | `/api/v1/landlord/inquiries`            | List inquiries received by landlord                               | Landlord JWT                                       |
| `GET`    | `/api/v1/inquiries/:id`                 | Get single inquiry with property & conversation                   | Participant or Admin only                          |
| `PATCH`  | `/api/v1/landlord/inquiries/:id/status` | Update inquiry status (SEEN, REPLIED, ACCEPTED, DECLINED, CLOSED) | Landlord ownership required                        |
| `DELETE` | `/api/v1/inquiries/:id`                 | Withdraw or close inquiry                                         | Tenant, Landlord, or Admin                         |

### 2.2 Real-Time WebSocket & REST Messaging

| Protocol         | Event / Endpoint                          | Payload / Behavior                                                                                          |
| ---------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| **WS Handshake** | `auth: { token: JWT }`                    | Validates JWT; tracks online presence in `user:${userId}`                                                   |
| **WS Event**     | `conversation:join`                       | `{ conversationId }` — Verifies participant membership before joining room                                  |
| **WS Event**     | `message:send`                            | `{ conversationId, content }` — Persists to DB, checks rate limit (30/min), broadcasts `message:new`        |
| **WS Event**     | `message:read`                            | `{ conversationId }` — Updates `readAt`, broadcasts `message:read`                                          |
| **WS Event**     | `typing`                                  | `{ conversationId, isTyping }` — Relays typing indicator to counterparty                                    |
| **WS Event**     | `user:online` / `user:offline`            | System broadcasts user connection status                                                                    |
| **REST**         | `GET /api/v1/conversations`               | Lists user conversations with unread counter, last message preview, participant info                        |
| **REST**         | `GET /api/v1/conversations/:id/messages`  | Paginated message history for conversation                                                                  |
| **REST**         | `POST /api/v1/conversations/:id/messages` | Fallback HTTP message dispatch (also emits `message:new` to WS room)                                        |
| **REST**         | `PATCH /api/v1/conversations/:id/read`    | Marks messages as read (also emits `message:read` to WS room)                                               |
| **REST**         | `POST /api/v1/conversations/:id/block`    | Blocks conversation; immediately disables new messages                                                      |
| **REST**         | `POST /api/v1/conversations/:id/report`   | Files moderation report (`HARASSMENT`, `DISCRIMINATION`, `FAKE_LISTING`, `MISLEADING_INFORMATION`, `OTHER`) |

### 2.3 Notifications & Device Registration

| Method   | Endpoint                         | Description                                              |
| -------- | -------------------------------- | -------------------------------------------------------- |
| `GET`    | `/api/v1/notifications`          | Paginated user notifications list                        |
| `PATCH`  | `/api/v1/notifications/:id/read` | Mark single notification as read                         |
| `PATCH`  | `/api/v1/notifications/read-all` | Mark all user notifications as read                      |
| `POST`   | `/api/v1/devices`                | Register FCM push device token (`ANDROID`, `IOS`, `WEB`) |
| `DELETE` | `/api/v1/devices/:id`            | Unregister FCM push device token on sign out             |

### 2.4 Communication Safety & WhatsApp Privacy Policy

1. **Zero Public Phone Leakage**: Public property listings NEVER expose raw phone numbers or WhatsApp links.
2. **Conditional Revelation**: WhatsApp contact links (`https://wa.me/92...`) are generated exclusively server-side and revealed ONLY after:
   - The inquiry status is updated to `ACCEPTED` by the landlord, or
   - The landlord explicitly enabled WhatsApp contact sharing on that listing.
3. **Phone Normalization**: Pakistani phone numbers (`03xx-xxxxxxx` or `+923xxxxxxxxx`) are safely normalized to E.164 without leading plus signs or dashes for WhatsApp deep links (`https://wa.me/923001234567?text=...`).
4. **Rate Limiting**:
   - Inquiries: Maximum 10 inquiries per hour per user.
   - Messaging: Maximum 30 messages per minute per user.
5. **Anti-Harassment & Moderation**: Either party can block a conversation at any time. Blocked conversations reject all incoming messages at the controller and gateway level with `CONVERSATION_BLOCKED`. Reports are written to the audit log and trigger moderation alerts.

---

## 3. Web & Mobile Implementation

### 3.1 Next.js Web (`apps/web`)

- **`/inquiries`**: Tabbed interface for tenants ("My Applications") and landlords ("Received Inquiries"). Status chips for `SUBMITTED`, `SEEN`, `REPLIED`, `ACCEPTED`, `DECLINED`, and `CLOSED`. WhatsApp direct link button when unlocked.
- **`/messages`**: Two-panel real-time chat interface wrapped in Next.js `<Suspense>`. Left panel lists active conversations with search, property context, and unread badges. Right panel features active message history, date stamps, sent (`✓`) and read (`✓✓`) indicators, typing indicator, block trigger, and structured report modal.
- **`/notifications`**: Interactive notification feed with type icons (`📬`, `💬`, `✅`, `⚠️`, `🔔`), unread dot badges, mark-read click handler, and "Mark All Read" action.
- **`Navbar.tsx`**: Updated with responsive links to Inquiries, Messages, and Alerts across both desktop and mobile navigation drawers.

### 3.2 Flutter Mobile (`apps/mobile`)

- **Models**:
  - `InquiryModel` with updated Peshawar statuses, `conversationId`, `canContactWhatsapp`, and `whatsappUrl`.
  - `MessageModel` with `isRead`, `readAt`, `senderName`.
  - `ConversationModel` with participant mapping and `getOtherParticipantName()`.
  - `NotificationModel` with metadata decoding.
- **Providers**:
  - `inquiriesProvider`: Fetches, creates, and refreshes rental applications.
  - `messagesProvider`: Fetches conversations, manages blocking and reporting.
  - `chatProviderFamily`: Riverpod family provider per conversation; manages Socket.IO lifecycle, history pagination, real-time message broadcasting, read receipts, and typing debounce.
  - `notificationsProvider`: Unread count tracking, single and bulk read operations.
- **Screens**:
  - `InquiriesScreen`: Clean list with status badges, WhatsApp launch button via `url_launcher`, and deep link to chat.
  - `MessagesScreen`: Conversation list with avatar initials, property context, unread pill, and blocked indicators.
  - `ChatScreen`: Emerald/white message bubbles, read status, blocked banner, safety popup menu, report dialog, and auto-scrolling message composer.
  - `NotificationsScreen`: Real-time alerts with categorized icons, unread dots, and action buttons.

---

## 4. Verification & Test Evidence

### 4.1 Backend Test Suites

- **Unit Tests (`apps/api`)**: **19 passed, 19 total** (126 tests)
  - `conversation.service.spec.ts` (12 tests passed)
  - `inquiry.service.spec.ts` (12 tests passed)
  - `rate-limiter.service.spec.ts`, `auth.security.spec.ts`, `property.validator.spec.ts`, etc.
- **E2E Tests (`apps/api`)**: **5 passed, 5 total** (71 tests)
  - `messaging-notifications.e2e-spec.ts` (17 tests passed)
  - `favorites-inquiries.e2e-spec.ts` (8 tests passed)
  - `property.e2e-spec.ts` (21 tests passed)
  - `locality.e2e-spec.ts` (12 tests passed)
  - `auth.e2e-spec.ts` (13 tests passed)

### 4.2 Web Unit Tests (`apps/web`)

- **Total Tests**: **12 passed, 12 total**
  - Inquiry status transitions and badges.
  - WhatsApp contact link reveal safety policy: only on ACCEPTED status.
  - Real-time conversation participant resolution and unread badge count.
  - Safety block policy: blocked conversation disallows sending messages.
  - Platform report reasons validation (`HARASSMENT`, `DISCRIMINATION`, `FAKE_LISTING`, `MISLEADING_INFORMATION`, `OTHER`).
  - Notification categorization and read filter.
  - Student vs Family listing segregation tests.
  - Municipal boundary enforcement for 15 Peshawar localities.

### 4.3 Production Build Verification

- **`@rental-peshawar/shared-types`**: `tsc -b` passed with 0 errors.
- **`@rental-peshawar/web`**: `tsc --noEmit` and `eslint` passed with 0 errors.
- **`next build`**: 14 static pages generated cleanly, including `/inquiries`, `/messages`, `/notifications`, `/properties`, `/favorites`.
- **Repo-wide test run (`pnpm test`)**: All 6 packages passed with 0 failures.

---

## 5. Certification Sign-off

Phase 6 meets all production requirements:

- [x] Inquiries with status progression (`SUBMITTED`, `SEEN`, `REPLIED`, `ACCEPTED`, `DECLINED`, `CLOSED`).
- [x] Strict student vs family segregation preserved across inquiry submission.
- [x] Real-time messaging with Socket.IO WebSocket gateway and REST fallback.
- [x] Unread counts, read receipts (`readAt`), and typing indicators.
- [x] User-to-user blocking and structured reporting.
- [x] Rate limiting: 10 inquiries/hr, 30 messages/min.
- [x] WhatsApp privacy protection: no phone numbers exposed publicly; HTTPS deep links authorized only upon acceptance.
- [x] Multi-platform: Next.js Web and Flutter Mobile with responsive UI and error handling.
- [x] 100% test pass rate across unit and E2E suites.
