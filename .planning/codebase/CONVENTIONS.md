# Code Conventions

## Code Style

### TypeScript
- **Strict mode** enabled — `tsconfig.json` has `"strict": true`
- **No semicolons** in most files (inconsistent — `_app.tsx` and `_document.tsx` use semicolons, rest don't)
- **Single quotes** for string literals throughout
- **Arrow functions** for callbacks, `function` keyword for component declarations and handlers
- **Type assertions** with `as` keyword (e.g., `req.body as { name: string; ... }`)
- **Non-null assertions** (`!`) used liberally for env vars (e.g., `process.env.STRIPE_SECRET_KEY!`)

### Python
- Standard Python 3.11 conventions
- Type hints for return types (`-> None`, `-> str | None`)
- Global mutable state (`db`, `supabase` initialized by `_init_clients()`)
- `__init__.py` files in `scripts/` and `tests/` for package structure

### Formatting
- No Prettier config found — formatting not enforced beyond ESLint
- ESLint config: `eslint-config-next` (default Next.js rules)
- Indentation: 2 spaces (TypeScript), 4 spaces (Python)

## Naming Conventions

### Variables & Functions
- **camelCase** for all TypeScript variables, functions, state: `clientSecret`, `setForm`, `handleContinue`
- **snake_case** for Python functions: `create_clickup_task`, `log_to_supabase`
- **SCREAMING_SNAKE** for Python constants: `INACTIVITY_DAYS`
- **PascalCase** for React components and TypeScript interfaces: `CheckoutForm`, `Student`

### Database Fields
- **snake_case** throughout — `student_id`, `created_at`, `stripe_payment_id`, `access_enabled`
- Consistent across Supabase (SQL) and Firestore (NoSQL) collections

### UI Text
- All user-facing text in **Brazilian Portuguese**: "Entrar", "Processando...", "Assinatura inválida"
- Error messages: descriptive in Portuguese — "Email ou senha incorretos"
- API responses: Portuguese — `{ error: 'Não autorizado' }`

## Patterns

### Singleton Initialization
All external service clients use the singleton pattern with lazy init guards:

```typescript
// Firebase pattern — check existing apps
const app = getApps().length === 0 ? initializeApp(config) : getApps()[0]

// Stripe pattern — direct instantiation
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { ... })

// Supabase pattern — direct instantiation
export const supabaseAdmin = createClient(url, serviceRoleKey)
```

### Component Pattern
- **Functional components only** (no class components)
- **Hooks** for all side effects: `useState`, `useEffect`, `onAuthStateChanged`
- **Props interfaces** defined inline or as `interface Props { ... }` above the component
- **No prop spreading** — explicit prop passing

### Auth Protection Pattern
```typescript
// HOC wraps page component
export default withAuth(AdminPage, 'admin')

// withAuth checks:
// 1. Firebase Auth state → redirect to /login if unauthenticated
// 2. Firestore access_enabled → redirect to /aguardando if false
// 3. Firestore role → redirect to /portal if not admin (for admin pages)
```

### Styling Pattern
- **Inline styles** on every element — `style={{ padding: 10, border: '1px solid #d1d5db' }}`
- No CSS framework (Tailwind, styled-components, etc.)
- Color palette hardcoded: `#2563eb` (blue), `#6b7280` (gray), `#dc2626` (red), `#16a34a` (green)
- `globals.css` provides only box-sizing reset, body font, and mobile overrides

## Error Handling

### Server-side (API Routes)
```typescript
// Pattern: try/catch → notify Discord → log to Supabase → return 500
try {
  // operation
} catch (err: unknown) {
  const msg = err instanceof Error ? err.message : String(err)
  await notifyDiscord(`🔴 Erro: ${msg}`)
  await supabaseAdmin.from('error_logs').insert({ event, error: msg })
  return res.status(500).json({ error: 'Erro interno' })
}
```

### Client-side (Pages)
```typescript
// Pattern: try/catch → setError state → display in UI
try {
  await signInWithEmailAndPassword(auth, email, password)
} catch {
  setError('Email ou senha incorretos')
} finally {
  setLoading(false)
}
```

### Non-blocking Operations
```typescript
// Fire-and-forget pattern for non-critical ops
adminAuth.generatePasswordResetLink(email)
  .then((link) => notifyDiscord(`✅ Link: ${link}`))
  .catch(() => {})

createClickUpTask(name).catch(() => {})
```

## Import Organization

No explicit import sorting. General pattern observed:
1. React/Next.js imports
2. Firebase/Stripe/Supabase SDK imports
3. Local lib imports (`@/lib/...`)
4. Local component imports (`@/components/...`)
5. Local middleware imports (`@/middleware/...`)
6. Type-only imports (`import type { ... }`)

## API Response Pattern

- Success: `res.json(data)` or `res.json({ received: true })`
- Client error: `res.status(400).json({ error: 'message' })`
- Auth error: `res.status(401).json({ error: 'Não autorizado' })`
- Permission error: `res.status(403).json({ error: 'Acesso negado' })`
- Method not allowed: `res.status(405).end()`
- Server error: `res.status(500).json({ error: 'Erro interno' })`
