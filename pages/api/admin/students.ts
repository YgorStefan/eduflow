import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '@/lib/supabase'
import { adminAuth, adminDb } from '@/lib/firebase-admin'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()

  // Verify Firebase ID token
  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return res.status(401).json({ error: 'Não autorizado' })

  let uid: string
  try {
    const decoded = await adminAuth.verifyIdToken(token)
    uid = decoded.uid
  } catch {
    return res.status(401).json({ error: 'Token inválido' })
  }

  // Verify admin role in Firestore
  const userSnap = await adminDb.collection('users').doc(uid).get()
  if (!userSnap.exists || userSnap.data()?.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado' })
  }

  const { data, error } = await supabaseAdmin
    .from('students')
    .select(`
      id, name, email, created_at,
      enrollments ( course, status ),
      payments ( amount, status, paid_at )
    `)
    .order('created_at', { ascending: false })

  if (error) return res.status(500).json({ error: error.message })
  res.json(data ?? [])
}
