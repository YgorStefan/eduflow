import type { NextApiRequest, NextApiResponse } from 'next'
import { Readable } from 'stream'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase'
import { adminDb, adminAuth } from '@/lib/firebase-admin'

export const config = { api: { bodyParser: false } }

async function buffer(req: NextApiRequest): Promise<Buffer> {
  const body = (req as unknown as { body?: unknown }).body
  if (typeof body === 'string') return Buffer.from(body)
  if (Buffer.isBuffer(body)) return body
  const chunks: Buffer[] = []
  for await (const chunk of req as unknown as Readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  return Buffer.concat(chunks)
}

async function notifyDiscord(message: string) {
  if (!process.env.DISCORD_WEBHOOK_URL) return
  await fetch(process.env.DISCORD_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: message }),
  })
}

async function createClickUpTask(studentName: string) {
  if (!process.env.CLICKUP_LIST_ID || !process.env.CLICKUP_API_TOKEN) return
  const deadline = Date.now() + 24 * 60 * 60 * 1000
  const res = await fetch(`https://api.clickup.com/api/v2/list/${process.env.CLICKUP_LIST_ID}/task`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: process.env.CLICKUP_API_TOKEN ?? '',
    },
    body: JSON.stringify({
      name: `Boas-vindas: ${studentName}`,
      due_date: deadline,
      priority: 2,
    }),
  })
  if (!res.ok) {
    await notifyDiscord(`⚠️ Falha ao criar task ClickUp para ${studentName}`)
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const sig = req.headers['stripe-signature'] as string
  const buf = await buffer(req)

  let event
  try {
    event = stripe.webhooks.constructEvent(buf.toString(), sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return res.status(400).json({ error: 'Assinatura inválida' })
  }

  if (event.type !== 'payment_intent.succeeded') {
    return res.status(200).json({ received: true })
  }

  const pi = event.data.object as unknown as {
    id: string
    amount: number
    metadata: { customer_name: string; customer_email: string; course: string }
  }
  const { customer_name, customer_email, course } = pi.metadata

  if (!customer_name || !customer_email || !course) {
    return res.status(400).json({ error: 'Metadados obrigatórios ausentes' })
  }

  // Upsert student
  let studentId: string
  const { data: existing } = await supabaseAdmin
    .from('students')
    .select('id')
    .eq('email', customer_email)
    .single()

  if (existing) {
    studentId = existing.id
  } else {
    const { data: newStudent, error } = await supabaseAdmin
      .from('students')
      .insert({ email: customer_email, name: customer_name })
      .select('id')
      .single()
    if (error || !newStudent) {
      await notifyDiscord(`🔴 Erro ao criar student: ${error?.message}`)
      await supabaseAdmin.from('error_logs').insert({ event: event.type, error: error?.message })
      return res.status(500).json({ error: 'Erro interno' })
    }
    studentId = newStudent.id
  }

  // Enrollment
  const { error: enrollError } = await supabaseAdmin.from('enrollments').insert({ student_id: studentId, course, status: 'active' })
  if (enrollError) {
    await notifyDiscord(`🔴 Erro ao criar enrollment: ${enrollError.message}`)
    await supabaseAdmin.from('error_logs').insert({ event: event.type, error: enrollError.message })
    return res.status(500).json({ error: 'Erro interno' })
  }

  // Payment
  const { error: paymentError } = await supabaseAdmin.from('payments').insert({
    student_id: studentId,
    stripe_payment_id: pi.id,
    amount: pi.amount / 100,
    status: 'succeeded',
  })
  if (paymentError) {
    await notifyDiscord(`🔴 Erro ao criar payment: ${paymentError.message}`)
    await supabaseAdmin.from('error_logs').insert({ event: event.type, error: paymentError.message })
    return res.status(500).json({ error: 'Erro interno' })
  }

  // Firebase Auth — cria conta para o aluno se não existir
  let firebaseUid: string
  try {
    const existing = await adminAuth.getUserByEmail(customer_email).catch(() => null)
    if (existing) {
      firebaseUid = existing.uid
    } else {
      const newUser = await adminAuth.createUser({
        email: customer_email,
        displayName: customer_name,
      })
      firebaseUid = newUser.uid
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    await notifyDiscord(`🔴 Erro ao criar usuário Firebase: ${msg}`)
    await supabaseAdmin.from('error_logs').insert({ event: event.type, error: msg })
    return res.status(500).json({ error: 'Erro interno' })
  }

  // Firebase Firestore — acesso do aluno (doc keyed by UID)
  try {
    await adminDb.collection('users').doc(firebaseUid).set(
      {
        uid: firebaseUid,
        email: customer_email,
        name: customer_name,
        access_enabled: true,
        supabase_id: studentId,
      },
      { merge: true }
    )
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    await notifyDiscord(`🔴 Erro ao gravar Firebase: ${msg}`)
    await supabaseAdmin.from('error_logs').insert({ event: event.type, error: msg })
    return res.status(500).json({ error: 'Erro interno' })
  }

  // Envia link de primeiro acesso ao aluno (não bloqueia o fluxo)
  adminAuth.generatePasswordResetLink(customer_email)
    .then((link) => notifyDiscord(`✅ Novo aluno: ${customer_name} — link de acesso: ${link}`))
    .catch(() => {})

  // ClickUp task (não bloqueia o fluxo)
  createClickUpTask(customer_name).catch(() => {})

  return res.status(200).json({ received: true })
}
