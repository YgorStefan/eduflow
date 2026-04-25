import { useEffect, useState } from 'react'
import { doc, onSnapshot, updateDoc, arrayUnion, arrayRemove, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase-client'
import { COURSE_MODULES, calcProgressPct } from '@/lib/course-content'

interface Progress {
  completed_lessons: string[]
}

export function CourseProgress({ uid, courseId }: { uid: string; courseId: string }) {
  const [completed, setCompleted] = useState<string[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const ref = doc(db, 'courses', courseId, 'progress', uid)
    return onSnapshot(ref,
      (snap) => {
        setCompleted(snap.exists() ? (snap.data() as Progress).completed_lessons ?? [] : [])
        setLoaded(true)
      },
      (err) => console.error('CourseProgress listener error:', err)
    )
  }, [uid, courseId])

  async function toggle(lessonId: string) {
    const ref = doc(db, 'courses', courseId, 'progress', uid)
    const done = completed.includes(lessonId)
    try {
      await updateDoc(ref, { completed_lessons: done ? arrayRemove(lessonId) : arrayUnion(lessonId) })
    } catch {
      await setDoc(ref, { completed_lessons: [lessonId] }, { merge: true })
    }
  }

  if (!loaded) {
    return (
      <div style={{ height: 8, borderRadius: 100, background: 'var(--bg-elevated)', animation: 'ef-pulse 1.5s ease infinite' }} />
    )
  }

  const pct = calcProgressPct(completed)

  return (
    <div>
      {/* Progress bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: '0.875rem' }}>
          {completed.length} / {COURSE_MODULES.flatMap(m => m.lessons).length} aulas
        </span>
        <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent)' }}>{pct}%</span>
      </div>
      <div className="ef-progress-track" style={{ marginBottom: 28 }}>
        <div className="ef-progress-fill" style={{ width: `${pct}%` }} />
      </div>

      {/* Modules */}
      {COURSE_MODULES.map((mod) => (
        <div key={mod.id} style={{ marginBottom: 24 }}>
          <p style={{
            fontSize: '0.8rem', fontWeight: 800,
            textTransform: 'uppercase', letterSpacing: '0.07em',
            color: 'var(--accent)', marginBottom: 10,
          }}>
            {mod.title}
          </p>
          {mod.lessons.map((lesson) => {
            const done = completed.includes(lesson.id)
            return (
              <div
                key={lesson.id}
                role="button"
                tabIndex={0}
                onClick={() => toggle(lesson.id)}
                onKeyDown={(e) => e.key === 'Enter' && toggle(lesson.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 14px', borderRadius: 8, marginBottom: 6,
                  cursor: 'pointer',
                  background: done ? 'var(--success-dim)' : 'var(--bg-elevated)',
                  border: `1px solid ${done ? 'rgba(52,211,153,0.25)' : 'var(--border)'}`,
                  transition: 'all var(--transition)',
                }}
              >
                <div style={{
                  width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.65rem', fontWeight: 800,
                  background: done ? 'var(--success)' : 'transparent',
                  border: `2px solid ${done ? 'var(--success)' : 'var(--border)'}`,
                  color: '#fff',
                  transition: 'all var(--transition)',
                }}>
                  {done ? '✓' : ''}
                </div>
                <span style={{
                  fontSize: '0.875rem',
                  color: done ? 'var(--text-muted)' : 'var(--text-primary)',
                  textDecoration: done ? 'line-through' : 'none',
                  transition: 'color var(--transition)',
                }}>
                  {lesson.title}
                </span>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
