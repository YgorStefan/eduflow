import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'
import { CheckoutForm } from '@/components/checkout/CheckoutForm'
import { useRouter } from 'next/router'
import Link from 'next/link'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
const COURSE = { name: 'Mentoria EduFlow Pro', price: 49700, slug: 'mentoria-eduflow' }

export default function Checkout() {
  const router = useRouter()
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', email: '' })
  const [step, setStep] = useState<'form' | 'payment' | 'success'>('form')
  const [loading, setLoading] = useState(false)

  async function handleContinue() {
    if (!form.name || !form.email) return
    setLoading(true)
    try {
      const res = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, course: COURSE.slug, amount: COURSE.price }),
      })
      const { clientSecret } = await res.json()
      setClientSecret(clientSecret)
      setStep('payment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="ef-page-auth" style={{ gap: 0 }}>
      <div style={{ width: '100%', maxWidth: 500 }}>
        {/* Back link */}
        <div className="ef-anim" style={{ marginBottom: 24 }}>
          <Link href="/" style={{ fontSize: '0.875rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            ← Voltar
          </Link>
        </div>

        <div className="ef-card ef-anim ef-anim-d1" style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.5)' }}>
          {/* Course summary */}
          <div style={{ marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
            <span style={{
              display: 'inline-block',
              background: 'var(--accent-dim)', color: 'var(--accent)',
              border: '1px solid rgba(147,51,234,0.2)',
              borderRadius: 20, fontSize: '0.7rem', fontWeight: 800,
              padding: '3px 12px', marginBottom: 12,
              textTransform: 'uppercase', letterSpacing: '0.08em',
            }}>
              Acesso imediato
            </span>
            <h1 style={{ fontSize: '1.375rem', fontWeight: 800, marginBottom: 4 }}>{COURSE.name}</h1>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent)' }}>
                R$ {(COURSE.price / 100).toFixed(0)}
              </span>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                Acesso vitalício · Certificado incluso
              </span>
            </div>
          </div>

          {/* Step label */}
          {step !== 'success' && (
            <p style={{
              fontSize: '0.7rem', fontWeight: 800,
              textTransform: 'uppercase', letterSpacing: '0.1em',
              color: 'var(--text-muted)', marginBottom: 20,
            }}>
              {step === 'form' ? 'Suas informações' : 'Pagamento seguro 🔒'}
            </p>
          )}

          {step === 'form' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="ef-label">Nome completo</label>
                <input
                  className="ef-input"
                  placeholder="João Silva"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  autoComplete="name"
                />
              </div>
              <div>
                <label className="ef-label">E-mail</label>
                <input
                  className="ef-input"
                  type="email"
                  placeholder="joao@email.com"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  autoComplete="email"
                />
              </div>
              <button
                className="ef-btn ef-btn-primary ef-btn-full"
                onClick={handleContinue}
                disabled={!form.name || !form.email || loading}
                style={{ marginTop: 6 }}
              >
                {loading ? 'Aguarde...' : 'Continuar para pagamento →'}
              </button>
            </div>
          )}

          {step === 'success' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, padding: '8px 0', textAlign: 'center' }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: 'rgba(52,211,153,0.1)',
                border: '1px solid rgba(52,211,153,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28,
              }}>
                ✓
              </div>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 8 }}>Pagamento confirmado!</h2>
                <p style={{ fontSize: '0.9375rem', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
                  Enviamos um e-mail para <strong style={{ color: 'var(--text-primary)' }}>{form.email}</strong> com o link para criar sua senha e acessar a plataforma.
                </p>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: 12 }}>
                  Não encontrou? Verifique a caixa de spam.
                </p>
              </div>
            </div>
          )}

          {step === 'payment' && clientSecret && (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: { theme: 'night', variables: { colorPrimary: '#9333ea', borderRadius: '6px' } },
              }}
            >
              <CheckoutForm onSuccess={() => setStep('success')} />
            </Elements>
          )}
        </div>
      </div>
    </div>
  )
}
