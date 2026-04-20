# EduFlow Pro — Visual Redesign & Course Content Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign todas as páginas do EduFlow Pro com a paleta dark/premium do thedream.com.br, adicionar módulos/aulas genéricos com rastreamento de progresso, e customizar o email de boas-vindas em português.

**Architecture:** Paleta de cores extraída em CSS variables no globals.css; conteúdo do curso definido estaticamente em `lib/course-content.ts`; progresso salvo no Firestore usando `arrayUnion/arrayRemove` em `courses/{courseId}/progress/{uid}.completed_lessons`.

**Tech Stack:** Next.js 14 (Pages Router), Firebase Firestore, TypeScript, CSS-in-JS inline styles com variáveis CSS globais, Google Fonts (Roboto)

---

## Paleta de Referência

```
--ef-bg-deep:    #21002E   (fundo mais escuro)
--ef-bg-main:    #2E0041   (fundo principal)
--ef-bg-card:    #530074   (cards/seções)
--ef-gold:       #FEE571   (CTA / destaque principal)
--ef-gold-dark:  #CF8B30   (acento secundário)
--ef-green:      #0FCA29   (sucesso / progresso)
--ef-white:      #FFFFFF   (texto principal)
--ef-muted:      rgba(255,255,255,0.55)  (texto secundário)
--ef-border:     rgba(255,255,255,0.12)  (bordas sutis)
```

---

## File Map

| Arquivo | Ação |
|---------|------|
| `pages/_document.tsx` | Modificar — adicionar Roboto do Google Fonts |
| `styles/globals.css` | Modificar — adicionar CSS variables + reset dark |
| `lib/course-content.ts` | Criar — definição estática dos módulos e aulas |
| `components/portal/CourseProgress.tsx` | Modificar — redesign completo com módulos/aulas |
| `pages/index.tsx` | Modificar — redesign landing/checkout dark |
| `components/checkout/CheckoutForm.tsx` | Modificar — redesign dark |
| `pages/login.tsx` | Modificar — redesign dark |
| `pages/portal.tsx` | Modificar — redesign dark |
| `pages/aguardando.tsx` | Modificar — redesign dark |
| `pages/admin.tsx` | Modificar — redesign dark |
| `components/admin/StudentTable.tsx` | Modificar — redesign dark |
| `components/admin/RevenueChart.tsx` | Modificar — redesign dark |
| `tests/course-content.test.ts` | Criar — testes da lógica de progresso |

---

## Task 1: Global styles + Roboto + CSS variables

**Files:**
- Modify: `pages/_document.tsx`
- Modify: `styles/globals.css`

- [ ] **Step 1: Adicionar Roboto ao `_document.tsx`**

```tsx
// pages/_document.tsx
import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="pt-BR">
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;600;700&family=Roboto+Slab:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
```

- [ ] **Step 2: Substituir `styles/globals.css` completo**

```css
/* styles/globals.css */
:root {
  --ef-bg-deep:   #21002E;
  --ef-bg-main:   #2E0041;
  --ef-bg-card:   #530074;
  --ef-gold:      #FEE571;
  --ef-gold-dark: #CF8B30;
  --ef-green:     #0FCA29;
  --ef-white:     #FFFFFF;
  --ef-muted:     rgba(255, 255, 255, 0.55);
  --ef-border:    rgba(255, 255, 255, 0.12);
}

*, *::before, *::after { box-sizing: border-box; }

body {
  margin: 0;
  font-family: 'Roboto', -apple-system, BlinkMacSystemFont, sans-serif;
  background: var(--ef-bg-main);
  color: var(--ef-white);
  -webkit-font-smoothing: antialiased;
}

@media (max-width: 640px) {
  main { padding: 1rem !important; }
  h1   { font-size: 1.5rem !important; }
  table { font-size: 12px !important; }
  th, td { padding: 6px 8px !important; }
}
```

- [ ] **Step 3: Commit**

```bash
git add pages/_document.tsx styles/globals.css
git commit -m "adiciona paleta dark e Roboto"
```

---

## Task 2: Conteúdo estático do curso + testes

**Files:**
- Create: `lib/course-content.ts`
- Create: `tests/course-content.test.ts`

- [ ] **Step 1: Criar `lib/course-content.ts`**

