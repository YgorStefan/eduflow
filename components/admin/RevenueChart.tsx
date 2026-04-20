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

  return (
    <div>
      <h3 style={{ marginBottom: 16 }}>Faturamento mensal</h3>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 120 }}>
        {entries.map(([key, { display, total }]) => (
          <div key={key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 11, color: '#6b7280' }}>
              R${total.toFixed(0)}
            </span>
            <div style={{
              width: '100%',
              height: `${(total / max) * 80}px`,
              background: '#2563eb',
              borderRadius: '4px 4px 0 0',
              minHeight: 4,
            }} />
            <span style={{ fontSize: 11, color: '#9ca3af' }}>{display}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
