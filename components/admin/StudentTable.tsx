interface Student {
  id: string
  name: string
  email: string
  created_at: string
  enrollments: { course: string; status: string }[]
  payments: { amount: number; status: string; paid_at: string }[]
}

export function StudentTable({ students }: { students: Student[] }) {
  if (students.length === 0) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9375rem' }}>
        Nenhum aluno cadastrado ainda.
      </div>
    )
  }

  return (
    <div className="ef-table-wrap">
      <table className="ef-table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Email</th>
            <th>Curso</th>
            <th>Status</th>
            <th>Valor pago</th>
          </tr>
        </thead>
        <tbody>
          {students.map((s) => {
            const paid = s.payments
              .filter((p) => p.status === 'succeeded')
              .reduce((acc, p) => acc + p.amount, 0)
            const status = s.enrollments[0]?.status ?? null

            return (
              <tr key={s.id}>
                <td>{s.name}</td>
                <td style={{ color: 'var(--text-muted)' }}>{s.email}</td>
                <td>{s.enrollments[0]?.course ?? '—'}</td>
                <td>
                  {status ? (
                    <span className={`ef-badge ${status === 'active' ? 'ef-badge-success' : 'ef-badge-error'}`}>
                      {status === 'active' ? 'Ativo' : status}
                    </span>
                  ) : '—'}
                </td>
                <td style={{ color: paid > 0 ? 'var(--success)' : 'var(--text-muted)', fontWeight: paid > 0 ? 600 : 400 }}>
                  {paid > 0
                    ? `R$ ${(paid / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                    : '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
