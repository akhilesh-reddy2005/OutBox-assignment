# ReachInbox — Email Scheduler Assignment

A full-stack email scheduling application built for the Scheduling, Delaying, Rate Limit and etc.

---

## Architecture

```
Frontend (React + TypeScript + Vite)
  └─► POST /api/emails/schedule
        └─► Express API
              ├─► PostgreSQL — stores EmailJob rows (Prisma)
              └─► BullMQ — creates delayed jobs in Redis
                    └─► Email Worker (concurrency = 1)
                          ├─► Per-user hourly rate limit check  (Redis Lua)
                          ├─► Sequential send-slot wait         (Redis cursor)
                          ├─► Atomic SCHEDULED → PROCESSING     (PostgreSQL)
                          ├─► sendStartedAt = now()
                          ├─► Ethereal SMTP send
                          └─► sentAt = now(), status = SENT     (PostgreSQL)
```

---

## Scheduling

- Every email recipient is stored as an individual `EmailJob` in PostgreSQL.
- A BullMQ delayed job is created for each `EmailJob` with `delay = scheduledAt - now`.
- BullMQ persists all jobs in Redis — **no cron, no node-cron, no setInterval, no in-memory scheduling**.
- When the delay expires, BullMQ dequeues the job and the worker processes it.

---

## Sequential Sending

Worker `concurrency` is intentionally set to **1**.

This guarantees that only one SMTP call is active at any time:

```
Email 1  [SEND START]
           sendEmail() — SMTP in progress
         [SEND COMPLETE]
           notifySendComplete(delayMs) → Redis cursor = now + delayMs

Email 2  waitForSendSlot() → reads cursor, waits remaining delay
         [SEND START]
           sendEmail()
         [SEND COMPLETE]
```

`delayMs` controls the **minimum gap between SMTP completions and the next send start**.

> **Important:** Increasing `WORKER_CONCURRENCY` beyond 1 would require revisiting the
> `waitForSendSlot` / `notifySendComplete` design, which is currently not atomic across
> multiple concurrent workers.

---

## Per-User Hourly Rate Limiting

- `hourlyLimit` is stored per `EmailJob` (configured at campaign creation time).
- Redis key: `email-rate:{userId}:{YYYY-MM-DD-HH}` (UTC hour window).
- Each user has a completely independent counter — User A's limit never affects User B.
- An atomic Redis Lua script increments and checks the counter in one operation.
- When the limit is reached:
  - The `EmailJob` stays in `SCHEDULED` status.
  - `scheduledAt` is updated to the start of the next UTC hour.
  - A new BullMQ delayed job is created with a deterministic ID to avoid duplicates.
  - **No emails are dropped.**

---

## Idempotency

- `idempotencyKey` is `@unique` in the PostgreSQL schema — duplicate rows are rejected at the DB level.
- The worker performs a fast-path check: `if (status === "SENT") return`.
- An atomic `updateMany({ where: { id, status: "SCHEDULED" } })` claim ensures only **one** worker can transition a job to `PROCESSING`, even under concurrent access.
- BullMQ retry and reschedule jobs use deterministic IDs (`{emailJobId}-retry-{timestamp}`) to prevent duplicate delayed jobs.

---

## Restart Persistence

- PostgreSQL persists all `EmailJob` state (SCHEDULED, PROCESSING, SENT, FAILED).
- Redis persists all BullMQ delayed jobs.
- Restarting the backend does **not** recreate or re-schedule any jobs from scratch.
- BullMQ automatically reconnects to Redis and resumes pending delayed jobs after restart.

> For production: enable Redis AOF or RDB persistence (`appendonly yes` in `redis.conf`).

---

## Email Delivery (Ethereal)

Ethereal SMTP is used as required by the assignment. It is a fake SMTP service for testing — emails are **not** delivered to real inboxes.

After each send the worker logs a preview URL:
```
[PREVIEW] https://ethereal.email/message/...
```
Open this URL to inspect the sent email content.

---

## Worker Log Prefixes

