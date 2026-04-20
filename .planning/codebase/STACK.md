# Technology Stack

## Languages & Runtimes

| Language   | Version | Usage                          |
|------------|---------|--------------------------------|
| TypeScript | ^5      | Primary — frontend, API routes |
| Python     | 3.11+   | Churn detection script         |
| SQL        | —       | Supabase migrations (PostgreSQL) |

- TypeScript strict mode enabled (`tsconfig.json` → `"strict": true`)
- Target: ES2017 with ESNext modules (`"module": "esnext"`)
- Path alias `@/*` maps to project root (e.g., `@/lib/stripe` → `./lib/stripe.ts`)

## Framework

| Framework  | Version     | Notes                          |
|------------|-------------|--------------------------------|
| Next.js    | 14.2.35     | **Pages Router** (not App Router) |
| React      | ^18         | Client-side rendering + hooks  |
| React DOM  | ^18         | —                              |

- Config: `next.config.mjs` — minimal, only `reactStrictMode: true`
- Custom `_app.tsx` loads `globals.css`
- Custom `_document.tsx` sets `lang="en"`

## Key Dependencies

### Production

| Package                    | Version    | Purpose                        |
|----------------------------|------------|--------------------------------|
| `@stripe/stripe-js`       | ^9.2.0     | Stripe.js browser SDK          |
| `@stripe/react-stripe-js` | ^6.2.0     | React bindings for Stripe Elements |
| `stripe`                   | ^22.0.2    | Server-side Stripe SDK         |
| `@supabase/supabase-js`   | ^2.104.0   | Supabase client (SQL queries)  |
| `firebase`                 | ^12.12.0   | Firebase client SDK (Auth + Firestore) |
| `firebase-admin`           | ^13.8.0    | Firebase Admin SDK (server-side) |
| `next`                     | 14.2.35    | Framework                      |

### Development

| Package                       | Version  | Purpose                          |
|-------------------------------|----------|----------------------------------|
| `jest`                        | ^30.3.0  | Test runner (TypeScript tests)   |
| `ts-jest`                     | ^29.4.9  | TypeScript transform for Jest    |
| `jest-environment-jsdom`      | ^30.3.0  | DOM environment (available but not used) |
| `@testing-library/jest-dom`   | ^6.9.1   | DOM assertion matchers           |
| `@testing-library/react`      | ^16.3.2  | React component testing          |
| `node-mocks-http`             | ^1.17.2  | Mock HTTP req/res for API tests  |
| `eslint` + `eslint-config-next` | ^8     | Linting                         |
| `typescript`                  | ^5       | Compiler                        |

### Python Dependencies (`scripts/requirements.txt`)

| Package          | Version | Purpose                       |
|------------------|---------|-------------------------------|
| `firebase-admin` | 6.5.0   | Firestore access from Python  |
| `supabase`       | 2.4.6   | Supabase writes from Python   |
| `requests`       | 2.31.0  | HTTP calls (ClickUp API)      |
| `python-dotenv`  | 1.0.1   | Env file loading (local dev)  |
| `pytest`         | 8.1.1   | Python test runner             |

## Configuration Files

| File                | Purpose                                 |
|---------------------|-----------------------------------------|
| `tsconfig.json`     | TypeScript config, path aliases         |
| `next.config.mjs`   | Next.js config (ESM, strict mode)       |
| `jest.config.ts`     | Jest config (ts-jest, node env, path mapper) |
| `vercel.json`        | Vercel build config (`next build`, `.next` output) |
| `.env.local.example` | Template for all required env vars      |
| `.gitignore`         | Standard Next.js ignores + `.env*.local` |

## Build & Scripts

| Script       | Command             | Purpose              |
|--------------|---------------------|-----------------------|
| `dev`        | `next dev`          | Local dev server      |
| `build`      | `next build`        | Production build      |
| `start`      | `next start`        | Production server     |
| `lint`       | `next lint`         | ESLint                |
| `test`       | `jest`              | TypeScript tests      |
| `test:watch` | `jest --watch`      | Watch mode            |

## Deployment

- **Platform:** Vercel (serverless)
- **Build command:** `next build`
- **Output directory:** `.next`
- **CI/CD:** GitHub Actions (`ci.yml` for tests, `churn.yml` for daily cron)
