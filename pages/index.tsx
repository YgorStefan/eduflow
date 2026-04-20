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
