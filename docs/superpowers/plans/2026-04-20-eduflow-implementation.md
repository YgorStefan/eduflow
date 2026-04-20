# EduFlow Pro — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir o EduFlow Pro — sistema de retenção e operação de alunos com checkout Stripe, API de orquestração, portal do aluno, dashboard admin e script de alerta de churn.

**Architecture:** Next.js (Pages Router) no Vercel com API Routes como serverless functions. Firebase para autenticação e perfil em tempo real dos alunos. Supabase (PostgreSQL) para histórico financeiro. Script Python independente via GitHub Actions para detecção de churn.

**Tech Stack:** Next.js 14, TypeScript, Stripe.js, Firebase (client + admin), Supabase, Jest, pytest, GitHub Actions, Vercel

---

## Estrutura de Arquivos

```
eduflow/
├── pages/
│   ├── index.tsx                   # Landing + checkout
│   ├── login.tsx                   # Login via Firebase Auth
│   ├── portal.tsx                  # Portal do aluno (protegido)
│   ├── admin.tsx                   # Dashboard admin (protegido)
│   └── api/
│       ├── webhooks/
│       │   └── stripe.ts           # Recebe e processa eventos Stripe
│       └── admin/
│           └── students.ts         # Listagem de alunos para o admin
├── components/
│   ├── checkout/
│   │   └── CheckoutForm.tsx        # Formulário Stripe Elements
│   ├── portal/
│   │   └── CourseProgress.tsx      # Progresso do aluno em tempo real
│   └── admin/
│       ├── StudentTable.tsx        # Tabela de alunos com status
│       └── RevenueChart.tsx        # Gráfico de faturamento (SQL)
├── lib/
│   ├── firebase-client.ts          # Firebase SDK client (browser)
│   ├── firebase-admin.ts           # Firebase Admin SDK (servidor)
│   ├── supabase.ts                 # Supabase client
│   └── stripe.ts                   # Stripe server client
├── middleware/
│   └── withAuth.ts                 # HOC para rotas protegidas
├── scripts/
│   └── churn_alert.py              # Detecta inativos → cria task ClickUp
├── tests/
│   ├── api/
│   │   └── stripe-webhook.test.ts  # Testes do webhook handler
│   └── python/
│       └── test_churn_alert.py     # Testes do script Python
├── supabase/
│   └── migrations/
│       └── 001_initial.sql         # Schema completo
├── .github/
│   └── workflows/
│       ├── ci.yml                  # Testes em todo PR
│       └── churn.yml               # Cron diário do script Python
├── .env.local.example              # Template de variáveis de ambiente
└── package.json
```

---

## Task 1: Inicialização do Projeto

**Files:**
- Create: `package.json`
- Create: `.env.local.example`
- Create: `tsconfig.json`

- [ ] **Step 1: Criar projeto Next.js com TypeScript**

O diretório já contém `.git/` e `docs/`, então scaffold em diretório adjacente e copie:

```bash
cd C:/Users/Ygor

# Scaffolda em diretório separado
npx create-next-app@14 eduflow-setup --typescript --no-app --no-tailwind --no-src-dir --import-alias "@/*" --yes

# Copia arquivos de configuração e estrutura base para o repositório
cp eduflow-setup/package.json \
   eduflow-setup/tsconfig.json \
   eduflow-setup/next.config.mjs \
   eduflow-setup/next-env.d.ts \
   eduflow-setup/.gitignore \
   eduflow/

cp -r eduflow-setup/pages eduflow/
cp -r eduflow-setup/public eduflow/
cp -r eduflow-setup/styles eduflow/

# Remove diretório temporário
rm -rf eduflow-setup

cd C:/Users/Ygor/eduflow
npm install
```

- [ ] **Step 2: Instalar dependências**

```bash
npm install @stripe/stripe-js @stripe/react-stripe-js stripe firebase firebase-admin @supabase/supabase-js
npm install -D jest @types/jest ts-jest @testing-library/react @testing-library/jest-dom jest-environment-jsdom
```

- [ ] **Step 3: Criar arquivo de variáveis de ambiente**

Crie `.env.local.example` com o conteúdo:

```env
# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Firebase (client)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

# Firebase (admin — servidor)
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# ClickUp
CLICKUP_API_TOKEN=...
CLICKUP_LIST_ID=...

# Discord
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

- [ ] **Step 4: Configurar Jest**

Crie `jest.config.ts`:

```typescript
import type { Config } from 'jest'