```ts
// lib/course-content.ts
export interface Lesson {
  id: string
  title: string
}

export interface Module {
  id: string
  title: string
  lessons: Lesson[]
}

export const COURSE_MODULES: Module[] = [
  {
    id: 'modulo-1',
    title: 'Módulo 1 — Fundamentos',
    lessons: [
      { id: 'mod1-aula1', title: 'Aula 1 — Introdução ao programa' },
      { id: 'mod1-aula2', title: 'Aula 2 — Mentalidade de crescimento' },
      { id: 'mod1-aula3', title: 'Aula 3 — Definindo seus objetivos' },
    ],
  },
  {
    id: 'modulo-2',
    title: 'Módulo 2 — Estratégia e Planejamento',
    lessons: [
      { id: 'mod2-aula1', title: 'Aula 1 — Mapeando o caminho' },
      { id: 'mod2-aula2', title: 'Aula 2 — Gestão de tempo e prioridades' },
      { id: 'mod2-aula3', title: 'Aula 3 — Criando seu plano de ação' },
      { id: 'mod2-aula4', title: 'Aula 4 — Ferramentas essenciais' },
    ],
  },
  {
    id: 'modulo-3',
    title: 'Módulo 3 — Execução',
    lessons: [
      { id: 'mod3-aula1', title: 'Aula 1 — Da teoria à prática' },
      { id: 'mod3-aula2', title: 'Aula 2 — Superando obstáculos' },
      { id: 'mod3-aula3', title: 'Aula 3 — Consistência e disciplina' },
    ],
  },
  {
    id: 'modulo-4',
    title: 'Módulo 4 — Análise e Resultados',
    lessons: [
      { id: 'mod4-aula1', title: 'Aula 1 — Métricas que importam' },
      { id: 'mod4-aula2', title: 'Aula 2 — Análise de desempenho' },
      { id: 'mod4-aula3', title: 'Aula 3 — Ajustes e otimização' },
      { id: 'mod4-aula4', title: 'Aula 4 — Celebrando conquistas' },
    ],
  },
  {
    id: 'modulo-5',
    title: 'Módulo 5 — Próximos Passos',
    lessons: [
      { id: 'mod5-aula1', title: 'Aula 1 — Escalando seus resultados' },
      { id: 'mod5-aula2', title: 'Aula 2 — Construindo sua rede' },
      { id: 'mod5-aula3', title: 'Aula 3 — Visão de longo prazo' },
    ],
  },
]

export const ALL_LESSON_IDS = COURSE_MODULES.flatMap((m) => m.lessons.map((l) => l.id))
export const TOTAL_LESSONS = ALL_LESSON_IDS.length // 17

export function calcProgressPct(completedLessons: string[]): number {
  if (TOTAL_LESSONS === 0) return 0
  return Math.round((completedLessons.length / TOTAL_LESSONS) * 100)
}
```

- [ ] **Step 2: Escrever o teste (deve falhar sem o arquivo acima)**

```ts
// tests/course-content.test.ts
import { COURSE_MODULES, ALL_LESSON_IDS, TOTAL_LESSONS, calcProgressPct } from '@/lib/course-content'

describe('course-content', () => {
  it('tem 5 módulos', () => {
    expect(COURSE_MODULES).toHaveLength(5)
  })

  it('tem 17 aulas no total', () => {
    expect(TOTAL_LESSONS).toBe(17)
  })

  it('todos os IDs de aula são únicos', () => {
    const ids = new Set(ALL_LESSON_IDS)
    expect(ids.size).toBe(ALL_LESSON_IDS.length)
  })

  it('calcProgressPct retorna 0 sem aulas concluídas', () => {
    expect(calcProgressPct([])).toBe(0)
  })

  it('calcProgressPct retorna 100 com todas as aulas', () => {
    expect(calcProgressPct(ALL_LESSON_IDS)).toBe(100)
  })

  it('calcProgressPct retorna valor proporcional', () => {
    // 1 de 17 ≈ 6%
    expect(calcProgressPct(['mod1-aula1'])).toBe(6)
  })
})
```

- [ ] **Step 3: Rodar os testes (devem passar)**

```bash
npx jest tests/course-content.test.ts --no-coverage
```

Esperado: `5 passed`

- [ ] **Step 4: Commit**

```bash
git add lib/course-content.ts tests/course-content.test.ts
git commit -m "adiciona conteúdo do curso e testes de progresso"
```

---

## Task 3: Redesign do CourseProgress com módulos e aulas

**Files:**
- Modify: `components/portal/CourseProgress.tsx`

- [ ] **Step 1: Substituir `components/portal/CourseProgress.tsx` completo**

