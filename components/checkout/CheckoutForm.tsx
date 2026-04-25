import { useState, FormEvent } from 'react'
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'

export function CheckoutForm({ onSuccess }: { onSuccess: () => void }) {
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
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      {error && (
        <div className="ef-alert-error" role="alert" style={{ marginTop: 14 }}>
          {error}
        </div>
      )}
      <button
        type="submit"
        className="ef-btn ef-btn-primary ef-btn-full"
        disabled={loading || !stripe}
        style={{ marginTop: 18 }}
      >
        {loading ? 'Processando...' : 'Finalizar compra'}
      </button>
    </form>
  )
}
