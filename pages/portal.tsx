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
    return onAuthStateChanged(auth, async (u) => {
      if (!u) return
      setUser(u)
      // Atualiza last_login
      await updateDoc(doc(db, 'users', u.uid), { last_login: serverTimestamp() })
      const unsub = onSnapshot(doc(db, 'users', u.uid), (snap) => {
        setStudentName(snap.data()?.name ?? '')
      })
      return unsub
    })
  }, [])

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '2rem 1rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <h1>Olá, {studentName || 'aluno'} 👋</h1>
        <button onClick={() => signOut(auth)} style={{ padding: '6px 16px', border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer' }}>
          Sair
        </button>
      </header>

      <section>
        <h2 style={{ marginBottom: 12 }}>Mentoria EduFlow Pro</h2>
        {user && <CourseProgress uid={user.uid} courseId="mentoria-eduflow" />}
      </section>
    </main>
  )
}

export default withAuth(PortalPage, 'student')
