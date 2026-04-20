import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase-client'

interface Progress {
  progress_pct: number
  completed_lessons: string[]
  last_accessed: { toDate: () => Date } | null
}

export function CourseProgress({ uid, courseId }: { uid: string; courseId: string }) {
  const [progress, setProgress] = useState<Progress | null>(null)

  useEffect(() => {
    const ref = doc(db, 'courses', courseId, 'progress', uid)
    return onSnapshot(ref,
      (snap) => {
        setProgress(snap.exists() ? (snap.data() as Progress) : null)
      },
      (err) => {
        console.error('CourseProgress listener error:', err)
      }
    )
  }, [uid, courseId])

  if (!progress) return <p style={{ color: '#6b7280' }}>Nenhum progresso registrado ainda.</p>

  return (
    <div>
      <div style={{ background: '#f3f4f6', borderRadius: 8, overflow: 'hidden', height: 12 }}>
        <div style={{ background: '#2563eb', height: '100%', width: `${progress.progress_pct}%`, transition: 'width 0.3s' }} />
      </div>
      <p style={{ marginTop: 8, fontSize: 14, color: '#6b7280' }}>
        {progress.progress_pct}% concluído · {progress.completed_lessons.length} aulas
      </p>
    </div>
  )
}
