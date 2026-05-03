# Focus Study Room - Backend API & Architecture

Backend service for the Focus Study Room Booking System. This documentation focuses on the architectural design, directory structure, request flow, and exposed API capabilities.

## Tech Stack
- **Runtime:** Node.js + TypeScript
- **HTTP Framework:** Fastify
- **ORM / Database:** Prisma + SQLite
- **Documentation:** `@fastify/swagger` + `@fastify/swagger-ui` (OpenAPI)
- **Testing:** Vitest

## Architecture & Directory Structure
The application follows a modular, layered architecture

- `src/app/`
  Application bootstrap. Responsible for server initialization, Fastify plugin registration, and wiring up module routes.
- `src/modules/*/api/`
  Presentation layer (HTTP routing). Defines endpoints, OpenAPI schemas, and handles payload/query validation. It contains no business logic, delegating it entirely to the application layer.
- `src/modules/*/application/`
  Application layer (Use Cases). Orchestrates business processes. It receives validated data from the API, interacts with domain entities, and communicates with repository contracts.
- `src/modules/*/domain/`
  Domain layer (the core). Contains pure data models (entities), business policies, domain errors, and repository interfaces (contracts). This layer is entirely agnostic of the database or HTTP framework.
- `src/modules/*/infrastructure/`
  Infrastructure layer. Contains concrete implementations of domain contracts, primarily Prisma repositories for SQLite database operations.
- `src/shared/`
  Cross-module utilities and helpers (e.g., HTTP error mapping, QR code signing and verification logic).

## Request Flow
Every incoming HTTP request follows a strict, unidirectional flow:
1. **Route (API)** -> Receives the request, validates input payload/query, and extracts parameters.
2. **Use Case (Application)** -> Executes the primary business scenario using the provided data.
3. **Repository Contract (Domain)** -> The Use Case calls an abstract storage interface without knowing the underlying database implementation.
4. **Prisma Repository (Infrastructure)** -> Executes the actual database query based on the implemented contract.
5. **SQLite** -> Modifies or retrieves the state.

## Auth Model
The backend currently uses a simplified Role-Based Access Control (RBAC) simulation:
- **Public endpoints:** No authentication required.
- **Admin endpoints:** Protected via header validation. Require `x-role: ADMIN`. Missing or incorrect headers immediately return `403 Forbidden`.

## Swagger Documentation
Interactive API documentation is automatically generated and served by Fastify.
- **Swagger UI:** `http://localhost:3001/docs`

Use the Swagger UI to inspect OpenAPI schemas, test endpoints, and verify expected response payloads and status codes.

## Endpoint Map

### System & Discovery (Public)
- `GET /health` - System health check
- `GET /buildings` - List all buildings
- `GET /rooms/available?startTime=<ISO>&endTime=<ISO>` - Find available rooms in a specific time window

### Reservations (Public)
- `POST /reservations` - Create a new reservation
- `GET /reservations/me?userId=<id>` - List user's reservations
- `DELETE /reservations/:id` - Cancel a reservation
- `POST /reservations/:id/access-codes` - Issue check-in PIN and QR payload for reservation owner
- `POST /reservations/:id/check-in` - Check into a room (Requires `method: "PIN" | "QR"`, `code`, and `userId`)

### Admin Operations (Requires `x-role: ADMIN`)
- `GET /admin/rooms` / `POST /admin/rooms` - List or create rooms
- `PATCH /admin/rooms/:id` / `DELETE /admin/rooms/:id` - Update or delete a room
- `GET /admin/reservations` - List all reservations (with optional filters)
- `PATCH /admin/reservations/:id/status` - Manually moderate reservation status

## Core Business Flows

### 1. Room Discovery and Booking
Users can browse the infrastructure (`GET /buildings`) and check room availability for a specific time window (`GET /rooms/available`). When booking (`POST /reservations`), the system enforces server-side conflict protection—any attempt to book overlapping time slots for the same room is rejected with a `409 Conflict`.

