# Technical Concerns

## Technical Debt

### 1. No Transaction Safety in Webhook Handler
**File:** `pages/api/webhooks/stripe.ts`
**Severity:** High

The webhook handler performs 6 sequential writes (Supabase student, enrollment, payment + Firebase user, Firestore doc + password reset). If any step fails after earlier steps succeed, the system is left in an **inconsistent state** — e.g., a student record exists in Supabase but no Firebase account was created. There is no rollback mechanism.

### 2. Non-null Assertions on Environment Variables
**Files:** `lib/stripe.ts`, `lib/supabase.ts`, `lib/firebase-client.ts`
**Severity:** Medium

All service clients use `process.env.VAR_NAME!` which will throw cryptic runtime errors if env vars are missing. No startup validation exists to check for required configuration.

### 3. Inline Styles Throughout
**Files:** All pages and components
**Severity:** Low (cosmetic)

Every UI element uses `style={{ ... }}` props. This makes the codebase harder to maintain, prevents reuse, eliminates hover/focus states (partially worked around), and increases bundle size. The installed CSS modules (`Home.module.css`) are not actually used by any page component.

### 4. Unused Boilerplate Files
**Files:** `pages/api/hello.ts`, `styles/Home.module.css`
**Severity:** Low

Default Next.js boilerplate that was never cleaned up. `hello.ts` returns `{ name: "John Doe" }` and is not referenced anywhere. `Home.module.css` has full CSS module styling but is not imported by any component.

### 5. Hardcoded Course Data
**File:** `pages/index.tsx`
**Severity:** Medium

```typescript
const COURSE = { name: 'Mentoria EduFlow Pro', price: 49700, slug: 'mentoria-eduflow' }
```

Course name, price, and slug are hardcoded in the landing page. No multi-course support. Portal page also hardcodes `courseId="mentoria-eduflow"`.

### 6. `_document.tsx` Language Mismatch
**File:** `pages/_document.tsx`
**Severity:** Low

HTML `lang` attribute is set to `"en"` but all UI text is in Brazilian Portuguese. Should be `"pt-BR"`.

---

## Security Considerations

### 1. Webhook Signature Validation ✅
**File:** `pages/api/webhooks/stripe.ts`

Stripe webhook signature is properly validated using `stripe.webhooks.constructEvent()`. Raw body parsing is enabled. This is correctly implemented.

### 2. Admin API Protection ✅
**File:** `pages/api/admin/students.ts`

Admin endpoint verifies Firebase ID token AND checks `role: admin` in Firestore. Correctly rejects unauthorized access.

### 3. Client-side Auth Only ⚠️
**File:** `middleware/withAuth.ts`

The `withAuth` HOC runs entirely on the client. While the admin API endpoint has server-side protection, the portal page (`portal.tsx`) has no server-side auth check on its data. The Firestore security rules (documented in README) provide the actual data-level protection.

### 4. `supabaseAdmin` Service Role Key Exposure Risk
**File:** `lib/supabase.ts`

The `supabaseAdmin` client is instantiated at module level. If this module is accidentally imported in a client-side file, the `SUPABASE_SERVICE_ROLE_KEY` would be exposed. The env var prefix convention (`NEXT_PUBLIC_` for safe vs. non-prefixed for server-only) provides protection, but there's no tree-shaking guard.

### 5. No CSRF Protection on API Routes
**Files:** `pages/api/create-payment-intent.ts`

The payment intent creation endpoint has no CSRF protection. It accepts any POST request with a JSON body. While this is mitigated by Stripe's own payment confirmation flow, it could be abused to create unlimited PaymentIntents.

### 6. No Rate Limiting
**Files:** All API routes

No rate limiting on any endpoint. The webhook endpoint is protected by Stripe signature, but `create-payment-intent` and the public-facing pages have no throttling.

---

## Performance Concerns

### 1. Firebase Client SDK Bundle Size
**File:** `lib/firebase-client.ts`

Firebase v12 client SDK is loaded in the browser bundle. Even with the modular API (tree-shakeable), `firebase/auth` and `firebase/firestore` add significant weight (~100-200KB).

### 2. No Image Optimization
**File:** `public/favicon.ico`

Only a favicon exists. No images in the project, but `next/image` is not imported anywhere. If images are added later, the default `<img>` pattern won't benefit from Next.js image optimization.

### 3. Real-time Listeners Not Scoped
**Files:** `pages/portal.tsx`, `components/portal/CourseProgress.tsx`

The portal page opens two concurrent Firestore `onSnapshot()` listeners. While cleanup is properly handled in `useEffect` return functions, there's no connection pooling or batching.

---

## Fragile Areas

### 1. Webhook Handler — Single Point of Failure
**File:** `pages/api/webhooks/stripe.ts` (171 lines)

This is the **most critical and most complex** file. It handles the entire enrollment flow: student creation, enrollment, payment recording, Firebase account provisioning, Firestore document creation, password reset, Discord notification, and ClickUp task creation. Any change here risks breaking the core business flow.

### 2. `churn_alert.py` — Global Mutable State
**File:** `scripts/churn_alert.py`

```python
db = None
supabase = None
```

Module-level globals are set by `_init_clients()` which must be called before `run()`. Tests patch these directly, making the test-production coupling fragile.

### 3. `churn_alert.py` — Missing `student_id` in Insert
**File:** `scripts/churn_alert.py` (line 49)

```python
supabase.table("churn_alerts").insert({
    "clickup_task_id": clickup_task_id,
}).execute()
```

The `churn_alerts` table requires a `student_id` (NOT NULL FK), but the insert only includes `clickup_task_id`. This will fail at runtime with a database constraint violation. The `student_email` parameter in `log_to_supabase()` is received but never used.

### 4. `withAuth` HOC — No Loading State
**File:** `middleware/withAuth.ts`

During auth verification (which involves a Firestore read), the HOC returns `null` — showing a blank page. There's no loading spinner or skeleton screen, which creates a flash of empty content.

### 5. Payment Intent — No Input Validation
**File:** `pages/api/create-payment-intent.ts`

The endpoint destructures `req.body` directly with no validation. A malicious request could set `amount: 0` or `amount: -100` or omit required fields. Stripe would reject invalid amounts, but the error handling is minimal.

---

## Known Bugs

### 1. `churn_alerts` Insert Missing `student_id`
**Confirmed bug** in `scripts/churn_alert.py` line 49. The `log_to_supabase()` function omits the required `student_id` foreign key. Every call will throw a Supabase/PostgreSQL error at runtime.

### 2. Churn Script `last_login > cutoff` Logic
**File:** `scripts/churn_alert.py` line 63

```python
if last_login is None or last_login > cutoff:
    continue
```

The condition `last_login > cutoff` skips users whose login is MORE RECENT than the cutoff — this is correct. But `last_login is None` skips users who NEVER logged in, which means newly created accounts that never logged in are silently ignored rather than flagged.
