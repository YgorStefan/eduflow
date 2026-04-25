import Link from 'next/link'

const COURSE = { name: 'Mentoria EduFlow Pro', price: 49700 }

const BENEFITS = [
  { icon: '🎯', title: 'Método comprovado', desc: 'Estratégias usadas por quem já alcançou resultados reais.' },
  { icon: '⚡', title: 'Acesso imediato', desc: 'Todo o conteúdo liberado na hora do pagamento.' },
  { icon: '♾️', title: 'Acesso vitalício', desc: 'Assista quando quiser, quantas vezes precisar.' },
  { icon: '🏆', title: 'Certificado de conclusão', desc: 'Reconhecido ao finalizar todos os módulos.' },
  { icon: '💬', title: 'Suporte incluso', desc: 'Tire dúvidas com a equipe durante toda a mentoria.' },
  { icon: '📈', title: '5 módulos práticos', desc: 'Do fundamento à execução — direto ao ponto.' },
]

export default function Home() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      backgroundImage: 'radial-gradient(ellipse 60% 50% at 65% -5%, rgba(147,51,234,0.07) 0%, transparent 55%)',
    }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 1.5rem' }}>
        <div className="ef-landing-grid">

          {/* ── Left: value prop ── */}
          <div className="ef-anim">
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '4px 14px',
              background: 'var(--accent-dim)',
              border: '1px solid rgba(147,51,234,0.2)',
              borderRadius: 20, marginBottom: 28,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Turma aberta
              </span>
            </div>

            <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.25rem)', fontWeight: 800, lineHeight: 1.1, marginBottom: 18 }}>
              {COURSE.name}
            </h1>

            <p style={{ fontSize: '1.0625rem', lineHeight: 1.75, marginBottom: 44, maxWidth: 460 }}>
              Acelere sua carreira com mentoria personalizada, conteúdo atualizado e uma comunidade ativa de profissionais.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem 1.5rem', marginBottom: 48 }}>
              {BENEFITS.map((b, i) => (
                <div key={i} style={{ display: 'flex', gap: 12 }}>
                  <span style={{
                    width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                  }}>{b.icon}</span>
                  <div>
                    <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{b.title}</p>
                    <p style={{ fontSize: '0.8125rem', lineHeight: 1.5 }}>{b.desc}</p>
                  </div>
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

          {/* ── Right: CTA card ── */}
          <div className="ef-card ef-anim ef-anim-d1" style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12 }}>
                O que está incluso:
              </p>
              {['5 módulos + 17 aulas', 'Acesso vitalício ao portal', 'Comunidade exclusiva', 'Certificado de conclusão', 'Suporte da equipe'].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < 4 ? '1px solid var(--border)' : 'none' }}>
                  <span style={{ color: 'var(--success)', fontSize: '0.875rem' }}>✓</span>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{item}</span>
                </div>
              ))}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 14 }}>
                <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent)' }}>
                  R$ {(COURSE.price / 100).toFixed(0)}
                </span>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>pagamento único</span>
              </div>

              <Link href="/checkout" className="ef-btn ef-btn-primary ef-btn-full" style={{ display: 'flex', textDecoration: 'none' }}>
                Matricular agora →
              </Link>

              <p style={{ textAlign: 'center', fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: 14 }}>
                Já tem acesso?{' '}
                <Link href="/login">Entrar na plataforma</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
