import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'
import { CheckoutForm } from '@/components/checkout/CheckoutForm'
import { useRouter } from 'next/router'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
const COURSE = { name: 'Mentoria EduFlow Pro', price: 49700, slug: 'mentoria-eduflow' }

const BENEFITS = [
  { icon: '🎯', text: 'Mentoria individual com especialistas' },
  { icon: '📚', text: 'Acesso vitalício ao conteúdo' },
  { icon: '🏆', text: 'Certificado de conclusão reconhecido' },
  { icon: '💬', text: 'Comunidade exclusiva de alunos' },
]

export default function Home() {
  const router = useRouter()
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', email: '' })
  const [step, setStep] = useState<'form' | 'payment'>('form')
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
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      backgroundImage: 'radial-gradient(ellipse 60% 50% at 65% -5%, rgba(232,165,52,0.07) 0%, transparent 55%)',
    }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 1.5rem' }}>
        <div className="ef-landing-grid">

          {/* ── Left: value prop ── */}
          <div className="ef-anim">
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '4px 14px',
              background: 'var(--accent-dim)',
              border: '1px solid rgba(232,165,52,0.2)',
              borderRadius: 20,
              marginBottom: 28,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Turma aberta
              </span>
            </div>

            <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.25rem)', fontWeight: 800, lineHeight: 1.1, marginBottom: 18 }}>
              {COURSE.name}
            </h1>

            <p style={{ fontSize: '1.0625rem', lineHeight: 1.75, marginBottom: 40, maxWidth: 460 }}>
              Acelere sua carreira com mentoria personalizada, conteúdo atualizado e uma comunidade ativa de profissionais.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 44 }}>
              {BENEFITS.map((b, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, flexShrink: 0,
                  }}>{b.icon}</span>
                  <span style={{ fontSize: '0.9375rem' }}>{b.text}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <span style={{ fontSize: '2.75rem', fontWeight: 800, color: 'var(--accent)', lineHeight: 1 }}>
                R$ {(COURSE.price / 100).toFixed(0)}
              </span>
              <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>pagamento único</span>
            </div>
          </div>

          {/* ── Right: checkout card ── */}
          <div className="ef-card ef-anim ef-anim-d1" style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.5)' }}>
            <p style={{
              fontSize: '0.7rem', fontWeight: 800,
              textTransform: 'uppercase', letterSpacing: '0.1em',
              color: 'var(--text-muted)', marginBottom: 24,
            }}>
              {step === 'form' ? 'Suas informações' : 'Pagamento seguro 🔒'}
            </p>

            {step === 'form' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
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
                <p style={{ textAlign: 'center', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  Já tem acesso?{' '}
                  <a href="/login">Entrar na plataforma</a>
                </p>
              </div>
            )}

            {step === 'payment' && clientSecret && (
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: { theme: 'night', variables: { colorPrimary: '#e8a534', borderRadius: '6px' } },
                }}
              >
                <CheckoutForm onSuccess={() => router.push('/portal')} />
              </Elements>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
