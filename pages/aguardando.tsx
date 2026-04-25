export default function Aguardando() {
  const steps = [
    { label: 'Pagamento recebido',     done: true,  active: false },
    { label: 'Confirmando transação',  done: false, active: true  },
    { label: 'Liberando seu acesso',   done: false, active: false },
  ]

  return (
    <div className="ef-page-auth" style={{ gap: '2rem' }}>
      {/* Spinner */}
      <div style={{ position: 'relative', width: 72, height: 72 }}>
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          border: '2px solid var(--border)',
        }} />
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          border: '2px solid transparent',
          borderTopColor: 'var(--accent)',
          animation: 'ef-spin 0.85s linear infinite',
        }} />
        <div style={{
          position: 'absolute', inset: 14,
          borderRadius: '50%',
          background: 'var(--accent-dim)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18,
        }}>
          ⚡
        </div>
      </div>

      {/* Title */}
      <div className="ef-anim" style={{ textAlign: 'center', maxWidth: 360 }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: 10 }}>
          Processando pagamento
        </h1>
        <p style={{ fontSize: '0.9375rem', lineHeight: 1.75 }}>
          Seu pagamento está sendo confirmado. Em breve você receberá um e-mail com as instruções de acesso.
        </p>
      </div>

      {/* Step tracker */}
      <div className="ef-card ef-anim ef-anim-d1" style={{ width: '100%', maxWidth: 340 }}>
        {steps.map((step, i) => (
          <div
            key={i}
            style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: i === 0 ? '0 0 16px' : i === steps.length - 1 ? '16px 0 0' : '16px 0',
              borderBottom: i < steps.length - 1 ? '1px solid var(--border)' : 'none',
            }}
          >
            <div style={{
              width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.7rem', fontWeight: 800,
              background: step.done
                ? 'var(--success-dim)'
                : step.active
                  ? 'var(--accent-dim)'
                  : 'var(--bg-elevated)',
              color: step.done
                ? 'var(--success)'
                : step.active
                  ? 'var(--accent)'
                  : 'var(--text-muted)',
              border: step.active ? '1px solid rgba(232,165,52,0.3)' : '1px solid transparent',
            }}>
              {step.done ? '✓' : step.active ? '◉' : '○'}
            </div>
            <span style={{
              fontSize: '0.9rem',
              fontWeight: step.done || step.active ? 600 : 400,
              color: step.done || step.active ? 'var(--text-primary)' : 'var(--text-muted)',
            }}>
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
