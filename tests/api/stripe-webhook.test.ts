import { createMocks } from 'node-mocks-http'

// Mock das libs externas
jest.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn().mockReturnThis(),
    insert: jest.fn().mockResolvedValue({ error: null }),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: { id: 'student-uuid' }, error: null }),
  },
}))

jest.mock('@/lib/firebase-admin', () => ({
  adminDb: {
    collection: jest.fn().mockReturnThis(),
    doc: jest.fn().mockReturnThis(),
    set: jest.fn().mockResolvedValue(undefined),
  },
  adminAuth: {
    getUserByEmail: jest.fn().mockRejectedValue({ code: 'auth/user-not-found' }),
    createUser: jest.fn().mockResolvedValue({ uid: 'firebase-uid-123' }),
    generatePasswordResetLink: jest.fn().mockResolvedValue('https://reset.link/test'),
  },
}))

jest.mock('@/lib/stripe', () => ({
  stripe: {
    webhooks: {
      constructEvent: jest.fn(),
    },
  },
}))

import handler from '@/pages/api/webhooks/stripe'
import { stripe } from '@/lib/stripe'

describe('POST /api/webhooks/stripe', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true })
  })
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('retorna 400 para assinatura inválida', async () => {
    ;(stripe.webhooks.constructEvent as jest.Mock).mockImplementationOnce(() => {
      throw new Error('Invalid signature')
    })

    const { req, res } = createMocks({ method: 'POST', body: '{}', headers: { 'stripe-signature': 'bad' } })
    await handler(req, res)
    expect(res._getStatusCode()).toBe(400)
  })

  it('retorna 200 e processa payment_intent.succeeded', async () => {
    ;(stripe.webhooks.constructEvent as jest.Mock).mockReturnValueOnce({
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_test_123',
          amount: 9900,
          metadata: { customer_name: 'João Silva', customer_email: 'joao@email.com', course: 'Curso A' },
        },
      },
    })

    const { req, res } = createMocks({ method: 'POST', body: '{}', headers: { 'stripe-signature': 'valid' } })
    await handler(req, res)
    expect(res._getStatusCode()).toBe(200)
  })
})