| Prefix | Meaning |
|---|---|
| `[QUEUE]` | Job picked up from BullMQ |
| `[IDEMPOTENCY]` | Status check / claim result |
| `[RATE]` | Hourly rate limit hit — rescheduling |
| `[SLOT]` | Redis send slot read |
| `[WAIT]` | Sleeping until slot time |
| `[SEND START]` | Immediately before `sendEmail()` |
| `[SEND COMPLETE]` | SMTP succeeded |
| `[SEND FAILED]` | SMTP failed |
| `[THROTTLE]` | Redis cursor pushed forward |
| `[PREVIEW]` | Ethereal preview URL |

---

## Environment Variables

Create `backend/.env`:

```env
# PostgreSQL
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/reachinbox"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Server
PORT=5000

# Worker (concurrency MUST stay at 1 for sequential send guarantee)
WORKER_CONCURRENCY=1
MIN_DELAY_BETWEEN_EMAILS_MS=2000

# Ethereal SMTP — generate credentials at https://ethereal.email/create
ETHEREAL_HOST=smtp.ethereal.email
ETHEREAL_PORT=587
ETHEREAL_SECURE=false
ETHEREAL_USER=your_ethereal_user@ethereal.email
ETHEREAL_PASSWORD=your_ethereal_password

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# JWT (required — server will not start without this)
JWT_SECRET=your_strong_secret_key_here

# Frontend URL (for CORS and OAuth redirect)
FRONTEND_URL=http://localhost:5173
```

---

## Running Locally

### Prerequisites
- Node.js 18+
- PostgreSQL (local instance or Docker)
- Redis (local instance or Docker)

### Redis (Docker)
```bash
docker run -d -p 6379:6379 redis:alpine
```

### Backend
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate deploy   # apply migrations to your DB
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

The app will be available at **http://localhost:5173**.

---

## Assignment Constraints

| Constraint | Status |
|---|---|
| No cron jobs | ✅ |
| No node-cron | ✅ |
| No in-memory scheduler | ✅ |
| No setInterval scheduling | ✅ |
| BullMQ delayed jobs | ✅ |
| Redis-backed queue | ✅ |
| PostgreSQL persistence | ✅ |
| Ethereal SMTP | ✅ |
| Worker concurrency = 1 | ✅ |
| Redis-backed rate limiting | ✅ |
| Jobs survive backend restarts | ✅ |

---

## Test Results

### TEST 1 — 5-second delay
Schedule 5 emails, `delayMs = 5000`.  
**Result: PASS** — `[SEND START]` timestamps spaced ~5 seconds apart, each after the previous `[SEND COMPLETE]`.

### TEST 2 — Strict sequential sending
Verify no two SMTP calls overlap.  
**Result: PASS** — `concurrency = 1` guarantees single in-flight send.

### TEST 3 — Hourly rate limit
Schedule 5 emails, `hourlyLimit = 2`.  
**Result: PASS** — 2 emails sent in current hour, 3 rescheduled to next UTC hour.

### TEST 4 — Multi-user isolation
User A schedules emails. Log in as User B.  
**Result: PASS** — User B sees zero of User A's emails; rate-limit counters are independent.

### TEST 5 — Backend restart persistence
Schedule email for 2 minutes in future, stop and restart backend.  
**Result: PASS** — BullMQ job fires at correct time after restart, no duplicate send.

### TEST 6 — Idempotency
Trigger a duplicate BullMQ job for a SENT `EmailJob`.  
**Result: PASS** — Worker logs `already SENT — skipping`, no second email sent.

### TEST 7 — Ethereal SMTP
Send email and open `[PREVIEW]` URL.  
**Result: PASS** — Email visible in Ethereal inbox with correct subject and body.

---

## Trade-offs & Known Limitations

| Decision | Reason |
|---|---|
| `concurrency = 1` | Required for strict sequential send guarantee with the current `waitForSendSlot` / `notifySendComplete` design. |
| Ethereal SMTP | Explicitly required by the assignment — not a real email provider. |
| Email list endpoints return up to 200 results | Prevents full table scans at 1000+ emails. Not paginated — documented limit. |
| Rate limiting uses UTC hour windows | Simple and deterministic. Window resets at the top of each UTC hour. |
| Redis persistence must be configured externally | The application assumes Redis data survives restarts — enable AOF in production. |
| `sendStartedAt` ≠ `sentAt` | `sendStartedAt` is captured immediately before the SMTP call; `sentAt` after it completes. Use `sendStartedAt` to measure send spacing. |