const config: Config = {
  testEnvironment: 'node',
  transform: { '^.+\\.tsx?$': 'ts-jest' },
  testMatch: ['<rootDir>/tests/**/*.test.ts'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/$1' },
}

export default config
```

- [ ] **Step 5: Copiar `.env.local.example` para `.env.local` e preencher com dados reais**

```bash
cp .env.local.example .env.local
# Preencher manualmente com credenciais do Stripe test mode, Firebase, Supabase
```

- [ ] **Step 6: Commit**

```bash
git add package.json tsconfig.json jest.config.ts .env.local.example .gitignore
git commit -m "inicializa projeto Next.js com dependências"
```

---

## Task 2: Schema do Banco de Dados (Supabase)

**Files:**
- Create: `supabase/migrations/001_initial.sql`
- Create: `lib/supabase.ts`

- [ ] **Step 1: Criar arquivo de migração SQL**

Crie `supabase/migrations/001_initial.sql`:

```sql
create extension if not exists "uuid-ossp";

create table students (
  id         uuid primary key default uuid_generate_v4(),
  email      text not null unique,
  name       text not null,
  created_at timestamp default now()
);

create table enrollments (
  id          uuid primary key default uuid_generate_v4(),
  student_id  uuid references students(id) on delete cascade,
  course      text not null,
  status      text not null check (status in ('active','suspended','completed')),
  enrolled_at timestamp default now()
);

create table payments (
  id                uuid primary key default uuid_generate_v4(),
  student_id        uuid references students(id) on delete cascade,
  stripe_payment_id text not null unique,
  amount            numeric not null,
  status            text not null check (status in ('succeeded','failed','refunded')),
  paid_at           timestamp default now()
);

create table churn_alerts (
  id              uuid primary key default uuid_generate_v4(),
  student_id      uuid references students(id) on delete cascade,
  alerted_at      timestamp default now(),
  clickup_task_id text
);

create table error_logs (
  id         uuid primary key default uuid_generate_v4(),
  event      text,
  error      text,
  created_at timestamp default now()
);
```

- [ ] **Step 2: Executar a migração no Supabase**

No painel do Supabase (SQL Editor), cole e execute o conteúdo do arquivo acima.

- [ ] **Step 3: Criar cliente Supabase**

Crie `lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
```

- [ ] **Step 4: Commit**

```bash
git add supabase/ lib/supabase.ts
git commit -m "adiciona schema do banco e cliente Supabase"
```

---

## Task 3: Configuração do Firebase

**Files:**
- Create: `lib/firebase-client.ts`
- Create: `lib/firebase-admin.ts`

- [ ] **Step 1: Criar cliente Firebase (browser)**

Crie `lib/firebase-client.ts`:

```typescript
import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

export const auth = getAuth(app)
export const db = getFirestore(app)
```

- [ ] **Step 2: Criar cliente Firebase Admin (servidor)**

Crie `lib/firebase-admin.ts`:

```typescript
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'

if (getApps().length === 0) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  })
}

export const adminDb = getFirestore()
export const adminAuth = getAuth()
```

- [ ] **Step 3: Configurar Firebase Security Rules**

No painel do Firebase (Firestore → Rules), cole:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
    match /courses/{courseId}/progress/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add lib/firebase-client.ts lib/firebase-admin.ts
git commit -m "configura Firebase client e admin SDK"
```

---

## Task 4: Stripe Client

**Files:**
- Create: `lib/stripe.ts`

- [ ] **Step 1: Criar cliente Stripe (servidor)**

Crie `lib/stripe.ts`:

```typescript
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
})
```

- [ ] **Step 2: Commit**

```bash
git add lib/stripe.ts
git commit -m "adiciona cliente Stripe"
```

---

## Task 5: Webhook Handler (POST /api/webhooks/stripe)

**Files:**
- Create: `pages/api/webhooks/stripe.ts`
- Create: `tests/api/stripe-webhook.test.ts`

- [ ] **Step 1: Escrever o teste que falha**

Crie `tests/api/stripe-webhook.test.ts`:

```typescript
import { createMocks } from 'node-mocks-http'

// Mock das libs externas
jest.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn().mockReturnThis(),
    insert: jest.fn().mockResolvedValue({ error: null }),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: { id: 'student-uuid' }, error: null }),
  },
}))

jest.mock('@/lib/firebase-admin', () => ({
  adminDb: {
    collection: jest.fn().mockReturnThis(),
    doc: jest.fn().mockReturnThis(),
    set: jest.fn().mockResolvedValue(undefined),
  },
  adminAuth: {
    getUserByEmail: jest.fn().mockRejectedValue({ code: 'auth/user-not-found' }),
    createUser: jest.fn().mockResolvedValue({ uid: 'firebase-uid-123' }),
    generatePasswordResetLink: jest.fn().mockResolvedValue('https://reset.link/test'),
  },
}))

jest.mock('@/lib/stripe', () => ({
  stripe: {
    webhooks: {
      constructEvent: jest.fn(),
    },
  },
}))

import handler from '@/pages/api/webhooks/stripe'
import { stripe } from '@/lib/stripe'

describe('POST /api/webhooks/stripe', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true })
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('retorna 400 para assinatura inválida', async () => {
    ;(stripe.webhooks.constructEvent as jest.Mock).mockImplementationOnce(() => {
      throw new Error('Invalid signature')
    })

    const { req, res } = createMocks({ method: 'POST', body: '{}', headers: { 'stripe-signature': 'bad' } })
    await handler(req, res)
    expect(res._getStatusCode()).toBe(400)
  })

  it('retorna 200 e processa payment_intent.succeeded', async () => {
    ;(stripe.webhooks.constructEvent as jest.Mock).mockReturnValueOnce({
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_test_123',
          amount: 9900,
          metadata: { customer_name: 'João Silva', customer_email: 'joao@email.com', course: 'Curso A' },
        },
      },
    })

    const { req, res } = createMocks({ method: 'POST', body: '{}', headers: { 'stripe-signature': 'valid' } })
    await handler(req, res)
    expect(res._getStatusCode()).toBe(200)
  })
})
```

