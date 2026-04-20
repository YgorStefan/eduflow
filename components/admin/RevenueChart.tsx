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
