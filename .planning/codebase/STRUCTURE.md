# Project Structure

## Directory Layout

```
eduflow/
├── .github/
│   └── workflows/
│       ├── ci.yml                        # CI: Jest + pytest on push/PR
│       └── churn.yml                     # Cron: daily churn detection
├── components/
│   ├── admin/
│   │   ├── RevenueChart.tsx              # CSS bar chart (no library)
│   │   └── StudentTable.tsx              # HTML table with status badges
│   ├── checkout/
│   │   └── CheckoutForm.tsx              # Stripe PaymentElement wrapper
│   └── portal/
│       └── CourseProgress.tsx            # Real-time progress bar (Firestore)
├── docs/
│   └── superpowers/                      # (empty/unknown — no files found)
├── lib/
│   ├── firebase-admin.ts                 # Firebase Admin SDK singleton
│   ├── firebase-client.ts                # Firebase client SDK singleton
│   ├── stripe.ts                         # Stripe server client singleton
│   └── supabase.ts                       # Supabase client + admin singletons
├── middleware/
│   └── withAuth.ts                       # Client-side auth HOC (not Next.js middleware)
├── pages/
│   ├── _app.tsx                          # App wrapper (loads globals.css)
│   ├── _document.tsx                     # HTML document (lang="en")
│   ├── admin.tsx                         # Admin dashboard (protected)
│   ├── aguardando.tsx                    # Pending access page
│   ├── index.tsx                         # Landing + checkout flow
│   ├── login.tsx                         # Firebase email/password login
│   ├── portal.tsx                        # Student portal (protected)
│   ├── api/
│   │   ├── create-payment-intent.ts      # POST: create Stripe PaymentIntent
│   │   ├── hello.ts                      # Default boilerplate (unused)
│   │   ├── admin/
│   │   │   └── students.ts              # GET: list students (admin only)
│   │   └── webhooks/
│   │       └── stripe.ts                # POST: Stripe webhook handler
│   └── fonts/                            # (font files, unused in code)
├── public/
│   └── favicon.ico                       # Favicon
├── scripts/
│   ├── __init__.py                       # Python package marker
│   ├── churn_alert.py                    # Daily churn detection script
│   └── requirements.txt                  # Python dependencies
├── styles/
│   ├── globals.css                       # Minimal global styles + responsive
│   └── Home.module.css                   # Next.js boilerplate (unused)
├── supabase/
│   └── migrations/
│       └── 001_initial.sql               # Full PostgreSQL schema (5 tables)
├── tests/
│   ├── __init__.py                       # Python package marker
│   ├── api/
│   │   └── stripe-webhook.test.ts        # Jest: webhook handler tests
│   └── python/
│       ├── __init__.py                   # Python package marker
│       └── test_churn_alert.py           # pytest: churn script tests
├── .env.local.example                    # Template for environment variables
├── .gitignore                            # Standard Next.js ignores
├── jest.config.ts                        # Jest configuration
├── next.config.mjs                       # Next.js configuration
├── package.json                          # Node.js dependencies
├── tsconfig.json                         # TypeScript configuration
└── vercel.json                           # Vercel deployment config
```

## Key Locations

| What                  | Where                                    |
|-----------------------|------------------------------------------|
| Pages (routes)        | `pages/*.tsx`                             |
| API endpoints         | `pages/api/**/*.ts`                      |
| React components      | `components/{domain}/*.tsx`              |
| Service clients       | `lib/*.ts`                                |
| Auth middleware        | `middleware/withAuth.ts`                 |
| Python scripts        | `scripts/*.py`                           |
| Database migrations   | `supabase/migrations/*.sql`             |
| TypeScript tests      | `tests/api/*.test.ts`                   |
| Python tests          | `tests/python/test_*.py`               |
| CI/CD workflows       | `.github/workflows/*.yml`               |
| Global styles         | `styles/globals.css`                    |
| Environment template  | `.env.local.example`                    |

## File Count Summary

| Directory         | Files | Description                    |
|-------------------|-------|--------------------------------|
| `pages/`          | 7     | 5 pages + 2 Next.js internals |
| `pages/api/`      | 4     | 3 real endpoints + 1 boilerplate |
| `components/`     | 4     | Organized by domain            |
| `lib/`            | 4     | One per external service       |
| `middleware/`      | 1     | Single auth HOC                |
| `scripts/`        | 2     | Python script + requirements   |
| `tests/`          | 2     | 1 Jest + 1 pytest              |
| `supabase/`       | 1     | Single migration               |
| `styles/`         | 2     | 1 used + 1 boilerplate         |
| `.github/`        | 2     | CI + cron workflows            |
| **Total**         | **~29** | Source files (excluding config) |

## Naming Conventions

### Files
- **Pages:** lowercase, single word — `portal.tsx`, `admin.tsx`, `login.tsx`
- **Components:** PascalCase — `CheckoutForm.tsx`, `StudentTable.tsx`, `RevenueChart.tsx`
- **Lib modules:** kebab-case — `firebase-client.ts`, `firebase-admin.ts`
- **API routes:** kebab-case — `create-payment-intent.ts`
- **Python:** snake_case — `churn_alert.py`, `test_churn_alert.py`
- **SQL:** numbered prefix — `001_initial.sql`

### Exports
- **Components:** Named exports (not default) — `export function CheckoutForm`
- **Pages:** Default exports — `export default function Home()`
- **Lib clients:** Named exports — `export const stripe`, `export const supabaseAdmin`
- **Middleware:** Named export — `export function withAuth()`

### Directories
- Components organized by **domain**: `checkout/`, `portal/`, `admin/`
- Tests mirrored by **technology**: `tests/api/` (TypeScript), `tests/python/`
