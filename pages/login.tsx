import { useState, FormEvent } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase-client'
import { useRouter } from 'next/router'
import Link from 'next/link'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password)
      const snap = await getDoc(doc(db, 'users', user.uid))
      const role = snap.data()?.role ?? 'student'
      router.push(role === 'admin' ? '/admin' : '/portal')
    } catch {
      setError('Email ou senha incorretos.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="ef-page-auth">
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Brand mark */}
        <div className="ef-anim" style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            display: 'inline-flex', width: 52, height: 52, borderRadius: 14,
            background: 'var(--accent)', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, marginBottom: 18, boxShadow: '0 8px 24px rgba(232,165,52,0.35)',
          }}>
            ⚡
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: 6 }}>EduFlow Pro</h1>
          <p style={{ fontSize: '0.9375rem' }}>Acesse sua conta para continuar</p>
        </div>

        <div className="ef-card ef-anim ef-anim-d1" style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.45)' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label className="ef-label">E-mail</label>
              <input
                className="ef-input"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div>
              <label className="ef-label">Senha</label>
              <input
                className="ef-input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="ef-alert-error" role="alert">{error}</div>
            )}

            <button
              type="submit"
              className="ef-btn ef-btn-primary ef-btn-full"
              disabled={loading}
              style={{ marginTop: 4 }}
            >
              {loading ? 'Entrando...' : 'Entrar na plataforma'}
            </button>
          </form>

          <div className="ef-divider" />

          <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Ainda não é aluno?{' '}
            <Link href="/">Matricule-se agora</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
