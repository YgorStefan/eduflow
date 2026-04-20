interface Student {
  id: string
  name: string
  email: string
  created_at: string
  enrollments: { course: string; status: string }[]
  payments: { amount: number; status: string; paid_at: string }[]
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
                {(() => {
                  const paid = s.payments
                    .filter(p => p.status === 'succeeded')
                    .reduce((acc, p) => acc + p.amount, 0)
                  return paid > 0 ? `R$ ${paid.toFixed(2).replace('.', ',')}` : '—'
                })()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
