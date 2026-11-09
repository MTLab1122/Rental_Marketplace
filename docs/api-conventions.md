# API Conventions & Contracts

## 1. Core Principles

- **Base URL**: `/api/v1`
- **Protocol**: HTTPS (enforced via reverse proxy / production config)
- **Data Exchange**: JSON (`application/json; charset=utf-8`)
- **Tracing**: Every request and response contains the `x-request-id` header (UUIDv4)
- **Authentication**: Bearer JWT tokens in the `Authorization` header (`Bearer <token>`)

---

## 2. Resource Naming Conventions

All REST endpoints follow pluralized kebab-case conventions:

- Collection resource: `GET /api/v1/properties`
- Specific resource: `GET /api/v1/properties/:id`
- Sub-resource: `GET /api/v1/properties/:id/images`
- Actions (when non-CRUD): `POST /api/v1/properties/:id/submit-review`
- System probes: `GET /health`, `GET /ready`

---

## 3. Standard Response Envelope

Every successful API response is wrapped in a consistent structure:

```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "title": "Modern 2-Bed Furnished Apartment in University Town",
    "eligibility": "STUDENTS_ONLY",
    "monthlyRentPkr": 45000.0
  },
  "meta": {
    "requestId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "timestamp": "2026-11-09T17:30:00.000Z"
  },
  "error": null
}
```

---

## 4. Standard Error Envelope

All API errors (4xx, 5xx) conform to the structured error envelope:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed for one or more fields.",
    "details": [
      {
        "field": "monthlyRentPkr",
        "message": "monthlyRentPkr must be greater than 0"
      },
      {
        "field": "eligibility",
        "message": "eligibility must be either STUDENTS_ONLY or FAMILIES_ONLY"
      }
    ],
    "requestId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "timestamp": "2026-11-09T17:30:00.000Z"
  }
}
```

### Standard Error Codes

| Code                       | HTTP Status | Description                                                      |
| -------------------------- | ----------- | ---------------------------------------------------------------- |
| `VALIDATION_ERROR`         | 400         | Request payload failed schema validation                         |
| `UNAUTHORIZED`             | 401         | Missing or invalid authentication token                          |
| `FORBIDDEN`                | 403         | Authenticated user lacks permission or eligibility role mismatch |
| `NOT_FOUND`                | 404         | Requested entity does not exist                                  |
| `CONFLICT`                 | 409         | Resource state conflict (e.g. email duplicate)                   |
| `OUTSIDE_SERVICE_BOUNDARY` | 422         | Coordinates fall outside Peshawar service polygon                |
| `RATE_LIMIT_EXCEEDED`      | 429         | IP or client hit rate limits                                     |
| `INTERNAL_SERVER_ERROR`    | 500         | Unhandled server error                                           |
| `SERVICE_UNAVAILABLE`      | 503         | Database or Redis outage                                         |

---

## 5. Cursor-Based Pagination

For infinite scrolling, high performance, and consistent pagination without skip/offset page drift:

### Query Parameters:

- `cursor`: Base64-encoded or UUID identifier of the last item received.
- `limit`: Number of items to retrieve (default: `20`, maximum: `50`).
- `direction`: `forward` (default) or `backward`.

### Paginated Response:

```json
{
  "success": true,
  "data": [
    { "id": "uuid-1", "title": "Listing 1" },
    { "id": "uuid-2", "title": "Listing 2" }
  ],
  "meta": {
    "requestId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "timestamp": "2026-11-09T17:30:00.000Z",
    "pagination": {
      "hasMore": true,
      "nextCursor": "uuid-2",
      "limit": 20,
      "total": 142
    }
  },
  "error": null
}
```
