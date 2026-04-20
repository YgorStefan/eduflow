import { useState, FormEvent } from 'react'
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'

interface Props {
  onSuccess: () => void
}

export function CheckoutForm({ onSuccess }: Props) {
  const stripe = useStripe()
  const elements = useElements()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return

    setLoading(true)
    setError(null)

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/portal` },
      redirect: 'if_required',
    })

    if (stripeError) {
      setError(stripeError.message ?? 'Erro ao processar pagamento')
      setLoading(false)
      return
    }

    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 480, margin: '0 auto' }}>
      <PaymentElement />
      {error && (
        <p role="alert" style={{ color: '#dc2626', marginTop: 8, fontSize: 14 }}>
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={loading || !stripe}
        style={{ marginTop: 16, width: '100%', padding: '12px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
      >
        {loading ? 'Processando...' : 'Finalizar compra'}
      </button>
    </form>
  )
}
