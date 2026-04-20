import { useEffect, useState } from 'react'
import { StudentTable } from '@/components/admin/StudentTable'
import { RevenueChart } from '@/components/admin/RevenueChart'
import { withAuth } from '@/middleware/withAuth'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase-client'

interface Student {
  id: string; name: string; email: string; created_at: string
  enrollments: { course: string; status: string }[]
  payments: { amount: number; status: string; paid_at: string }[]
}

function AdminPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/students')
      .then((r) => r.json())
      .then((data) => { setStudents(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const allPayments = students.flatMap((s) => s.payments.filter((p) => p.status === 'succeeded'))
  const totalRevenue = allPayments.reduce((acc, p) => acc + p.amount, 0)

  return (
    <main style={{ maxWidth: 960, margin: '0 auto', padding: '2rem 1rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <h1>Dashboard Admin</h1>
        <button onClick={() => signOut(auth)} style={{ padding: '6px 16px', border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer' }}>
          Sair
        </button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        <div style={{ padding: 20, background: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb' }}>
          <p style={{ fontSize: 13, color: '#6b7280' }}>Total de alunos</p>
          <p style={{ fontSize: 28, fontWeight: 700 }}>{students.length}</p>
        </div>
        <div style={{ padding: 20, background: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb' }}>
          <p style={{ fontSize: 13, color: '#6b7280' }}>Faturamento total</p>
          <p style={{ fontSize: 28, fontWeight: 700 }}>R$ {totalRevenue.toFixed(2).replace('.', ',')}</p>
        </div>
      </div>

      <div style={{ marginBottom: 32 }}>
        <RevenueChart payments={allPayments} />
      </div>

      {loading ? (
        <p style={{ color: '#6b7280' }}>Carregando alunos...</p>
      ) : (
        <StudentTable students={students} />
      )}
    </main>
  )
}

export default withAuth(AdminPage, 'admin')
