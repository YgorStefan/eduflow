# Testing

## Frameworks

| Language   | Framework        | Config                 |
|------------|------------------|------------------------|
| TypeScript | Jest + ts-jest   | `jest.config.ts`       |
| Python     | pytest           | `scripts/requirements.txt` |

## Jest Configuration (`jest.config.ts`)

```typescript
const config: Config = {
  testEnvironment: 'node',           // Node env (not jsdom)
  transform: { '^.+\\.tsx?$': 'ts-jest' },
  testMatch: ['<rootDir>/tests/**/*.test.ts'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/$1' },  // Mirrors tsconfig paths
}
```

- Uses **node** environment (not jsdom) despite having `jest-environment-jsdom` installed
- Path alias `@/` mapped to project root
- Test files must be in `tests/` directory with `.test.ts` extension

## Test Structure

```
tests/
├── __init__.py                       # Python package marker
├── api/
│   └── stripe-webhook.test.ts        # Jest: webhook handler (2 tests)
└── python/
    ├── __init__.py                   # Python package marker
    └── test_churn_alert.py           # pytest: churn detection (2 tests)
```

## TypeScript Tests

### `tests/api/stripe-webhook.test.ts`

**What it tests:** The Stripe webhook handler (`pages/api/webhooks/stripe.ts`)

**Test count:** 2

| Test                                         | What it verifies                      |
|----------------------------------------------|---------------------------------------|
| `retorna 400 para assinatura inválida`       | Invalid Stripe signature → 400       |
| `retorna 200 e processa payment_intent.succeeded` | Valid event → 200, full flow works |

**Mocking strategy:**
- **All 3 libs fully mocked** with `jest.mock()`:
  - `@/lib/supabase` — `supabaseAdmin` with chainable `.from().insert().select().eq().single()` pattern
  - `@/lib/firebase-admin` — `adminDb` and `adminAuth` with resolved promises
  - `@/lib/stripe` — `stripe.webhooks.constructEvent` mock
- **`global.fetch` mocked** in `beforeEach` for Discord/ClickUp HTTP calls
- `node-mocks-http` `createMocks()` for request/response objects
- Request body sent as `Buffer.from('{}')` to match raw body parsing

**Coverage gaps:**
- No test for missing metadata (400 case)
- No test for Supabase insert failures
- No test for Firebase user creation failure
- No test for method other than POST (405 case)
- No test for non-`payment_intent.succeeded` events (early 200 return)

## Python Tests

### `tests/python/test_churn_alert.py`

**What it tests:** The churn detection logic in `scripts/churn_alert.py`

**Test count:** 2

| Test                                  | What it verifies                              |
|---------------------------------------|-----------------------------------------------|
| `test_detects_inactive_users`         | Users inactive >7 days trigger task creation  |
| `test_skips_recently_active_users`    | Users active within 7 days are skipped        |

**Mocking strategy:**
- `@pytest.fixture(autouse=True)` sets all required env vars via `monkeypatch.setenv`
- `unittest.mock.patch` for `scripts.churn_alert.db`, `create_clickup_task`, `log_to_supabase`
- Helper `make_user_doc(days_ago, access_enabled)` creates mock Firestore documents
- Tests run the `run()` function directly (not `_init_clients()`)

**Coverage gaps:**
- No test for `_init_clients()` initialization
- No test for `create_clickup_task()` HTTP call behavior
- No test for `log_to_supabase()` actual insert
- No test for user with `last_login = None` (edge case in `run()`)

## Running Tests

```bash
# TypeScript (Jest)
npm test                    # or: npx jest
npm run test:watch          # watch mode

# Python (pytest)
python -m pytest tests/python/ -v
```

## CI Integration

Tests run automatically via GitHub Actions (`ci.yml`):

| Job           | Runner          | Steps                                |
|---------------|-----------------|--------------------------------------|
| `test`        | ubuntu-latest   | Node 20, `npm ci`, `npx jest --no-coverage` |
| `test-python` | ubuntu-latest   | Python 3.11, `pip install`, `pytest -v` |

Triggers: push to `main`, all pull requests.

## Test Libraries Available but Unused

- `@testing-library/react` — installed but no React component tests exist
- `@testing-library/jest-dom` — installed but no DOM assertions used
- `jest-environment-jsdom` — installed but Jest runs in `node` environment

## Overall Assessment

- **Total test count:** 4 tests (2 Jest + 2 pytest)
- **Coverage:** Low — only webhook handler and churn detection have tests
- **No tests for:** React components, pages, auth middleware, payment intent API, Supabase queries
- **Mocking quality:** Good isolation — all external dependencies mocked
- **Test naming:** Portuguese, descriptive