```tsx
// components/portal/CourseProgress.tsx
import { useEffect, useState } from 'react'
import { doc, onSnapshot, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore'
import { db } from '@/lib/firebase-client'
import { COURSE_MODULES, calcProgressPct } from '@/lib/course-content'

interface Progress {
  completed_lessons: string[]
}

const S = {
  bar: { background: 'var(--ef-border)', borderRadius: 8, height: 8, overflow: 'hidden', marginBottom: 8 } as const,
  fill: (pct: number) => ({ background: 'var(--ef-green)', height: '100%', width: `${pct}%`, transition: 'width 0.4s' } as const),
  pct: { fontSize: 13, color: 'var(--ef-muted)', marginBottom: 32 } as const,
  module: { marginBottom: 24 } as const,
  moduleTitle: { fontSize: 15, fontWeight: 600, color: 'var(--ef-gold)', marginBottom: 10 } as const,
  lesson: (done: boolean) => ({
    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
    borderRadius: 8, marginBottom: 6, cursor: 'pointer',
    background: done ? 'rgba(15,202,41,0.12)' : 'rgba(255,255,255,0.05)',
    border: `1px solid ${done ? 'rgba(15,202,41,0.3)' : 'var(--ef-border)'}`,
    transition: 'background 0.2s',
  } as const),
  check: (done: boolean) => ({
    width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
    background: done ? 'var(--ef-green)' : 'transparent',
    border: `2px solid ${done ? 'var(--ef-green)' : 'var(--ef-border)'}`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 11, color: '#fff', fontWeight: 700,
  } as const),
  lessonTitle: (done: boolean) => ({
    fontSize: 14, color: done ? 'var(--ef-muted)' : 'var(--ef-white)',
    textDecoration: done ? 'line-through' : 'none',
  } as const),
  empty: { color: 'var(--ef-muted)', fontSize: 14 } as const,
}

export function CourseProgress({ uid, courseId }: { uid: string; courseId: string }) {
  const [completed, setCompleted] = useState<string[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const ref = doc(db, 'courses', courseId, 'progress', uid)
    return onSnapshot(ref, (snap) => {
      setCompleted(snap.exists() ? (snap.data()?.completed_lessons ?? []) : [])
      setLoaded(true)
    }, console.error)
  }, [uid, courseId])

  async function toggle(lessonId: string) {
    const ref = doc(db, 'courses', courseId, 'progress', uid)
    const done = completed.includes(lessonId)
    await updateDoc(ref, {
      completed_lessons: done ? arrayRemove(lessonId) : arrayUnion(lessonId),
    }).catch(async () => {
      // doc pode não existir ainda — cria
      const { setDoc } = await import('firebase/firestore')
      await setDoc(ref, { completed_lessons: [lessonId] }, { merge: true })
    })
  }

  if (!loaded) return <p style={S.empty}>Carregando...</p>

  const pct = calcProgressPct(completed)

  return (
    <div>
      <div style={S.bar}><div style={S.fill(pct)} /></div>
      <p style={S.pct}>{pct}% concluído · {completed.length}/17 aulas</p>

      {COURSE_MODULES.map((mod) => (
        <div key={mod.id} style={S.module}>
          <p style={S.moduleTitle}>{mod.title}</p>
          {mod.lessons.map((lesson) => {
            const done = completed.includes(lesson.id)
            return (
              <div key={lesson.id} style={S.lesson(done)} onClick={() => toggle(lesson.id)} role="button" tabIndex={0}>
                <div style={S.check(done)}>{done ? '✓' : ''}</div>
                <span style={S.lessonTitle(done)}>{lesson.title}</span>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/portal/CourseProgress.tsx
git commit -m "redesign CourseProgress com módulos e progresso por aula"
```

---

## Task 4: Redesign da landing/checkout (index + CheckoutForm)

**Files:**
- Modify: `pages/index.tsx`
- Modify: `components/checkout/CheckoutForm.tsx`

- [ ] **Step 1: Substituir `pages/index.tsx`**

