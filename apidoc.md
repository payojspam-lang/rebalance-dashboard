# API Documentation — Aegis Rebalance Engine

**Author:** SDE4 Backend
**Version:** 1.0
**Last Updated:** 2026-04-06
**Base URL:** `http://localhost:3001/api`

---

## 1. Authentication

All API endpoints (except `POST /auth/login` and `POST /auth/refresh`) require a valid JWT in the `Authorization` header.

```
Authorization: Bearer <access_token>
```

### Token Lifecycle

| Token Type | Lifetime | Storage |
|---|---|---|
| Access Token | 15 minutes | In-memory (frontend) |
| Refresh Token | 7 days | HttpOnly secure cookie |

### Obtaining Tokens

#### `POST /auth/login`

Authenticate with email and password. Returns an access token in the response body and sets a refresh token as an HttpOnly cookie.

**Request:**
```json
{
  "email": "analyst@aegis.com",
  "password": "securePassword123"
}
```

**Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "email": "analyst@aegis.com",
    "name": "Priya Sharma",
    "role": "L1"
  }
}
```

**Error (401):**
```json
{
  "error": "INVALID_CREDENTIALS",
  "message": "Invalid email or password."
}
```

#### `POST /auth/refresh`

Exchange a valid refresh token cookie for a new access token. Implements refresh token rotation — the previous refresh token is invalidated.

**Request:** No body required. Refresh token is read from the HttpOnly cookie.

**Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### `POST /auth/logout`

Invalidates the current refresh token and clears the cookie.

**Response (204):** No content.

---

## 2. Rate Limiting

| Scope | Limit | Window |
|---|---|---|
| Authenticated user | 200 requests | 1 minute |
| Login endpoint | 10 attempts | 15 minutes |

Rate limit headers are included in every response:
```
X-RateLimit-Limit: 200
X-RateLimit-Remaining: 187
X-RateLimit-Reset: 1712410800
```

**Rate Limited Response (429):**
```json
{
  "error": "RATE_LIMITED",
  "message": "Too many requests. Retry after 23 seconds.",
  "retryAfter": 23
}
```

---

## 3. Common Response Envelope

All successful responses follow a consistent structure:

```json
{
  "data": { ... },
  "meta": {
    "page": 1,
    "pageSize": 50,
    "totalCount": 243,
    "totalPages": 5
  }
}
```

Single-resource responses omit the `meta` field.

### Error Response Format

```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable description.",
  "details": { ... }
}
```

---

## 4. Core Endpoints

### 4.1 Recommendations

#### `GET /recommendations`

Fetch rebalance recommendations with filtering, sorting, and pagination.

**Authorization:** `L1`, `L2`, `OPS`, `ADMIN`

**Query Parameters:**

| Param | Type | Default | Description |
|---|---|---|---|
| `status` | string | — | Filter by status: `PENDING`, `L2_PENDING`, `REJECTED`, `APPROVED`, `IN_PROGRESS`, `COMPLETED` |
| `portfolioId` | UUID | — | Filter by portfolio |
| `action` | string | — | Filter by recommended action: `BUY`, `SELL`, `HOLD` |
| `sortBy` | string | `created_at` | Sort field: `created_at`, `asset_name`, `current_weight`, `target_weight`, `quantity` |
| `sortOrder` | string | `desc` | `asc` or `desc` |
| `page` | integer | `1` | Page number |
| `pageSize` | integer | `50` | Items per page (max 200) |

**Response (200):**
```json
{
  "data": [
    {
      "id": "rec-001-uuid",
      "portfolioId": "port-001-uuid",
      "portfolioName": "Growth Fund Alpha",
      "assetName": "HDFC Top 100 Fund",
      "schemeCode": "100034",
      "folioNumber": "1234567890",
      "currentWeight": 0.1523,
      "targetWeight": 0.1200,
      "recommendedAction": "SELL",
      "quantity": 150.5000,
      "amount": 45150.00,
      "status": "PENDING",
      "mlModelVersion": "rebal-v3.2.1",
      "modification": null,
      "createdAt": "2026-04-06T09:00:00Z",
      "updatedAt": "2026-04-06T09:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 50,
    "totalCount": 87,
    "totalPages": 2
  }
}
```

#### `GET /recommendations/:id`

Fetch a single recommendation with its full modification history.

**Authorization:** `L1`, `L2`, `OPS`, `ADMIN`

**Response (200):**
```json
{
  "data": {
    "id": "rec-001-uuid",
    "portfolioId": "port-001-uuid",
    "portfolioName": "Growth Fund Alpha",
    "assetName": "HDFC Top 100 Fund",
    "schemeCode": "100034",
    "folioNumber": "1234567890",
    "currentWeight": 0.1523,
    "targetWeight": 0.1200,
    "recommendedAction": "SELL",
    "quantity": 150.5000,
    "amount": 45150.00,
    "status": "L2_PENDING",
    "mlModelVersion": "rebal-v3.2.1",
    "modification": {
      "id": "mod-001-uuid",
      "modifiedBy": {
        "id": "user-001-uuid",
        "name": "Priya Sharma",
        "role": "L1"
      },
      "originalAction": "SELL",
      "originalQuantity": 150.5000,
      "newAction": "SELL",
      "newQuantity": 100.0000,
      "rationale": "Reducing sell quantity due to expected sector recovery based on Q1 earnings preview.",
      "createdAt": "2026-04-06T10:30:00Z"
    },
    "auditTrail": [
      {
        "action": "TRANSITION",
        "previousState": "PENDING",
        "newState": "L2_PENDING",
        "userId": "user-001-uuid",
        "userName": "Priya Sharma",
        "createdAt": "2026-04-06T10:30:00Z"
      }
    ],
    "createdAt": "2026-04-06T09:00:00Z",
    "updatedAt": "2026-04-06T10:30:00Z"
  }
}
```

---

### 4.2 State Transitions

#### `POST /recommendations/:id/transition`

Trigger a state transition on a recommendation. The state machine validates the transition against the current status and the requesting user's role.

**Authorization:** Role-dependent (see state machine in `arch.md`).

**Request — Standard Approval (L1):**
```json
{
  "action": "APPROVE"
}
```

**Request — Deviation (L1):**
```json
{
  "action": "MODIFY",
  "modifications": {
    "newAction": "SELL",
    "newQuantity": 100.0000
  },
  "rationale": "Reducing sell quantity due to expected sector recovery based on Q1 earnings preview."
}
```

**Request — L2 Approval:**
```json
{
  "action": "APPROVE",
  "comment": "Deviation justified. Q1 earnings data supports reduced exposure."
}
```

**Request — L2 Rejection:**
```json
{
  "action": "REJECT",
  "reason": "Insufficient justification. Sector recovery thesis not supported by current consensus estimates."
}
```

**Response (200) — Successful Transition:**
```json
{
  "data": {
    "id": "rec-001-uuid",
    "previousStatus": "PENDING",
    "newStatus": "APPROVED",
    "transitionedBy": "user-001-uuid",
    "transitionedAt": "2026-04-06T11:00:00Z"
  }
}
```

**Error (409) — Invalid Transition:**
```json
{
  "error": "INVALID_TRANSITION",
  "message": "Cannot transition from PENDING to COMPLETED. Allowed transitions: APPROVED, L2_PENDING.",
  "details": {
    "currentStatus": "PENDING",
    "attemptedStatus": "COMPLETED",
    "allowedTransitions": ["APPROVED", "L2_PENDING"]
  }
}
```

**Error (403) — Insufficient Role:**
```json
{
  "error": "FORBIDDEN",
  "message": "Role 'L1' cannot transition from L2_PENDING to APPROVED. Required role: L2."
}
```

---

### 4.3 Batches

#### `POST /batches`

Initiate a batch execution for approved recommendations. This is an atomic operation — all specified recommendations must be in `APPROVED` status, or the entire request fails.

**Authorization:** `OPS`, `ADMIN`

**Request:**
```json
{
  "recommendationIds": [
    "rec-001-uuid",
    "rec-002-uuid",
    "rec-003-uuid"
  ]
}
```

**Response (201):**
```json
{
  "data": {
    "id": "batch-001-uuid",
    "status": "IN_PROGRESS",
    "itemCount": 3,
    "csvDownloadUrl": "/api/batches/batch-001-uuid/csv",
    "initiatedBy": {
      "id": "user-ops-uuid",
      "name": "Rahul Verma"
    },
    "initiatedAt": "2026-04-06T14:00:00Z"
  }
}
```

**Error (422) — Non-Approved Items:**
```json
{
  "error": "INVALID_BATCH",
  "message": "All recommendations must be in APPROVED status.",
  "details": {
    "invalidItems": [
      { "id": "rec-003-uuid", "currentStatus": "PENDING" }
    ]
  }
}
```

#### `GET /batches/:id/csv`

Download the BSE Star formatted CSV file for a batch.

**Authorization:** `OPS`, `ADMIN`

**Response (200):**
```
Content-Type: text/csv
Content-Disposition: attachment; filename="batch-001-20260406-140000.csv"

Scheme Code,Folio Number,Transaction Type,Amount,Units,Remarks
100034,1234567890,SELL,,150.5000,Rebalance batch-001
100089,1234567890,BUY,25000.00,,Rebalance batch-001
100112,9876543210,SELL,,200.0000,Rebalance batch-001
```

#### `POST /batches/:id/complete`

Mark a batch as completed after BSE Star execution is confirmed.

**Authorization:** `OPS`, `ADMIN`

**Request:**
```json
{
  "notes": "All trades executed successfully on BSE Star. Confirmation ref: BSE-2026-04-06-1482."
}
```

**Response (200):**
```json
{
  "data": {
    "id": "batch-001-uuid",
    "status": "COMPLETED",
    "completedBy": {
      "id": "user-ops-uuid",
      "name": "Rahul Verma"
    },
    "completedAt": "2026-04-06T16:30:00Z"
  }
}
```

---

### 4.4 Portfolios

#### `GET /portfolios`

Fetch all portfolios with current allocation summaries and drift status.

**Authorization:** `L1`, `L2`, `OPS`, `ADMIN`

**Response (200):**
```json
{
  "data": [
    {
      "id": "port-001-uuid",
      "name": "Growth Fund Alpha",
      "totalAum": 15000000.00,
      "driftThreshold": 0.05,
      "currentDrift": 0.073,
      "driftStatus": "WARNING",
      "allocationSummary": [
        { "assetName": "HDFC Top 100 Fund", "currentWeight": 0.1523, "targetWeight": 0.1200 },
        { "assetName": "ICICI Prudential Bluechip", "currentWeight": 0.0980, "targetWeight": 0.1000 },
        { "assetName": "SBI Small Cap Fund", "currentWeight": 0.0750, "targetWeight": 0.0800 }
      ],
      "pendingRecommendations": 12,
      "updatedAt": "2026-04-06T09:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 50,
    "totalCount": 8,
    "totalPages": 1
  }
}
```

---

### 4.5 Audit Logs

#### `GET /audit-logs`

Query the immutable audit trail. Supports filtering by resource, user, and date range.

**Authorization:** `ADMIN`

**Query Parameters:**

| Param | Type | Description |
|---|---|---|
| `resourceType` | string | `recommendation`, `batch` |
| `resourceId` | UUID | Specific resource ID |
| `userId` | UUID | Filter by acting user |
| `startDate` | ISO 8601 | Start of date range |
| `endDate` | ISO 8601 | End of date range |
| `page` | integer | Page number |
| `pageSize` | integer | Items per page (max 200) |

**Response (200):**
```json
{
  "data": [
    {
      "id": "audit-001-uuid",
      "userId": "user-001-uuid",
      "userName": "Priya Sharma",
      "action": "TRANSITION",
      "resourceType": "recommendation",
      "resourceId": "rec-001-uuid",
      "previousState": "PENDING",
      "newState": "L2_PENDING",
      "details": {
        "modificationType": "QUANTITY_CHANGE",
        "originalQuantity": 150.5,
        "newQuantity": 100.0,
        "rationale": "Reducing sell quantity due to expected sector recovery."
      },
      "ipAddress": "192.168.1.45",
      "createdAt": "2026-04-06T10:30:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 50,
    "totalCount": 1204,
    "totalPages": 25
  }
}
```

---

## 5. SSE (Server-Sent Events) Endpoint

#### `GET /events`

Subscribe to real-time notifications. The server pushes events when state transitions occur that are relevant to the authenticated user's role.

**Authorization:** Any authenticated role.

**Event Types:**

| Event | Payload | Sent To |
|---|---|---|
| `recommendation:status_changed` | `{ id, previousStatus, newStatus, portfolioName }` | Role-dependent (see below) |
| `batch:created` | `{ batchId, itemCount }` | `OPS` |
| `batch:completed` | `{ batchId, completedBy }` | `L1`, `L2`, `ADMIN` |

**Example SSE Stream:**
```
event: recommendation:status_changed
data: {"id":"rec-001-uuid","previousStatus":"PENDING","newStatus":"APPROVED","portfolioName":"Growth Fund Alpha"}

event: recommendation:status_changed
data: {"id":"rec-002-uuid","previousStatus":"PENDING","newStatus":"L2_PENDING","portfolioName":"Value Fund Beta"}
```

---

## 6. Error Codes Reference

| Code | HTTP Status | Description |
|---|---|---|
| `INVALID_CREDENTIALS` | 401 | Wrong email or password |
| `TOKEN_EXPIRED` | 401 | Access token has expired |
| `FORBIDDEN` | 403 | User's role lacks permission |
| `NOT_FOUND` | 404 | Resource does not exist |
| `INVALID_TRANSITION` | 409 | State transition not allowed |
| `INVALID_BATCH` | 422 | Batch contains non-approved items |
| `VALIDATION_ERROR` | 422 | Request body failed schema validation |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Unexpected server error |
