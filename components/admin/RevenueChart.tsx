interface Payment { amount: number; paid_at: string }

export function RevenueChart({ payments }: { payments: Payment[] }) {
  const byMonth = payments.reduce<Record<string, { display: string; total: number }>>((acc, p) => {
    const date = new Date(p.paid_at)
    const sortKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const display = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
    if (!acc[sortKey]) acc[sortKey] = { display, total: 0 }
    acc[sortKey].total += p.amount
    return acc
  }, {})

  const entries = Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)

  const max = Math.max(...entries.map(([, v]) => v.total), 1)

  if (entries.length === 0) {
    return (
      <div style={{
        height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--text-muted)', fontSize: '0.875rem',
        background: 'var(--bg-elevated)', borderRadius: 'var(--radius)',
      }}>
        Sem dados de faturamento ainda
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 150, padding: '0 2px' }}>
      {entries.map(([key, { display, total }]) => {
        const heightPct = Math.max((total / max) * 100, 3)
        return (
          <div
            key={key}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}
          >
            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.01em' }}>
              R${Math.round(total).toLocaleString('pt-BR')}
            </span>
            <div style={{
              width: '100%',
              height: `${heightPct}%`,
              background: 'linear-gradient(180deg, var(--accent) 0%, rgba(147,51,234,0.35) 100%)',
              borderRadius: '5px 5px 0 0',
              transition: 'height 0.5s ease',
              minHeight: 4,
            }} />
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
              {display}
            </span>
          </div>
        )
      })}
    </div>
  )
}
