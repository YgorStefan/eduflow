import { useEffect, useState } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase-client'
import { CourseProgress } from '@/components/portal/CourseProgress'
import { withAuth } from '@/middleware/withAuth'
import type { User } from 'firebase/auth'

function PortalPage() {
  const [user, setUser] = useState<User | null>(null)
  const [studentName, setStudentName] = useState('')

  useEffect(() => {
    let innerUnsub: (() => void) | null = null

    const outerUnsub = onAuthStateChanged(auth, async (u) => {
      innerUnsub?.()
      innerUnsub = null
      if (!u) return
      setUser(u)
      updateDoc(doc(db, 'users', u.uid), { last_login: serverTimestamp() }).catch(() => {})
      innerUnsub = onSnapshot(doc(db, 'users', u.uid), (snap) => {
        setStudentName(snap.data()?.name ?? '')
      })
    })

    return () => { outerUnsub(); innerUnsub?.() }
  }, [])

  return (
    <div className="ef-page-app">
      <nav className="ef-nav">
        <div className="ef-nav-inner">
          <div className="ef-nav-brand">
            <span>⚡</span>
            <span>EduFlow Pro</span>
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

      <main style={{ maxWidth: 860, margin: '0 auto', padding: '3rem 1.5rem' }}>
        {/* Welcome header */}
        <div className="ef-anim" style={{ marginBottom: 36 }}>
          <p style={{
            fontSize: '0.7rem', fontWeight: 800,
            textTransform: 'uppercase', letterSpacing: '0.1em',
            color: 'var(--accent)', marginBottom: 8,
          }}>
            Portal do Aluno
          </p>
          <h1 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.25rem)', fontWeight: 800 }}>
            Olá, {studentName || 'aluno'} 👋
          </h1>
          <p style={{ marginTop: 6, fontSize: '0.9375rem' }}>
            Bem-vindo de volta. Continue de onde parou.
          </p>
        </div>

        {/* Course card */}
        <div className="ef-card ef-anim ef-anim-d1">
          <div style={{
            display: 'flex', alignItems: 'flex-start',
            justifyContent: 'space-between', marginBottom: 24,
            gap: 16,
          }}>
            <div>
              <p style={{
                fontSize: '0.7rem', fontWeight: 800,
                textTransform: 'uppercase', letterSpacing: '0.08em',
                color: 'var(--text-muted)', marginBottom: 6,
              }}>
                Seu curso
              </p>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Mentoria EduFlow Pro</h2>
            </div>
            <div style={{
              width: 44, height: 44, borderRadius: 12, flexShrink: 0,
              background: 'var(--accent-dim)',
              border: '1px solid rgba(232,165,52,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20,
            }}>
              🎯
            </div>
          </div>

          {user
            ? <CourseProgress uid={user.uid} courseId="mentoria-eduflow" />
            : (
              <div style={{ height: 8, borderRadius: 100, background: 'var(--bg-elevated)' }} />
            )
          }
        </div>
      </main>
    </div>
  )
}

export default withAuth(PortalPage, 'student')
