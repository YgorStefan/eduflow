# Architecture

## Pattern

**Monolithic Next.js application** using the **Pages Router** pattern with API Routes as the backend layer. Supplemented by a standalone Python script for scheduled tasks.

```
┌─────────────────────────────────────────────────┐
│                  Browser (React)                │
│  Landing → Checkout → Login → Portal / Admin    │
├─────────────────────────────────────────────────┤
│              Next.js API Routes                 │
│  create-payment-intent │ webhooks/stripe │ admin │
├───────────┬─────────────┬───────────────────────┤
│  Stripe   │  Supabase   │  Firebase             │
│  (Pay)    │  (SQL/CRUD) │  (Auth + Firestore)   │
└───────────┴─────────────┴───────────────────────┘
         ↑
    Webhook events
         │
┌────────┴────────────────────────────────────────┐
│         GitHub Actions (Cron)                   │
│         scripts/churn_alert.py                  │
│         Firebase Firestore → ClickUp            │
└─────────────────────────────────────────────────┘
```

## Layers

### 1. Presentation Layer (Client-side React)
- **Pages:** `pages/index.tsx`, `pages/login.tsx`, `pages/portal.tsx`, `pages/admin.tsx`, `pages/aguardando.tsx`
- **Components:** `components/checkout/`, `components/portal/`, `components/admin/`
- Inline styles throughout (no CSS framework, only `globals.css` + unused `Home.module.css`)
- Client-side state management via React `useState` + `useEffect` hooks (no global state)

### 2. API Layer (Serverless)
- **`pages/api/create-payment-intent.ts`** — Creates Stripe PaymentIntent with metadata
- **`pages/api/webhooks/stripe.ts`** — Main orchestration handler (~170 lines, core business logic)
- **`pages/api/admin/students.ts`** — Protected admin endpoint for student listing
- **`pages/api/hello.ts`** — Default Next.js boilerplate (unused)

### 3. Service/Library Layer
- **`lib/stripe.ts`** — Stripe server client singleton
- **`lib/supabase.ts`** — Supabase client (anon) + admin (service role) singletons
- **`lib/firebase-client.ts`** — Firebase client SDK singleton (Auth + Firestore)
- **`lib/firebase-admin.ts`** — Firebase Admin SDK singleton (Auth + Firestore)

### 4. Middleware Layer
- **`middleware/withAuth.ts`** — HOC for client-side route protection (not Next.js middleware)

### 5. Scheduled Tasks Layer
- **`scripts/churn_alert.py`** — Python script for daily inactivity detection, runs via GitHub Actions

## Data Flow

### Checkout → Enrollment (Primary Flow)

```
Browser                          Server (API Routes)              External Services
  │                                    │                               │
  ├── POST /create-payment-intent ────►│                               │
  │   {name, email, course, amount}    ├── stripe.paymentIntents ─────►│ Stripe
  │◄── {clientSecret} ────────────────┤                               │
  │                                    │                               │
  ├── stripe.confirmPayment() ────────────────────────────────────────►│ Stripe
  │                                    │                               │
  │                                    │◄── Webhook: payment_intent ──┤ Stripe
  │                                    │    .succeeded                 │
  │                                    │                               │
  │                                    ├── Upsert student ────────────►│ Supabase
  │                                    ├── Insert enrollment ─────────►│ Supabase
  │                                    ├── Insert payment ────────────►│ Supabase
  │                                    ├── Create/get Firebase user ──►│ Firebase Auth
  │                                    ├── Set Firestore user doc ────►│ Firebase Firestore
  │                                    ├── Generate password reset ───►│ Firebase Auth
  │                                    ├── Notify Discord ────────────►│ Discord
  │                                    └── Create ClickUp task ───────►│ ClickUp
```

### Churn Detection (Daily Cron)

```
GitHub Actions (cron 9:00 UTC)
  │
  └── python scripts/churn_alert.py
        │
        ├── Stream all users ◄──────── Firebase Firestore
        │   Filter: access_enabled=true AND last_login < (now - 7 days)
        │
        ├── Create retention task ───► ClickUp API
        │
        └── Log alert ──────────────► Supabase (churn_alerts)
```

## Key Abstractions

### `withAuth(Component, role)` — Client-side Auth HOC
- Wraps page components for protected routes
- Checks Firebase Auth state → redirects to `/login` if unauthenticated
- Checks Firestore `access_enabled` → redirects to `/aguardando` if pending
- Checks Firestore `role` → redirects to `/portal` if not admin (for admin routes)
- Returns `null` during verification (no loading indicator)

### Error Handling Pattern
- All webhook errors: log to `error_logs` table + notify Discord + return 500
- Non-blocking operations (password reset, ClickUp task): fire-and-forget with `.catch(() => {})`
- Client-side: try/catch with `setError()` state for user-facing messages

## Entry Points

| Entry Point                       | Type              | Trigger              |
|-----------------------------------|-------------------|----------------------|
| `pages/index.tsx`                 | Page              | User visits `/`      |
| `pages/login.tsx`                 | Page              | User visits `/login` |
| `pages/portal.tsx`                | Protected page    | User visits `/portal` |
| `pages/admin.tsx`                 | Protected page    | Admin visits `/admin` |
| `pages/api/webhooks/stripe.ts`   | Webhook endpoint  | Stripe event         |
| `pages/api/create-payment-intent.ts` | API endpoint  | Checkout form submit |
| `pages/api/admin/students.ts`    | Protected API     | Admin dashboard load |
| `scripts/churn_alert.py`         | CLI script        | GitHub Actions cron  |

## Dual Database Strategy

The project uses **two databases by design**:

1. **Supabase (PostgreSQL)** — Source of truth for business data: students, enrollments, payments, churn alerts
2. **Firebase Firestore** — Real-time user state: access control, login tracking, course progress

The webhook handler writes to both databases atomically (sequentially, not transactionally). The `supabase_id` field in Firestore links the two systems.