- [ ] **Step 2: Instalar dependência de teste**

```bash
npm install -D node-mocks-http
```

- [ ] **Step 3: Rodar o teste para confirmar que falha**

```bash
npx jest tests/api/stripe-webhook.test.ts --no-coverage
```

Esperado: FAIL com "Cannot find module '@/pages/api/webhooks/stripe'"

- [ ] **Step 4: Implementar o webhook handler**

Crie `pages/api/webhooks/stripe.ts`:

```typescript
import type { NextApiRequest, NextApiResponse } from 'next'
import { Readable } from 'stream'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase'
import { adminDb, adminAuth } from '@/lib/firebase-admin'

export const config = { api: { bodyParser: false } }

async function buffer(readable: Readable) {
  const chunks: Buffer[] = []
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  return Buffer.concat(chunks)
}

async function notifyDiscord(message: string) {
  if (!process.env.DISCORD_WEBHOOK_URL) return
  await fetch(process.env.DISCORD_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: message }),
  })
}

async function createClickUpTask(studentName: string) {
  const deadline = Date.now() + 24 * 60 * 60 * 1000
  const res = await fetch(`https://api.clickup.com/api/v2/list/${process.env.CLICKUP_LIST_ID}/task`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: process.env.CLICKUP_API_TOKEN!,
    },
    body: JSON.stringify({
      name: `Boas-vindas: ${studentName}`,
      due_date: deadline,
      priority: 2,
    }),
  })
  if (!res.ok) {
    await notifyDiscord(`⚠️ Falha ao criar task ClickUp para ${studentName}`)
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const sig = req.headers['stripe-signature'] as string
  const buf = await buffer(req as unknown as Readable)

  let event
  try {
    event = stripe.webhooks.constructEvent(buf.toString(), sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return res.status(400).json({ error: 'Assinatura inválida' })
  }

  if (event.type !== 'payment_intent.succeeded') {
    return res.status(200).json({ received: true })
  }

  const pi = event.data.object as {
    id: string
    amount: number
    metadata: { customer_name: string; customer_email: string; course: string }
  }
  const { customer_name, customer_email, course } = pi.metadata

  // Upsert student
  let studentId: string
  const { data: existing } = await supabaseAdmin
    .from('students')
    .select('id')
    .eq('email', customer_email)
    .single()

  if (existing) {
    studentId = existing.id
  } else {
    const { data: newStudent, error } = await supabaseAdmin
      .from('students')
      .insert({ email: customer_email, name: customer_name })
      .select('id')
      .single()
    if (error || !newStudent) {
      await notifyDiscord(`🔴 Erro ao criar student: ${error?.message}`)
      await supabaseAdmin.from('error_logs').insert({ event: event.type, error: error?.message })
      return res.status(500).json({ error: 'Erro interno' })
    }
    studentId = newStudent.id
  }

  // Enrollment
  await supabaseAdmin.from('enrollments').insert({ student_id: studentId, course, status: 'active' })

  // Payment
  await supabaseAdmin.from('payments').insert({
    student_id: studentId,
    stripe_payment_id: pi.id,
    amount: pi.amount / 100,
    status: 'succeeded',
  })

  // Firebase Auth — cria conta para o aluno se não existir
  let firebaseUid: string
  try {
    const existing = await adminAuth.getUserByEmail(customer_email).catch(() => null)
    if (existing) {
      firebaseUid = existing.uid
    } else {
      const newUser = await adminAuth.createUser({
        email: customer_email,
        displayName: customer_name,
      })
      firebaseUid = newUser.uid
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    await notifyDiscord(`🔴 Erro ao criar usuário Firebase: ${msg}`)
    await supabaseAdmin.from('error_logs').insert({ event: event.type, error: msg })
    return res.status(500).json({ error: 'Erro interno' })
  }

  // Firebase Firestore — acesso do aluno (doc keyed by UID)
  try {
    await adminDb.collection('users').doc(firebaseUid).set(
      {
        uid: firebaseUid,
        email: customer_email,
        name: customer_name,
        access_enabled: true,
        supabase_id: studentId,
      },
      { merge: true }
    )
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    await notifyDiscord(`🔴 Erro ao gravar Firebase: ${msg}`)
    await supabaseAdmin.from('error_logs').insert({ event: event.type, error: msg })
    return res.status(500).json({ error: 'Erro interno' })
  }

  // Envia link de primeiro acesso ao aluno (não bloqueia o fluxo)
  adminAuth.generatePasswordResetLink(customer_email)
    .then((link) => notifyDiscord(`✅ Novo aluno: ${customer_name} — link de acesso: ${link}`))
    .catch(() => {})

  // ClickUp task (não bloqueia o fluxo)
  createClickUpTask(customer_name).catch(() => {})

  return res.status(200).json({ received: true })
}
```

- [ ] **Step 5: Rodar o teste para confirmar que passa**

```bash
npx jest tests/api/stripe-webhook.test.ts --no-coverage
```

Esperado: PASS (2 testes)

- [ ] **Step 6: Commit**

```bash
git add pages/api/webhooks/stripe.ts tests/api/stripe-webhook.test.ts
git commit -m "implementa webhook handler Stripe com testes"
```

---

## Task 6: HOC de Autenticação

**Files:**
- Create: `middleware/withAuth.ts`

- [ ] **Step 1: Criar HOC para rotas protegidas**

Crie `middleware/withAuth.ts`:

```typescript
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase-client'
import type { NextPage } from 'next'

type Role = 'student' | 'admin'

export function withAuth(Component: NextPage, role: Role = 'student') {
  return function ProtectedPage() {
    const router = useRouter()

    useEffect(() => {
      const unsub = onAuthStateChanged(auth, async (user) => {
        if (!user) {
          router.replace('/login')
          return
        }
        const snap = await getDoc(doc(db, 'users', user.uid))
        const data = snap.data()

        if (!data?.access_enabled) {
          router.replace('/aguardando')
          return
        }
        if (role === 'admin' && data?.role !== 'admin') {
          router.replace('/portal')
        }
      })
      return unsub
    }, [router])

    return <Component />
  }
}
```

- [ ] **Step 2: Criar página de aguardando confirmação**

Crie `pages/aguardando.tsx`:

```tsx
export default function Aguardando() {
  return (
    <main style={{ textAlign: 'center', padding: '4rem' }}>
      <h1>Aguardando confirmação</h1>
      <p>Seu pagamento está sendo processado. Em breve você receberá acesso.</p>
    </main>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add middleware/withAuth.ts pages/aguardando.tsx
git commit -m "adiciona HOC de autenticação e página de aguardando"
```

---

## Task 7: Formulário de Checkout (Stripe Elements)

**Files:**
- Create: `components/checkout/CheckoutForm.tsx`
- Create: `pages/index.tsx`
- Create: `pages/api/create-payment-intent.ts`

- [ ] **Step 1: Criar API route para criar PaymentIntent**

Crie `pages/api/create-payment-intent.ts`:

```typescript
import type { NextApiRequest, NextApiResponse } from 'next'
import { stripe } from '@/lib/stripe'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { name, email, course, amount } = req.body as {
    name: string; email: string; course: string; amount: number
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency: 'brl',
    metadata: { customer_name: name, customer_email: email, course },
  })

  res.json({ clientSecret: paymentIntent.client_secret })
}
```

- [ ] **Step 2: Criar componente do formulário**

Crie `components/checkout/CheckoutForm.tsx`:

```tsx
import { useState, FormEvent } from 'react'
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'

interface Props {
  onSuccess: () => void
}

export function CheckoutForm({ onSuccess }: Props) {
  const stripe = useStripe()
  const elements = useElements()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return

    setLoading(true)
    setError(null)

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/portal` },
      redirect: 'if_required',
    })

    if (stripeError) {
      setError(stripeError.message ?? 'Erro ao processar pagamento')
      setLoading(false)
      return
    }

    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 480, margin: '0 auto' }}>
      <PaymentElement />
      {error && (
        <p role="alert" style={{ color: '#dc2626', marginTop: 8, fontSize: 14 }}>
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={loading || !stripe}
        style={{ marginTop: 16, width: '100%', padding: '12px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
      >
        {loading ? 'Processando...' : 'Finalizar compra'}
      </button>
    </form>
  )
}
```

- [ ] **Step 3: Criar página de checkout**

Crie `pages/index.tsx`:

```tsx
import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'
import { CheckoutForm } from '@/components/checkout/CheckoutForm'
import { useRouter } from 'next/router'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

const COURSE = { name: 'Mentoria EduFlow Pro', price: 49700, slug: 'mentoria-eduflow' }

export default function Home() {
  const router = useRouter()
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', email: '' })
  const [step, setStep] = useState<'form' | 'payment'>('form')

  async function handleContinue() {
    const res = await fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.name, email: form.email, course: COURSE.slug, amount: COURSE.price }),
    })
    const { clientSecret } = await res.json()
    setClientSecret(clientSecret)
    setStep('payment')
  }

  return (
    <main style={{ maxWidth: 560, margin: '4rem auto', padding: '0 1rem' }}>
      <h1 style={{ marginBottom: 8 }}>{COURSE.name}</h1>
      <p style={{ marginBottom: 24, color: '#6b7280' }}>
        R$ {(COURSE.price / 100).toFixed(2).replace('.', ',')}
      </p>

      {step === 'form' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            placeholder="Seu nome"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            style={{ padding: 10, border: '1px solid #d1d5db', borderRadius: 6 }}
          />
          <input
            type="email"
            placeholder="Seu email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            style={{ padding: 10, border: '1px solid #d1d5db', borderRadius: 6 }}
          />
          <button
            onClick={handleContinue}
            disabled={!form.name || !form.email}
            style={{ padding: 12, background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
          >
            Continuar para pagamento
          </button>
        </div>
      )}

      {step === 'payment' && clientSecret && (
        <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
          <CheckoutForm onSuccess={() => router.push('/portal')} />
        </Elements>
      )}
    </main>
  )
}
```

- [ ] **Step 4: Testar o checkout localmente com Stripe CLI**

```bash
# Terminal 1 — servidor Next.js
npm run dev

# Terminal 2 — Stripe CLI (escuta webhooks)
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Terminal 3 — simular pagamento com metadata obrigatório
stripe trigger payment_intent.succeeded \
  --override "payment_intent:metadata.customer_name=João Silva" \
  --override "payment_intent:metadata.customer_email=joao@email.com" \
  --override "payment_intent:metadata.course=mentoria-eduflow"
```

Esperado: log "Webhook recebido" no terminal 2, nenhum erro no terminal 1.

- [ ] **Step 5: Commit**

```bash
git add pages/index.tsx pages/api/create-payment-intent.ts components/checkout/
git commit -m "adiciona checkout com Stripe Elements"
```

---

## Task 8: Login e Portal do Aluno

**Files:**
- Create: `pages/login.tsx`
- Create: `components/portal/CourseProgress.tsx`
- Create: `pages/portal.tsx`

- [ ] **Step 1: Criar página de login**

Crie `pages/login.tsx`:

```tsx
import { useState, FormEvent } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/lib/firebase-client'
import { useRouter } from 'next/router'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await signInWithEmailAndPassword(auth, email, password)
      router.push('/portal')
    } catch {
      setError('Email ou senha incorretos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{ maxWidth: 400, margin: '4rem auto', padding: '0 1rem' }}>
      <h1 style={{ marginBottom: 24 }}>Entrar</h1>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ padding: 10, border: '1px solid #d1d5db', borderRadius: 6 }}
        />
        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ padding: 10, border: '1px solid #d1d5db', borderRadius: 6 }}
        />
        {error && <p role="alert" style={{ color: '#dc2626', fontSize: 14 }}>{error}</p>}
        <button
          type="submit"
          disabled={loading}
          style={{ padding: 12, background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </main>
  )
}
```

- [ ] **Step 2: Criar componente de progresso**

Crie `components/portal/CourseProgress.tsx`:

```tsx
import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase-client'

interface Progress {
  progress_pct: number
  completed_lessons: string[]
  last_accessed: { toDate: () => Date } | null
}

export function CourseProgress({ uid, courseId }: { uid: string; courseId: string }) {
  const [progress, setProgress] = useState<Progress | null>(null)

  useEffect(() => {
    const ref = doc(db, 'courses', courseId, 'progress', uid)
    return onSnapshot(ref, (snap) => {
      if (snap.exists()) setProgress(snap.data() as Progress)
    })
  }, [uid, courseId])

  if (!progress) return <p style={{ color: '#6b7280' }}>Nenhum progresso registrado ainda.</p>

  return (
    <div>
      <div style={{ background: '#f3f4f6', borderRadius: 8, overflow: 'hidden', height: 12 }}>
        <div style={{ background: '#2563eb', height: '100%', width: `${progress.progress_pct}%`, transition: 'width 0.3s' }} />
      </div>
      <p style={{ marginTop: 8, fontSize: 14, color: '#6b7280' }}>
        {progress.progress_pct}% concluído · {progress.completed_lessons.length} aulas
      </p>
    </div>
  )
}
```

- [ ] **Step 3: Criar portal do aluno**

Crie `pages/portal.tsx`:

```tsx
import { useEffect, useState } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase-client'
import { CourseProgress } from '@/components/portal/CourseProgress'
import { withAuth } from '@/middleware/withAuth'
import type { User } from 'firebase/auth'

function PortalPage() {
  const [user, setUser] = useState<User | null>(null)
  const [studentName, setStudentName] = useState('')

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      if (!u) return
      setUser(u)
      // Atualiza last_login
      await updateDoc(doc(db, 'users', u.uid), { last_login: serverTimestamp() })
      const unsub = onSnapshot(doc(db, 'users', u.uid), (snap) => {
        setStudentName(snap.data()?.name ?? '')
      })
      return unsub
    })
  }, [])

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '2rem 1rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <h1>Olá, {studentName || 'aluno'} 👋</h1>
        <button onClick={() => signOut(auth)} style={{ padding: '6px 16px', border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer' }}>
          Sair
        </button>
      </header>

      <section>
        <h2 style={{ marginBottom: 12 }}>Mentoria EduFlow Pro</h2>
        {user && <CourseProgress uid={user.uid} courseId="mentoria-eduflow" />}
      </section>
    </main>
  )
}

export default withAuth(PortalPage, 'student')
```

- [ ] **Step 4: Commit**

```bash
git add pages/login.tsx pages/portal.tsx components/portal/
git commit -m "adiciona login, portal do aluno e progresso em tempo real"
```

---

## Task 9: Dashboard Admin

**Files:**
- Create: `pages/api/admin/students.ts`
- Create: `components/admin/StudentTable.tsx`
- Create: `components/admin/RevenueChart.tsx`
- Create: `pages/admin.tsx`

- [ ] **Step 1: Criar API de listagem de alunos**

Crie `pages/api/admin/students.ts`:

```typescript
import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '@/lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()

  const { data, error } = await supabaseAdmin
    .from('students')
    .select(`
      id, name, email, created_at,
      enrollments ( course, status ),
      payments ( amount, status, paid_at )
    `)
    .order('created_at', { ascending: false })

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
}
```

- [ ] **Step 2: Criar tabela de alunos**

Crie `components/admin/StudentTable.tsx`:

```tsx
interface Student {
  id: string
  name: string
  email: string
  created_at: string
  enrollments: { course: string; status: string }[]
  payments: { amount: number; status: string }[]
}

export function StudentTable({ students }: { students: Student[] }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #e5e7eb', textAlign: 'left' }}>
            <th style={{ padding: '8px 12px' }}>Nome</th>
            <th style={{ padding: '8px 12px' }}>Email</th>
            <th style={{ padding: '8px 12px' }}>Curso</th>
            <th style={{ padding: '8px 12px' }}>Status</th>
            <th style={{ padding: '8px 12px' }}>Valor pago</th>
          </tr>
        </thead>
        <tbody>
          {students.map((s) => (
            <tr key={s.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
              <td style={{ padding: '8px 12px' }}>{s.name}</td>
              <td style={{ padding: '8px 12px', color: '#6b7280' }}>{s.email}</td>
              <td style={{ padding: '8px 12px' }}>{s.enrollments[0]?.course ?? '—'}</td>
              <td style={{ padding: '8px 12px' }}>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: 20,
                  fontSize: 12,
                  background: s.enrollments[0]?.status === 'active' ? '#dcfce7' : '#fee2e2',
                  color: s.enrollments[0]?.status === 'active' ? '#16a34a' : '#dc2626',
                }}>
                  {s.enrollments[0]?.status ?? '—'}
                </span>
              </td>
              <td style={{ padding: '8px 12px' }}>
                {s.payments[0]
                  ? `R$ ${s.payments[0].amount.toFixed(2).replace('.', ',')}`
                  : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 3: Criar gráfico de faturamento**

Crie `components/admin/RevenueChart.tsx`:

```tsx
interface Payment { amount: number; paid_at: string }

export function RevenueChart({ payments }: { payments: Payment[] }) {
  const byMonth = payments.reduce<Record<string, number>>((acc, p) => {
    const month = new Date(p.paid_at).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
    acc[month] = (acc[month] ?? 0) + p.amount
    return acc
  }, {})

  const entries = Object.entries(byMonth).slice(-6)
  const max = Math.max(...entries.map(([, v]) => v), 1)

  return (
    <div>
      <h3 style={{ marginBottom: 16 }}>Faturamento mensal</h3>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 120 }}>
        {entries.map(([month, value]) => (
          <div key={month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 11, color: '#6b7280' }}>
              R${value.toFixed(0)}
            </span>
            <div style={{
              width: '100%',
              height: `${(value / max) * 80}px`,
              background: '#2563eb',
              borderRadius: '4px 4px 0 0',
              minHeight: 4,
            }} />
            <span style={{ fontSize: 11, color: '#9ca3af' }}>{month}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Criar página admin**

Crie `pages/admin.tsx`:

```tsx
import { useEffect, useState } from 'react'
import { StudentTable } from '@/components/admin/StudentTable'
import { RevenueChart } from '@/components/admin/RevenueChart'
import { withAuth } from '@/middleware/withAuth'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase-client'

interface Student {
  id: string; name: string; email: string; created_at: string
  enrollments: { course: string; status: string }[]
  payments: { amount: number; status: string; paid_at: string }[]
}

function AdminPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/students')
      .then((r) => r.json())
      .then((data) => { setStudents(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const allPayments = students.flatMap((s) => s.payments.filter((p) => p.status === 'succeeded'))
  const totalRevenue = allPayments.reduce((acc, p) => acc + p.amount, 0)

  return (
    <main style={{ maxWidth: 960, margin: '0 auto', padding: '2rem 1rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <h1>Dashboard Admin</h1>
        <button onClick={() => signOut(auth)} style={{ padding: '6px 16px', border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer' }}>
          Sair
        </button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        <div style={{ padding: 20, background: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb' }}>
          <p style={{ fontSize: 13, color: '#6b7280' }}>Total de alunos</p>
          <p style={{ fontSize: 28, fontWeight: 700 }}>{students.length}</p>
        </div>
        <div style={{ padding: 20, background: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb' }}>
          <p style={{ fontSize: 13, color: '#6b7280' }}>Faturamento total</p>
          <p style={{ fontSize: 28, fontWeight: 700 }}>R$ {totalRevenue.toFixed(2).replace('.', ',')}</p>
        </div>
      </div>

      <div style={{ marginBottom: 32 }}>
        <RevenueChart payments={allPayments} />
      </div>

      {loading ? (
        <p style={{ color: '#6b7280' }}>Carregando alunos...</p>
      ) : (
        <StudentTable students={students} />
      )}
    </main>
  )
}

export default withAuth(AdminPage, 'admin')
```

- [ ] **Step 5: Commit**

```bash
git add pages/admin.tsx pages/api/admin/ components/admin/
git commit -m "adiciona dashboard admin com tabela de alunos e gráfico"
```

---

## Task 10: Responsividade Mobile

**Files:**
- Create: `styles/globals.css`
- Modify: `pages/_app.tsx`

- [ ] **Step 1: Adicionar estilos globais responsivos**

Crie `styles/globals.css`:

```css
*, *::before, *::after { box-sizing: border-box; }
body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }

@media (max-width: 640px) {
  main { padding: 1rem !important; }
  h1 { font-size: 1.5rem !important; }
  table { font-size: 12px !important; }
  th, td { padding: 6px 8px !important; }
}
```

- [ ] **Step 2: Importar no `_app.tsx`**

Edite `pages/_app.tsx`:

```tsx
import '@/styles/globals.css'
import type { AppProps } from 'next/app'

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />
}
```

- [ ] **Step 3: Commit**

```bash
git add styles/globals.css pages/_app.tsx
git commit -m "adiciona estilos globais e responsividade mobile"
```

---

## Task 11: Script Python de Churn

**Files:**
- Create: `scripts/churn_alert.py`
- Create: `tests/python/test_churn_alert.py`
- Create: `scripts/requirements.txt`

- [ ] **Step 1: Escrever o teste que falha**

Crie `tests/python/test_churn_alert.py`:

```python
import pytest
from unittest.mock import patch, MagicMock
from datetime import datetime, timedelta, timezone

# Patch das dependências antes de importar
@pytest.fixture(autouse=True)
def mock_env(monkeypatch):
    monkeypatch.setenv("FIREBASE_PROJECT_ID", "test-project")
    monkeypatch.setenv("FIREBASE_CLIENT_EMAIL", "test@test.com")
    monkeypatch.setenv("FIREBASE_PRIVATE_KEY", "fake-key")
    monkeypatch.setenv("CLICKUP_API_TOKEN", "test-token")
    monkeypatch.setenv("CLICKUP_LIST_ID", "test-list")
    monkeypatch.setenv("SUPABASE_URL", "https://test.supabase.co")
    monkeypatch.setenv("SUPABASE_SERVICE_ROLE_KEY", "test-key")

def make_user_doc(days_ago: int, access_enabled: bool = True):
    last_login = datetime.now(timezone.utc) - timedelta(days=days_ago)
    mock = MagicMock()
    mock.id = "test@email.com"
    mock.to_dict.return_value = {
        "name": "Aluno Teste",
        "email": "test@email.com",
        "access_enabled": access_enabled,
        "last_login": last_login,
    }
    return mock

def test_detects_inactive_users():
    with patch("scripts.churn_alert.db") as mock_db, \
         patch("scripts.churn_alert.create_clickup_task") as mock_task, \
         patch("scripts.churn_alert.log_to_supabase"):

        mock_db.collection.return_value.stream.return_value = [
            make_user_doc(days_ago=8),   # inativo — deve alertar
            make_user_doc(days_ago=3),   # ativo — não deve alertar
            make_user_doc(days_ago=10, access_enabled=False),  # desabilitado — não deve alertar
        ]

        from scripts.churn_alert import run
        run()

        assert mock_task.call_count == 1
        mock_task.assert_called_once_with("Aluno Teste", "test@email.com")

def test_skips_recently_active_users():
    with patch("scripts.churn_alert.db") as mock_db, \
         patch("scripts.churn_alert.create_clickup_task") as mock_task, \
         patch("scripts.churn_alert.log_to_supabase"):

        mock_db.collection.return_value.stream.return_value = [
            make_user_doc(days_ago=2),
            make_user_doc(days_ago=6),
        ]

        from scripts.churn_alert import run
        run()

        mock_task.assert_not_called()
```

- [ ] **Step 2: Criar arquivos `__init__.py` para que Python trate as pastas como pacotes**

```bash
touch scripts/__init__.py tests/__init__.py tests/python/__init__.py
```

- [ ] **Step 3: Rodar para confirmar que falha**

```bash
cd C:/Users/Ygor/eduflow
python -m pytest tests/python/test_churn_alert.py -v
```

Esperado: FAIL com "ModuleNotFoundError"

- [ ] **Step 4: Criar requirements.txt**

Crie `scripts/requirements.txt`:

```
firebase-admin==6.5.0
supabase==2.4.6
requests==2.31.0
python-dotenv==1.0.1
pytest==8.1.1
```

- [ ] **Step 5: Instalar dependências Python**

```bash
pip install -r scripts/requirements.txt
```

- [ ] **Step 6: Implementar o script**

Crie `scripts/churn_alert.py`:

```python
import os
from datetime import datetime, timedelta, timezone
import firebase_admin
from firebase_admin import credentials, firestore
from supabase import create_client
import requests

# Inicialização Firebase
cred = credentials.Certificate({
    "type": "service_account",
    "project_id": os.environ["FIREBASE_PROJECT_ID"],
    "client_email": os.environ["FIREBASE_CLIENT_EMAIL"],
    "private_key": os.environ["FIREBASE_PRIVATE_KEY"].replace("\\n", "\n"),
    "token_uri": "https://oauth2.googleapis.com/token",
})
if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)

db = firestore.client()

supabase = create_client(
    os.environ["SUPABASE_URL"],
    os.environ["SUPABASE_SERVICE_ROLE_KEY"],
)

INACTIVITY_DAYS = 7


def create_clickup_task(student_name: str, student_email: str) -> str | None:
    res = requests.post(
        f"https://api.clickup.com/api/v2/list/{os.environ['CLICKUP_LIST_ID']}/task",
        headers={"Authorization": os.environ["CLICKUP_API_TOKEN"], "Content-Type": "application/json"},
        json={
            "name": f"Retenção urgente: {student_name}",
            "description": f"Aluno {student_email} inativo há mais de {INACTIVITY_DAYS} dias.",
            "priority": 1,
        },
        timeout=10,
    )
    if res.ok:
        return res.json().get("id")
    return None


def log_to_supabase(student_email: str, clickup_task_id: str | None) -> None:
    supabase.table("churn_alerts").insert({
        "clickup_task_id": clickup_task_id,
    }).execute()


def run() -> None:
    cutoff = datetime.now(timezone.utc) - timedelta(days=INACTIVITY_DAYS)
    users = db.collection("users").stream()

    for user_doc in users:
        data = user_doc.to_dict()
        if not data.get("access_enabled"):
            continue
        last_login = data.get("last_login")
        if last_login is None or last_login > cutoff:
            continue

        print(f"Aluno inativo: {data['email']}")
        task_id = create_clickup_task(data["name"], data["email"])
        log_to_supabase(data["email"], task_id)


if __name__ == "__main__":
    run()
    print("Script de churn concluído.")
```

- [ ] **Step 7: Rodar testes para confirmar que passam**

```bash
python -m pytest tests/python/test_churn_alert.py -v
```

Esperado: PASS (2 testes)

- [ ] **Step 8: Commit**

```bash
git add scripts/churn_alert.py scripts/requirements.txt tests/python/ scripts/__init__.py tests/__init__.py tests/python/__init__.py
git commit -m "adiciona script de churn com testes"
```

---

## Task 12: GitHub Actions (CI + Cron)

**Files:**
- Create: `.github/workflows/ci.yml`
- Create: `.github/workflows/churn.yml`

- [ ] **Step 1: Criar workflow de CI**

Crie `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npx jest --no-coverage

  test-python:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - run: pip install -r scripts/requirements.txt
      - run: python -m pytest tests/python/ -v
```

- [ ] **Step 2: Criar workflow de cron de churn**

Crie `.github/workflows/churn.yml`:

```yaml
name: Churn Alert

on:
  schedule:
    - cron: '0 9 * * *'   # Diariamente às 9h UTC
  workflow_dispatch:        # Permite rodar manualmente

jobs:
  churn:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - run: pip install -r scripts/requirements.txt
      - run: python scripts/churn_alert.py
        env:
          FIREBASE_PROJECT_ID: ${{ secrets.FIREBASE_PROJECT_ID }}
          FIREBASE_CLIENT_EMAIL: ${{ secrets.FIREBASE_CLIENT_EMAIL }}
          FIREBASE_PRIVATE_KEY: ${{ secrets.FIREBASE_PRIVATE_KEY }}
          CLICKUP_API_TOKEN: ${{ secrets.CLICKUP_API_TOKEN }}
          CLICKUP_LIST_ID: ${{ secrets.CLICKUP_LIST_ID }}
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
```

- [ ] **Step 3: Configurar secrets no GitHub**

No repositório GitHub → Settings → Secrets and variables → Actions, adicionar cada variável do `.env.local.example` (exceto as `NEXT_PUBLIC_*` que não são secretas).

- [ ] **Step 4: Commit**

```bash
git add .github/
git commit -m "adiciona workflows de CI e cron de churn"
```

---

## Task 13: Deploy no Vercel

**Files:**
- Create: `vercel.json`

- [ ] **Step 1: Criar configuração do Vercel**

Crie `vercel.json`:

```json
{
  "buildCommand": "next build",
  "outputDirectory": ".next"
}
```

- [ ] **Step 2: Fazer deploy via Vercel CLI**

```bash
npx vercel --prod
```

Seguir o prompt: selecionar projeto, confirmar configurações.

- [ ] **Step 3: Configurar variáveis de ambiente no Vercel**

No painel Vercel → Settings → Environment Variables, adicionar todas as variáveis do `.env.local.example`.

- [ ] **Step 4: Testar o deploy**

Abrir a URL gerada pelo Vercel e verificar:
- Página de checkout carrega
- Login funciona
- Portal redireciona corretamente após login

- [ ] **Step 5: Commit final**

```bash
git add vercel.json
git commit -m "adiciona configuração de deploy Vercel"
```

---

## Checklist de Cobertura do Spec

| Requisito do Spec | Task |
|---|---|
| Checkout React + Stripe test mode | Task 7 |
| API Node.js como Vercel Serverless | Task 5 |
| Supabase (PostgreSQL) — 5 tabelas | Task 2 |
| Firebase Firestore + Auth | Task 3, 8 |
| Webhook handler com assinatura | Task 5 |
| ClickUp API (task de boas-vindas) | Task 5 |
| Portal do aluno responsivo | Task 8, 10 |
| Dashboard admin responsivo | Task 9, 10 |
| Script Python de churn | Task 11 |
| GitHub Actions CI + cron | Task 12 |
| Alertas Discord em erros | Task 5 |
| Firebase Security Rules | Task 3 |
| Deploy Vercel | Task 13 |
| Env vars nunca no código | Task 1 |