```tsx
// pages/index.tsx
import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'
import { CheckoutForm } from '@/components/checkout/CheckoutForm'
import { useRouter } from 'next/router'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
const COURSE = { name: 'Mentoria EduFlow Pro', price: 49700, slug: 'mentoria-eduflow' }

const S = {
  page: { minHeight: '100vh', background: 'linear-gradient(160deg, var(--ef-bg-deep) 0%, var(--ef-bg-main) 60%, #3a005a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' } as const,
  box: { width: '100%', maxWidth: 480, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--ef-border)', borderRadius: 16, padding: '2.5rem' } as const,
  badge: { display: 'inline-block', background: 'rgba(254,229,113,0.15)', color: 'var(--ef-gold)', border: '1px solid rgba(254,229,113,0.3)', borderRadius: 20, fontSize: 12, fontWeight: 600, padding: '4px 12px', marginBottom: 16, letterSpacing: '0.05em', textTransform: 'uppercase' as const } as const,
  title: { fontSize: 28, fontWeight: 700, margin: '0 0 8px', color: 'var(--ef-white)', fontFamily: "'Roboto Slab', serif" } as const,
  price: { fontSize: 36, fontWeight: 700, color: 'var(--ef-gold)', margin: '0 0 8px' } as const,
  sub: { fontSize: 14, color: 'var(--ef-muted)', margin: '0 0 28px' } as const,
  input: { width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.07)', border: '1px solid var(--ef-border)', borderRadius: 8, color: 'var(--ef-white)', fontSize: 15, outline: 'none', marginBottom: 12 } as const,
  btn: (disabled: boolean) => ({ width: '100%', padding: '14px', background: disabled ? 'rgba(254,229,113,0.4)' : 'var(--ef-gold)', color: '#21002E', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer', transition: 'opacity 0.2s', letterSpacing: '0.02em' } as const),
}

export default function Home() {
  const router = useRouter()
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', email: '' })
  const [step, setStep] = useState<'form' | 'payment'>('form')
  const [loading, setLoading] = useState(false)

  async function handleContinue() {
    setLoading(true)
    const res = await fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.name, email: form.email, course: COURSE.slug, amount: COURSE.price }),
    })
    const { clientSecret } = await res.json()
    setClientSecret(clientSecret)
    setStep('payment')
    setLoading(false)
  }

  return (
    <div style={S.page}>
      <div style={S.box}>
        <span style={S.badge}>Acesso imediato</span>
        <h1 style={S.title}>{COURSE.name}</h1>
        <p style={S.price}>R$ {(COURSE.price / 100).toFixed(2).replace('.', ',')}</p>
        <p style={S.sub}>Acesso vitalício · Suporte incluso · Certificado de conclusão</p>

        {step === 'form' && (
          <div>
            <input style={S.input} placeholder="Seu nome completo" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            <input style={S.input} type="email" placeholder="Seu melhor email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            <button style={S.btn(!form.name || !form.email || loading)} onClick={handleContinue} disabled={!form.name || !form.email || loading}>
              {loading ? 'Aguarde...' : 'Continuar para pagamento →'}
            </button>
          </div>
        )}

        {step === 'payment' && clientSecret && (
          <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'night', variables: { colorPrimary: '#FEE571', colorBackground: '#2E0041', colorText: '#ffffff', borderRadius: '8px' } } }}>
            <CheckoutForm onSuccess={() => router.push('/portal')} />
          </Elements>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Substituir `components/checkout/CheckoutForm.tsx`**

```tsx
// components/checkout/CheckoutForm.tsx
import { useState } from 'react'
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'