### 2. User Check-in
To finalize a booking, users must first request access codes (`POST /reservations/:id/access-codes`) and then physically check in (`POST /reservations/:id/check-in`). This process goes through validation:
- The reservation must belong to the requesting `userId`.
- The reservation status must be `RESERVED`.
- Check-in must occur within the allowed time window (from the exact start time up to +10 minutes).
- Access requires a valid code (either a `PIN` or a cryptographically signed `QR` code).
- Issued codes are stored server-side in database as hashes and can be marked as used after successful check-in.
- Upon successful validation, the reservation status transitions to `OCCUPIED`.

### 3. Moderation & State Management
Administrators can manage the room inventory (CRUD operations) and oversee the system's traffic. The admin reservation endpoint (`PATCH /admin/reservations/:id/status`) allows manual intervention in the reservation state machine, which includes:
- `RESERVED` (Scheduled)
- `OCCUPIED` (Checked-in)
- `NO_SHOW_RELEASED` (User failed to check in, room returned to pool)
- `CANCELLED` (Aborted by user or admin)
- `COMPLETED` (Successfully finished)

## QR and PIN Access Code Mechanism

This backend supports a two-code check-in model for each reservation:

- **PIN code**: short human-entered code.
- **QR payload**: signed token encoded into a QR image by frontend.

Both codes are issued by backend and validated server-side during check-in.

### Why this exists

- It enables a simple user flow (`My Bookings` -> show codes -> check-in).
- It keeps sensitive validation logic in backend.
- It prevents replay with one-time code consumption (`usedAt`).

### Issuance flow (`POST /reservations/:id/access-codes`)

When user requests access codes, backend:

1. Loads reservation and verifies ownership (`reservation.userId === userId`).
2. Verifies reservation is in `RESERVED` status.
3. Generates a 6-digit PIN.
4. Computes expiration at `reservation.startTime + 10 minutes`.
5. Builds signed QR payload (HMAC SHA-256).
6. Stores only hashes in DB (`pinHash`, `qrHash`) plus metadata (`expiresAt`, `usedAt`).
7. Returns plaintext `pin`, signed `qrPayload`, and `expiresAt`.

Response shape:

```json
{
  "reservationId": "res-123",
  "pin": "042913",
  "qrPayload": "<header.payload.signature>",
  "expiresAt": "2026-05-03T09:10:00.000Z"
}
```

### QR payload format

The QR payload is a signed token in three parts:

`base64url(header).base64url(payload).base64url(signature)`

Payload fields:

- `type`: always `CHECK_IN_QR`
- `reservationId`: target reservation id
- `userId`: reservation owner
- `exp`: expiration timestamp (unix seconds)

Example payload (before signing):

```json
{
  "type": "CHECK_IN_QR",
  "reservationId": "res-123",
  "userId": "student-1",
  "exp": 1760000000
}
```

### Storage model (`CheckInCode`)

Codes are persisted in a separate table linked 1:1 with reservation:

- `reservationId` (unique)
- `userId`
- `pinHash`
- `qrHash`
- `expiresAt`
- `usedAt` (null until consumed)
- `createdAt`, `updatedAt`

Raw PIN and raw QR payload are **not persisted**.

### Check-in validation (`POST /reservations/:id/check-in`)

For each check-in request backend verifies:

1. Reservation exists.
2. Reservation is `RESERVED`.
3. Requesting `userId` matches reservation owner.
4. Current time is inside check-in window.
5. Code matches server-stored hash for selected method (`PIN` or `QR`).
6. Code is not already consumed and not expired.

If valid, code is consumed atomically (`usedAt` set) and reservation transitions to `OCCUPIED`.

### Concurrency and replay protection

- Code consumption uses a single atomic update with conditions (`usedAt IS NULL`, `expiresAt > now`, matching hash).
- Only one concurrent request can consume a given code.
- Replayed requests fail once `usedAt` is set.

### Security notes

- QR signing secret comes from `QR_SIGNING_SECRET` (fallback for local dev only).
- Keep `QR_SIGNING_SECRET` private and environment-specific.
- Access-codes endpoint intentionally returns `404` for missing or foreign reservations to reduce enumeration.
- Current project still uses simplified auth simulation; in production, user identity should come from trusted auth context (not request body).

## Testing
The system is covered by integration tests using **Vitest**.
These tests ensure that the layered architecture behaves correctly and validate API/OpenAPI expectations. For example, they verify that admin endpoints correctly enforce the authorization model and return the exact response structures defined in the generated Swagger spec.
