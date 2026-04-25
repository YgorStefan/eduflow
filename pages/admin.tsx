import { useEffect, useState } from 'react'
import { StudentTable } from '@/components/admin/StudentTable'
import { RevenueChart } from '@/components/admin/RevenueChart'
import { withAuth } from '@/middleware/withAuth'
import { signOut, getIdToken, onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase-client'

interface Student {
  id: string; name: string; email: string; created_at: string
  enrollments: { course: string; status: string }[]
  payments: { amount: number; status: string; paid_at: string }[]
}

function MetricCard({ label, value, icon, accent }: { label: string; value: string; icon: string; accent?: boolean }) {
  return (
    <div
      className="ef-card ef-anim"
      style={accent ? { borderColor: 'rgba(232,165,52,0.25)', background: 'rgba(232,165,52,0.04)' } : {}}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {label}
        </p>
        <span style={{
          width: 34, height: 34, borderRadius: 9,
          background: accent ? 'var(--accent-dim)' : 'var(--bg-elevated)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
        }}>
          {icon}
        </span>
      </div>
      <p style={{
        fontSize: '2rem', fontWeight: 800, lineHeight: 1,
        color: accent ? 'var(--accent)' : 'var(--text-primary)',
      }}>
        {value}
      </p>
    </div>
  )
}

function AdminPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) { setLoading(false); return }
      getIdToken(user).then((token) => {
        fetch('/api/admin/students', { headers: { Authorization: `Bearer ${token}` } })
          .then((r) => r.json())
          .then((data) => { setStudents(Array.isArray(data) ? data : []); setLoading(false) })
          .catch(() => setLoading(false))
      })
    })
    return unsub
  }, [])

  const allPayments = students.flatMap((s) => s.payments.filter((p) => p.status === 'succeeded'))
  const totalRevenue = allPayments.reduce((acc, p) => acc + p.amount, 0)
  const activeStudents = students.filter((s) => s.enrollments.some((e) => e.status === 'active')).length

  return (
    <div className="ef-page-app">
      <nav className="ef-nav">
        <div className="ef-nav-inner">
          <div className="ef-nav-brand">
            <span>⚡</span>
            <span>EduFlow Pro</span>
            <span style={{
              padding: '2px 8px', marginLeft: 4,
              background: 'var(--accent-dim)',
              color: 'var(--accent)',
              fontSize: '0.65rem', fontWeight: 800,
              borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.08em',
            }}>
              Admin
            </span>
          </div>
          <button
            className="ef-btn ef-btn-ghost"
            style={{ padding: '0.4rem 1rem', fontSize: '0.875rem' }}
            onClick={() => signOut(auth)}
          >
            Sair
          </button>
        </div>
      </nav>

      <main style={{ maxWidth: 1060, margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        {/* Page header */}
        <div className="ef-anim" style={{ marginBottom: 32 }}>
          <p style={{
            fontSize: '0.7rem', fontWeight: 800,
            textTransform: 'uppercase', letterSpacing: '0.1em',
            color: 'var(--text-muted)', marginBottom: 8,
          }}>
            Visão geral
          </p>
          <h1 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.25rem)', fontWeight: 800 }}>Dashboard</h1>
        </div>

        {/* Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
          <MetricCard label="Total de alunos" value={String(students.length)} icon="👥" />
          <MetricCard label="Alunos ativos"   value={String(activeStudents)}   icon="✅" />
          <MetricCard
            label="Faturamento total"
            value={`R$ ${(totalRevenue / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            icon="💰"
            accent
          />
        </div>

        {/* Chart */}
        <div className="ef-card ef-anim ef-anim-d1" style={{ marginBottom: 24 }}>
          <p style={{
            fontSize: '0.7rem', fontWeight: 800,
            textTransform: 'uppercase', letterSpacing: '0.1em',
            color: 'var(--text-muted)', marginBottom: 24,
          }}>
            Faturamento mensal
          </p>
          <RevenueChart payments={allPayments} />
        </div>

        {/* Table */}
        <div className="ef-card ef-anim ef-anim-d2">
          <p style={{
            fontSize: '0.7rem', fontWeight: 800,
            textTransform: 'uppercase', letterSpacing: '0.1em',
            color: 'var(--text-muted)', marginBottom: 20,
          }}>
            Alunos matriculados
          </p>
          {loading ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9375rem' }}>
              Carregando...
            </div>
          ) : (
            <StudentTable students={students} />
          )}
        </div>
      </main>
    </div>
  )
}

export default withAuth(AdminPage, 'admin')
