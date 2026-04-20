# External Integrations

## Stripe (Payments)

**Client library:** `@stripe/stripe-js` ^9.2.0 (browser), `stripe` ^22.0.2 (server)

### Client-side (`lib/stripe.ts`)
- Initializes server Stripe with `STRIPE_SECRET_KEY` and API version `2024-04-10`
- Used in `pages/api/create-payment-intent.ts` to create PaymentIntents

### Browser-side (`pages/index.tsx`)
- `loadStripe(NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)` initializes Stripe.js
- `<Elements>` provider wraps `<CheckoutForm>` with `clientSecret` + appearance config
- `PaymentElement` renders Stripe's pre-built payment form
- `stripe.confirmPayment()` with `redirect: 'if_required'`

### Webhook (`pages/api/webhooks/stripe.ts`)
- Listens for `payment_intent.succeeded` events
- Validates signature with `stripe.webhooks.constructEvent()` using `STRIPE_WEBHOOK_SECRET`
- Body parser disabled (`config.api.bodyParser = false`) — reads raw buffer from stream
- Orchestrates: upsert student → enrollment → payment → Firebase user → Firestore doc → password reset link → ClickUp task

### Environment Variables
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — browser
- `STRIPE_SECRET_KEY` — server
- `STRIPE_WEBHOOK_SECRET` — webhook validation

---

## Supabase (PostgreSQL)

**Client library:** `@supabase/supabase-js` ^2.104.0

### Client setup (`lib/supabase.ts`)
- Exports `supabase` (anon key — client-side, currently unused in pages)
- Exports `supabaseAdmin` (service role key — server-side writes)

### Usage
- **Webhook handler:** Upserts into `students`, `enrollments`, `payments`, `error_logs`
- **Admin API:** Reads `students` with nested `enrollments` and `payments` joins
- **Python script:** Writes to `churn_alerts` table via Python Supabase client

### Database Schema (5 tables)
| Table           | Key Columns                              |
|-----------------|------------------------------------------|
| `students`      | `id` (UUID), `email`, `name`             |
| `enrollments`   | `student_id` (FK), `course`, `status`    |
| `payments`      | `student_id` (FK), `stripe_payment_id`, `amount` |
| `churn_alerts`  | `student_id` (FK), `clickup_task_id`     |
| `error_logs`    | `event`, `error`                         |

Schema defined in `supabase/migrations/001_initial.sql`. Indexes on `student_id` for enrollments, payments, churn_alerts.

### Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

---

## Firebase (Auth + Firestore)

### Client SDK (`lib/firebase-client.ts`)
- Firebase v12 modular API
- Singleton init with `getApps()` guard
- Exports `auth` (Firebase Auth) and `db` (Firestore)
- Config from `NEXT_PUBLIC_FIREBASE_*` env vars

### Admin SDK (`lib/firebase-admin.ts`)
- `firebase-admin` v13 for server-side
- `cert()` credential with `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`
- Private key `\\n` → `\n` replacement for env var encoding
- Exports `adminDb` (Firestore Admin) and `adminAuth` (Auth Admin)

### Auth Usage
- **Login page:** `signInWithEmailAndPassword()` for student/admin login
- **Webhook:** `adminAuth.createUser()` to provision new accounts, `adminAuth.getUserByEmail()` to check existing
- **Password reset:** `adminAuth.generatePasswordResetLink()` sent via Discord notification
- **Auth middleware:** `onAuthStateChanged()` listener in `withAuth` HOC

### Firestore Collections
| Collection                          | Document Key | Fields                                   |
|-------------------------------------|-------------|------------------------------------------|
| `users/{uid}`                       | Firebase UID | `email`, `name`, `access_enabled`, `role`, `supabase_id`, `last_login` |
| `courses/{courseId}/progress/{uid}` | Firebase UID | `progress_pct`, `completed_lessons`, `last_accessed` |

### Firestore Usage
- **Portal page:** Real-time `onSnapshot()` on `users/{uid}` for student name, `courses/{courseId}/progress/{uid}` for progress bar
- **Webhook:** `adminDb.collection('users').doc(uid).set({...}, {merge: true})` to create/update user docs
- **Auth HOC:** `getDoc()` on `users/{uid}` to check `access_enabled` and `role`
- **Churn script:** `db.collection("users").stream()` to iterate all users for inactivity check

### Environment Variables
- `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID`
- `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`

---

## ClickUp (Task Management)

**No SDK — raw HTTP via `fetch` (TypeScript) and `requests` (Python)**

### From Webhook Handler (`pages/api/webhooks/stripe.ts`)
- Creates "Boas-vindas: {name}" task with 24h deadline and priority 2 (high)
- Fire-and-forget (non-blocking `.catch(() => {})`)
- Falls back to Discord notification on failure

### From Churn Script (`scripts/churn_alert.py`)
- Creates "Retenção urgente: {name}" task with priority 1 (urgent)
- Includes description with email and inactivity days
- Returns task ID for Supabase logging
- 10 second timeout on HTTP request

### API Endpoint
- `POST https://api.clickup.com/api/v2/list/{CLICKUP_LIST_ID}/task`

### Environment Variables
- `CLICKUP_API_TOKEN`
- `CLICKUP_LIST_ID`

---

## Discord (Error Alerts)

**No SDK — raw HTTP via `fetch`**

### From Webhook Handler (`pages/api/webhooks/stripe.ts`)
- `notifyDiscord()` sends content messages to webhook URL
- Alerts on: student creation failure, enrollment failure, payment failure, Firebase errors
- Success notification: "✅ Novo aluno: {name} — link de acesso: {link}"
- Optional — skips silently if `DISCORD_WEBHOOK_URL` is not set

### Environment Variables
- `DISCORD_WEBHOOK_URL` (optional)

---

## GitHub Actions (CI/CD + Cron)

### `ci.yml` — Continuous Integration
- Triggers on push to `main` and all PRs
- Two parallel jobs: `test` (Node 20, `npx jest`) and `test-python` (Python 3.11, `pytest`)

### `churn.yml` — Daily Churn Alert
- Scheduled cron: `0 9 * * *` (9:00 UTC daily)
- Also supports manual dispatch (`workflow_dispatch`)
- Runs `python scripts/churn_alert.py` with all secrets injected as env vars

### Required Secrets
`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `CLICKUP_API_TOKEN`, `CLICKUP_LIST_ID`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
