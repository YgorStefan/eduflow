import type { NextApiRequest, NextApiResponse } from 'next'
import { stripe } from '@/lib/stripe'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { name, email, course, amount } = req.body as {
    name: string; email: string; course: string; amount: number
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency: 'brl',
    metadata: { customer_name: name, customer_email: email, course },
  })

  res.json({ clientSecret: paymentIntent.client_secret })
}