const S = {
  btn: (disabled: boolean) => ({ width: '100%', marginTop: 20, padding: '14px', background: disabled ? 'rgba(254,229,113,0.4)' : 'var(--ef-gold)', color: '#21002E', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer' } as const),
  error: { color: '#f87171', fontSize: 13, marginTop: 10 } as const,
}

export function CheckoutForm({ onSuccess }: { onSuccess: () => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return
    setLoading(true)
    setError(null)
    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.origin + '/portal' },
      redirect: 'if_required',
    })
    if (stripeError) {
      setError(stripeError.message ?? 'Erro ao processar pagamento')
      setLoading(false)
    } else {
      onSuccess()
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      {error && <p style={S.error} role="alert">{error}</p>}
      <button type="submit" disabled={!stripe || loading} style={S.btn(!stripe || loading)}>
        {loading ? 'Processando...' : 'Pagar agora'}
      </button>
    </form>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add pages/index.tsx components/checkout/CheckoutForm.tsx
git commit -m "redesign landing e checkout com tema dark"
```

---

## Task 5: Redesign da página de login

**Files:**
- Modify: `pages/login.tsx`

- [ ] **Step 1: Substituir `pages/login.tsx`**

```tsx
// pages/login.tsx
import { useState, FormEvent } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/lib/firebase-client'
import { useRouter } from 'next/router'

const S = {
  page: { minHeight: '100vh', background: 'linear-gradient(160deg, var(--ef-bg-deep) 0%, var(--ef-bg-main) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' } as const,
  box: { width: '100%', maxWidth: 400, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--ef-border)', borderRadius: 16, padding: '2.5rem' } as const,
  logo: { fontSize: 13, fontWeight: 700, color: 'var(--ef-gold)', letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: 24 } as const,
  title: { fontSize: 24, fontWeight: 700, margin: '0 0 6px', fontFamily: "'Roboto Slab', serif" } as const,
  sub: { fontSize: 14, color: 'var(--ef-muted)', margin: '0 0 28px' } as const,
  input: { width: '100%', padding: '12px 14px', background: 'rgba(255,255,255,0.07)', border: '1px solid var(--ef-border)', borderRadius: 8, color: 'var(--ef-white)', fontSize: 15, outline: 'none', marginBottom: 12 } as const,
  btn: (disabled: boolean) => ({ width: '100%', padding: '13px', background: disabled ? 'rgba(254,229,113,0.4)' : 'var(--ef-gold)', color: '#21002E', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer' } as const),
  error: { color: '#f87171', fontSize: 13, marginBottom: 12 } as const,
}

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
      setError('Email ou senha incorretos. Verifique sua caixa de entrada para o link de acesso.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={S.page}>
      <div style={S.box}>
        <p style={S.logo}>EduFlow Pro</p>
        <h1 style={S.title}>Bem-vindo de volta</h1>
        <p style={S.sub}>Entre com seu email e senha para acessar seu curso.</p>
        <form onSubmit={handleSubmit}>
          <input style={S.input} type="email" placeholder="Seu email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input style={S.input} type="password" placeholder="Sua senha" value={password} onChange={(e) => setPassword(e.target.value)} />
          {error && <p role="alert" style={S.error}>{error}</p>}
          <button type="submit" disabled={loading || !email || !password} style={S.btn(loading || !email || !password)}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add pages/login.tsx
git commit -m "redesign página de login com tema dark"
```

---

## Task 6: Redesign do portal do aluno

**Files:**
- Modify: `pages/portal.tsx`

- [ ] **Step 1: Substituir `pages/portal.tsx`**

```tsx
// pages/portal.tsx
import { useEffect, useState } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase-client'
import { CourseProgress } from '@/components/portal/CourseProgress'
import { withAuth } from '@/middleware/withAuth'
import type { User } from 'firebase/auth'

const S = {
  page: { minHeight: '100vh', background: 'linear-gradient(180deg, var(--ef-bg-deep) 0%, var(--ef-bg-main) 100%)' } as const,
  header: { background: 'rgba(33,0,46,0.85)', backdropFilter: 'blur(8px)', borderBottom: '1px solid var(--ef-border)', padding: '0 2rem', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky' as const, top: 0, zIndex: 10 } as const,
  logo: { fontSize: 14, fontWeight: 700, color: 'var(--ef-gold)', letterSpacing: '0.08em', textTransform: 'uppercase' as const } as const,
  greeting: { fontSize: 14, color: 'var(--ef-muted)' } as const,
  signOut: { padding: '6px 16px', background: 'transparent', border: '1px solid var(--ef-border)', borderRadius: 6, color: 'var(--ef-muted)', cursor: 'pointer', fontSize: 13 } as const,
  main: { maxWidth: 720, margin: '0 auto', padding: '2.5rem 1.5rem' } as const,
  welcome: { marginBottom: 32 } as const,
  name: { fontSize: 26, fontWeight: 700, margin: '0 0 4px', fontFamily: "'Roboto Slab', serif" } as const,
  sub: { fontSize: 14, color: 'var(--ef-muted)', margin: 0 } as const,
  card: { background: 'rgba(255,255,255,0.04)', border: '1px solid var(--ef-border)', borderRadius: 16, padding: '2rem' } as const,
  courseTitle: { fontSize: 18, fontWeight: 700, color: 'var(--ef-gold)', margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 8 } as const,
}

function PortalPage() {
  const [user, setUser] = useState<User | null>(null)
  const [studentName, setStudentName] = useState('')

  useEffect(() => {
    let innerUnsub: (() => void) | null = null
    const outerUnsub = onAuthStateChanged(auth, async (u) => {
      innerUnsub?.()
      if (!u) return
      setUser(u)
      updateDoc(doc(db, 'users', u.uid), { last_login: serverTimestamp() }).catch(() => {})
      innerUnsub = onSnapshot(doc(db, 'users', u.uid), (snap) => {
        setStudentName(snap.data()?.name ?? '')
      })
    })
    return () => { outerUnsub(); innerUnsub?.() }
  }, [])

  return (
    <div style={S.page}>
      <header style={S.header}>
        <span style={S.logo}>EduFlow Pro</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={S.greeting}>Olá, {studentName || 'aluno'} 👋</span>
          <button onClick={() => signOut(auth)} style={S.signOut}>Sair</button>
        </div>
      </header>
      <main style={S.main}>
        <div style={S.welcome}>
          <h1 style={S.name}>Seu painel de aprendizado</h1>
          <p style={S.sub}>Marque as aulas concluídas para acompanhar seu progresso.</p>
        </div>
        <div style={S.card}>
          <h2 style={S.courseTitle}>🎓 Mentoria EduFlow Pro</h2>
          {user && <CourseProgress uid={user.uid} courseId="mentoria-eduflow" />}
        </div>
      </main>
    </div>
  )
}

export default withAuth(PortalPage, 'student')
```

- [ ] **Step 2: Commit**

```bash
git add pages/portal.tsx
git commit -m "redesign portal do aluno com tema dark"
```

---

## Task 7: Redesign da página aguardando

**Files:**
- Modify: `pages/aguardando.tsx`

- [ ] **Step 1: Substituir `pages/aguardando.tsx`**

```tsx
// pages/aguardando.tsx
import { useRouter } from 'next/router'

const S = {
  page: { minHeight: '100vh', background: 'linear-gradient(160deg, var(--ef-bg-deep) 0%, var(--ef-bg-main) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' } as const,
  box: { textAlign: 'center' as const, maxWidth: 480 } as const,
  icon: { fontSize: 56, marginBottom: 24 } as const,
  title: { fontSize: 28, fontWeight: 700, margin: '0 0 12px', fontFamily: "'Roboto Slab', serif" } as const,
  text: { fontSize: 16, color: 'var(--ef-muted)', lineHeight: 1.6, margin: '0 0 32px' } as const,
  badge: { display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(15,202,41,0.12)', border: '1px solid rgba(15,202,41,0.3)', color: '#0FCA29', borderRadius: 20, padding: '8px 20px', fontSize: 14, fontWeight: 600 } as const,
  btn: { marginTop: 24, display: 'block', color: 'var(--ef-muted)', fontSize: 13, cursor: 'pointer', background: 'none', border: 'none', textDecoration: 'underline' } as const,
}

export default function Aguardando() {
  const router = useRouter()
  return (
    <div style={S.page}>
      <div style={S.box}>
        <div style={S.icon}>⏳</div>
        <h1 style={S.title}>Pagamento em processamento</h1>
        <p style={S.text}>Seu pagamento está sendo confirmado. Em instantes você receberá um email com o link para criar sua senha e acessar o curso.</p>
        <div style={S.badge}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#0FCA29', animation: 'pulse 1.5s infinite' }} />
          Aguardando confirmação
        </div>
        <button style={S.btn} onClick={() => router.push('/login')}>Já tenho minha senha — entrar</button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add pages/aguardando.tsx
git commit -m "redesign página aguardando com tema dark"
```

---

## Task 8: Redesign do admin (página + componentes)

**Files:**
- Modify: `pages/admin.tsx`
- Modify: `components/admin/StudentTable.tsx`
- Modify: `components/admin/RevenueChart.tsx`

- [ ] **Step 1: Substituir `pages/admin.tsx`**

```tsx
// pages/admin.tsx
import { useEffect, useState } from 'react'
import { StudentTable } from '@/components/admin/StudentTable'
import { RevenueChart } from '@/components/admin/RevenueChart'
import { withAuth } from '@/middleware/withAuth'
import { signOut, getIdToken, onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase-client'

interface Student {
  id: string; name: string; email: string; created_at: string
  enrollments: { course: string; status: string }[]
  payments: { amount: number; status: string; paid_at: string }[]
}

const S = {
  page: { minHeight: '100vh', background: 'linear-gradient(180deg, var(--ef-bg-deep) 0%, var(--ef-bg-main) 100%)' } as const,
  header: { background: 'rgba(33,0,46,0.9)', backdropFilter: 'blur(8px)', borderBottom: '1px solid var(--ef-border)', padding: '0 2rem', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky' as const, top: 0, zIndex: 10 } as const,
  logo: { fontSize: 14, fontWeight: 700, color: 'var(--ef-gold)', letterSpacing: '0.08em', textTransform: 'uppercase' as const } as const,
  adminBadge: { fontSize: 11, background: 'rgba(254,229,113,0.15)', color: 'var(--ef-gold)', border: '1px solid rgba(254,229,113,0.3)', borderRadius: 4, padding: '2px 8px', marginLeft: 8 } as const,
  signOut: { padding: '6px 16px', background: 'transparent', border: '1px solid var(--ef-border)', borderRadius: 6, color: 'var(--ef-muted)', cursor: 'pointer', fontSize: 13 } as const,
  main: { maxWidth: 1024, margin: '0 auto', padding: '2.5rem 1.5rem' } as const,
  title: { fontSize: 22, fontWeight: 700, margin: '0 0 24px', fontFamily: "'Roboto Slab', serif" } as const,
  stats: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 } as const,
  stat: { padding: '20px 24px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--ef-border)', borderRadius: 12 } as const,
  statLabel: { fontSize: 12, color: 'var(--ef-muted)', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 8 } as const,
  statValue: { fontSize: 30, fontWeight: 700, color: 'var(--ef-gold)' } as const,
  section: { background: 'rgba(255,255,255,0.04)', border: '1px solid var(--ef-border)', borderRadius: 12, padding: '1.5rem', marginBottom: 24 } as const,
  loading: { color: 'var(--ef-muted)', fontSize: 14 } as const,
}

function AdminPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) { setLoading(false); return }
      getIdToken(user).then((token) =>
        fetch('/api/admin/students', { headers: { Authorization: `Bearer ${token}` } })
          .then((r) => r.json())
          .then((data) => { setStudents(Array.isArray(data) ? data : []); setLoading(false) })
          .catch(() => setLoading(false))
      )
    })
    return unsub
  }, [])

  const allPayments = students.flatMap((s) => s.payments.filter((p) => p.status === 'succeeded'))
  const totalRevenue = allPayments.reduce((acc, p) => acc + p.amount, 0)

  return (
    <div style={S.page}>
      <header style={S.header}>
        <div>
          <span style={S.logo}>EduFlow Pro</span>
          <span style={S.adminBadge}>Admin</span>
        </div>
        <button onClick={() => signOut(auth)} style={S.signOut}>Sair</button>
      </header>
      <main style={S.main}>
        <h1 style={S.title}>Dashboard</h1>
        <div style={S.stats}>
          <div style={S.stat}>
            <p style={S.statLabel}>Total de alunos</p>
            <p style={S.statValue}>{students.length}</p>
          </div>
          <div style={S.stat}>
            <p style={S.statLabel}>Faturamento total</p>
            <p style={S.statValue}>R$ {totalRevenue.toFixed(2).replace('.', ',')}</p>
          </div>
          <div style={S.stat}>
            <p style={S.statLabel}>Matrículas ativas</p>
            <p style={S.statValue}>{students.filter((s) => s.enrollments[0]?.status === 'active').length}</p>
          </div>
        </div>
        <div style={S.section}>
          <RevenueChart payments={allPayments} />
        </div>
        <div style={S.section}>
          {loading ? <p style={S.loading}>Carregando alunos...</p> : <StudentTable students={students} />}
        </div>
      </main>
    </div>
  )
}

export default withAuth(AdminPage, 'admin')
```

- [ ] **Step 2: Substituir `components/admin/StudentTable.tsx`**

```tsx
// components/admin/StudentTable.tsx
interface Student {
  id: string; name: string; email: string; created_at: string
  enrollments: { course: string; status: string }[]
  payments: { amount: number; status: string; paid_at: string }[]
}

const S = {
  title: { fontSize: 15, fontWeight: 600, color: 'var(--ef-gold)', margin: '0 0 16px' } as const,
  wrap: { overflowX: 'auto' as const } as const,
  table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: 14 } as const,
  th: { padding: '10px 14px', textAlign: 'left' as const, fontSize: 11, fontWeight: 600, color: 'var(--ef-muted)', textTransform: 'uppercase' as const, letterSpacing: '0.06em', borderBottom: '1px solid var(--ef-border)' } as const,
  td: { padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'var(--ef-white)' } as const,
  tdMuted: { padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'var(--ef-muted)', fontSize: 13 } as const,
  badge: (active: boolean) => ({ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: active ? 'rgba(15,202,41,0.15)' : 'rgba(248,113,113,0.15)', color: active ? '#0FCA29' : '#f87171', border: `1px solid ${active ? 'rgba(15,202,41,0.3)' : 'rgba(248,113,113,0.3)'}` } as const),
  empty: { color: 'var(--ef-muted)', fontSize: 14, padding: '1rem 0' } as const,
}

export function StudentTable({ students }: { students: Student[] }) {
  if (!students.length) return <p style={S.empty}>Nenhum aluno cadastrado ainda.</p>
  return (
    <div>
      <p style={S.title}>Alunos cadastrados</p>
      <div style={S.wrap}>
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>Nome</th>
              <th style={S.th}>Email</th>
              <th style={S.th}>Curso</th>
              <th style={S.th}>Status</th>
              <th style={S.th}>Valor pago</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => {
              const active = s.enrollments[0]?.status === 'active'
              const paid = s.payments.filter((p) => p.status === 'succeeded').reduce((a, p) => a + p.amount, 0)
              return (
                <tr key={s.id}>
                  <td style={S.td}>{s.name}</td>
                  <td style={S.tdMuted}>{s.email}</td>
                  <td style={S.tdMuted}>{s.enrollments[0]?.course ?? '—'}</td>
                  <td style={S.td}><span style={S.badge(active)}>{s.enrollments[0]?.status ?? '—'}</span></td>
                  <td style={S.td}>{paid > 0 ? `R$ ${paid.toFixed(2).replace('.', ',')}` : '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Substituir `components/admin/RevenueChart.tsx`**

```tsx
// components/admin/RevenueChart.tsx
interface Payment { amount: number; paid_at: string }

const S = {
  title: { fontSize: 15, fontWeight: 600, color: 'var(--ef-gold)', margin: '0 0 20px' } as const,
  chart: { display: 'flex', alignItems: 'flex-end', gap: 12, height: 140 } as const,
  col: { flex: 1, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 6 } as const,
  value: { fontSize: 11, color: 'var(--ef-muted)' } as const,
  bar: (pct: number) => ({ width: '100%', height: `${Math.max(pct * 100, 6)}px`, background: 'linear-gradient(180deg, var(--ef-gold) 0%, var(--ef-gold-dark) 100%)', borderRadius: '4px 4px 0 0', transition: 'height 0.4s' } as const),
  label: { fontSize: 11, color: 'var(--ef-muted)' } as const,
  empty: { color: 'var(--ef-muted)', fontSize: 14 } as const,
}

export function RevenueChart({ payments }: { payments: Payment[] }) {
  const byMonth = payments.reduce<Record<string, { display: string; total: number }>>((acc, p) => {
    const date = new Date(p.paid_at)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const display = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
    if (!acc[key]) acc[key] = { display, total: 0 }
    acc[key].total += p.amount
    return acc
  }, {})

  const entries = Object.entries(byMonth).sort(([a], [b]) => a.localeCompare(b)).slice(-6)
  const max = Math.max(...entries.map(([, v]) => v.total), 1)

  if (!entries.length) return <p style={S.empty}>Nenhum pagamento registrado ainda.</p>

  return (
    <div>
      <p style={S.title}>Faturamento mensal</p>
      <div style={S.chart}>
        {entries.map(([key, { display, total }]) => (
          <div key={key} style={S.col}>
            <span style={S.value}>R${total.toFixed(0)}</span>
            <div style={S.bar(total / max)} />
            <span style={S.label}>{display}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add pages/admin.tsx components/admin/StudentTable.tsx components/admin/RevenueChart.tsx
git commit -m "redesign admin dashboard com tema dark"
```

---

## Task 9: Email de boas-vindas em português (Firebase Console)

Este passo é **manual** — feito no Firebase Console.

- [ ] **Step 1: Acessar templates de email**

Acesse: `https://console.firebase.google.com/project/eduflow-pro-137d2/authentication/emails`

- [ ] **Step 2: Editar "Password reset"**

Clique em **"Password reset"** → edite:

- **Remetente:** `EduFlow Pro`
- **Assunto:** `Bem-vindo à Mentoria EduFlow Pro! Crie sua senha para começar`
- **Corpo:**

```
Olá!

Seja muito bem-vindo(a) à Mentoria EduFlow Pro 🎓

Seu pagamento foi confirmado e seu acesso está pronto.
Clique no botão abaixo para criar sua senha e começar agora:

%LINK%

Este link expira em 1 hora. Se você não solicitou este acesso, ignore este email.

Qualquer dúvida, responda este email.

— Equipe EduFlow Pro
```

- [ ] **Step 3: Salvar**

Clique em **"Save"**.

---

## Task 10: Deploy final

- [ ] **Step 1: Rodar testes**

```bash
npx jest --no-coverage
```

Esperado: todos passando.

- [ ] **Step 2: Deploy para Vercel**

```bash
npx vercel --token $VERCEL_TOKEN --prod --yes --scope ygors-projects-c1c39b72
```

- [ ] **Step 3: Verificar páginas no ar**

- `/` — landing dark com formulário e checkout Stripe
- `/login` — login dark
- `/portal` — portal com módulos e progresso
- `/aguardando` — página de espera dark
- `/admin` — dashboard escuro com tabela e gráfico

- [ ] **Step 4: Push final**

```bash
git push origin main
```
