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
      (snap) => setProgress(snap.exists() ? (snap.data() as Progress) : null),
      (err) => console.error('CourseProgress listener error:', err)
    )
  }, [uid, courseId])

  if (!progress) {
    return (
      <div style={{
        padding: '1.25rem',
        background: 'var(--bg-elevated)',
        borderRadius: 'var(--radius)',
        textAlign: 'center',
      }}>
        <p style={{ fontSize: '0.9rem', marginBottom: 4 }}>Nenhum progresso registrado ainda.</p>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          Acesse o conteúdo para começar.
        </p>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: '0.875rem' }}>
          {progress.completed_lessons.length} aula{progress.completed_lessons.length !== 1 ? 's' : ''} concluída{progress.completed_lessons.length !== 1 ? 's' : ''}
        </span>
        <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent)' }}>
          {progress.progress_pct}%
        </span>
      </div>

      <div className="ef-progress-track">
        <div className="ef-progress-fill" style={{ width: `${progress.progress_pct}%` }} />
      </div>

      {progress.last_accessed && (
        <p style={{ marginTop: 10, fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          Último acesso:{' '}
          {progress.last_accessed.toDate().toLocaleDateString('pt-BR', {
            day: '2-digit', month: 'long', year: 'numeric',
          })}
        </p>
      )}
    </div>
  )
}
