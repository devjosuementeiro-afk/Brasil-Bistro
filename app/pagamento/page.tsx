'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/lib/cart-context'
import { useLang } from '@/lib/lang-context'
import {
  loadCheckoutCustomer,
  isValidCheckoutCustomer,
  clearCheckoutCustomer,
  type CheckoutCustomer,
} from '@/lib/checkout-customer'
import { ArrowLeft, CreditCard, Wallet } from 'lucide-react'
import Link from 'next/link'
import Script from 'next/script'

declare global {
  interface Window {
    paypal?: {
      Buttons: (options: {
        style?: {
          shape?: 'pill' | 'rect'
          layout?: 'vertical' | 'horizontal'
          color?: 'gold' | 'blue' | 'silver' | 'white' | 'black'
          label?: 'paypal' | 'checkout' | 'pay' | 'buynow' | 'installment'
        }
        createOrder: () => Promise<string>
        onApprove: (
          data: { orderID: string },
          actions: { restart: () => Promise<void> }
        ) => Promise<void>
        onError: (error: unknown) => void
        onCancel?: (data: unknown) => void
      }) => { render: (selector: string) => Promise<void> }
      CardFields: (options: {
        createOrder: () => Promise<string>
        onApprove: (data: { orderID: string }) => Promise<void>
        onError: (error: unknown) => void
        style?: Record<string, Record<string, string>>
      }) => {
        isEligible: () => boolean
        NameField: () => { render: (selector: string) => Promise<void> }
        NumberField: () => { render: (selector: string) => Promise<void> }
        ExpiryField: () => { render: (selector: string) => Promise<void> }
        CVVField: () => { render: (selector: string) => Promise<void> }
        submit: () => Promise<void>
      }
    }
  }
}

export default function PagamentoPage() {
  const router = useRouter()
  const { items, totalPrice, totalItems, clearCart } = useCart()
  const { t } = useLang()
  const [checkoutCustomer, setCheckoutCustomer] = useState<CheckoutCustomer | null>(null)
  const [customerChecked, setCustomerChecked] = useState(false)
  const [sdkLoaded, setSdkLoaded] = useState(false)
  const [paypalError, setPaypalError] = useState<string | null>(null)
  const [resultMessage, setResultMessage] = useState('')
  const [cardFieldsEligible, setCardFieldsEligible] = useState(false)
  const [cardFieldsLoading, setCardFieldsLoading] = useState(false)
  const [method, setMethod] = useState<'paypal' | 'card'>('paypal')
  const [salvarCartaoEstePedido, setSalvarCartaoEstePedido] = useState(false)
  const [successOrderNumber, setSuccessOrderNumber] = useState<string | null>(null)
  const isRenderingRef = useRef(false)
  const cardFieldsRef = useRef<ReturnType<NonNullable<typeof window.paypal>['CardFields']> | null>(null)
  const methodRef = useRef(method)
  const salvarCartaoRef = useRef(salvarCartaoEstePedido)
  useEffect(() => {
    methodRef.current = method
  }, [method])
  useEffect(() => {
    salvarCartaoRef.current = salvarCartaoEstePedido
  }, [salvarCartaoEstePedido])

  const paypalEnv = process.env.NEXT_PUBLIC_PAYPAL_ENV === 'live' ? 'live' : 'sandbox'
  const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? ''
  const hasValidPayPalClientId = !!paypalClientId && !paypalClientId.includes('YOUR_PAYPAL_CLIENT_ID')

  const paypalScriptSrc = useMemo(() => {
    if (!hasValidPayPalClientId) return ''
    const base =
      paypalEnv === 'live'
        ? 'https://www.paypal.com/sdk/js'
        : 'https://www.sandbox.paypal.com/sdk/js'
    const query = new URLSearchParams({
      'client-id': paypalClientId,
      currency: 'USD',
      intent: 'capture',
      components: 'buttons,card-fields',
    })
    return `${base}?${query.toString()}`
  }, [hasValidPayPalClientId, paypalClientId, paypalEnv])

  useEffect(() => {
    const c = loadCheckoutCustomer()
    if (!isValidCheckoutCustomer(c)) {
      router.replace('/checkout/dados')
      return
    }
    setCheckoutCustomer(c)
    setCustomerChecked(true)
  }, [router])

  useEffect(() => {
    if (!checkoutCustomer || method !== 'card') return
    setSalvarCartaoEstePedido(checkoutCustomer.prefereSalvarCartao)
  }, [method, checkoutCustomer])

  function customerPayload() {
    const c = checkoutCustomer
    if (!c) throw new Error('Dados do cliente ausentes.')
    return {
      nome: c.nome.trim(),
      email: c.email.trim(),
      telefone: c.telefone.trim(),
      userId: c.userId,
      aceitaSmsAtualizacoes: c.aceitaSmsAtualizacoes,
      aceitaEmailAtualizacoes: c.aceitaEmailAtualizacoes,
      consentiuSalvarCartao: method === 'card' && salvarCartaoEstePedido,
    }
  }

  async function createOrder() {
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer: customerPayload(),
        cart: items.map(({ item, quantity, observation, unitPrice, selectedOptions }) => ({
          id: item.id,
          name: item.nome,
          quantity,
          unitAmount: unitPrice,
          observation,
          selectedOptions,
        })),
      }),
    })
    const orderData = await response.json()
    if (!response.ok || !orderData?.id) {
      throw new Error(orderData?.error ?? 'Falha ao iniciar checkout PayPal.')
    }
    return orderData.id as string
  }

  async function captureOrder(orderID: string) {
    const response = await fetch(`/api/orders/${orderID}/capture`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer: customerPayload(),
        cart: items.map(({ item, quantity, observation, unitPrice, selectedOptions }) => ({
          id: item.id,
          name: item.nome,
          quantity,
          unitAmount: unitPrice,
          observation,
          selectedOptions,
        })),
      }),
    })
    const captureData = await response.json()
    if (!response.ok) {
      const errorDetail = captureData?.details?.[0]
      throw new Error(
        captureData?.error ??
          (errorDetail ? `${errorDetail.description} (${captureData?.debug_id ?? ''})` : 'Falha ao finalizar pedido.')
      )
    }

    const transaction =
      captureData?.purchase_units?.[0]?.payments?.captures?.[0] ??
      captureData?.purchase_units?.[0]?.payments?.authorizations?.[0]

    const orderNumber =
      (captureData?.order_number as string | undefined) ??
      (captureData?.local_order_id as string | undefined)?.replace(/-/g, '').slice(-8).toUpperCase() ??
      String(transaction?.id ?? '').slice(-8).toUpperCase()

    setSuccessOrderNumber(orderNumber || 'N/A')
    clearCheckoutCustomer()
    clearCart()
    setResultMessage(`Pagamento ${transaction?.status ?? 'OK'}: ${transaction?.id ?? '-'}`)
  }

  useEffect(() => {
    if (!hasValidPayPalClientId) {
      setPaypalError('Configure NEXT_PUBLIC_PAYPAL_CLIENT_ID no ambiente atual (.env ou .env.test).')
      return
    }
    if (!customerChecked || !checkoutCustomer) return
    if (!sdkLoaded || !window.paypal || items.length === 0 || isRenderingRef.current) return
    const buttonsContainer = document.querySelector('#paypal-button-container')
    if (!buttonsContainer) return
    const cardName = document.querySelector('#card-name-field')
    const cardNumber = document.querySelector('#card-number-field')
    const cardExpiry = document.querySelector('#card-expiry-field')
    const cardCvv = document.querySelector('#card-cvv-field')
    setPaypalError(null)
    setResultMessage('')
    buttonsContainer.innerHTML = ''
    if (cardName) cardName.innerHTML = ''
    if (cardNumber) cardNumber.innerHTML = ''
    if (cardExpiry) cardExpiry.innerHTML = ''
    if (cardCvv) cardCvv.innerHTML = ''
    isRenderingRef.current = true
    cardFieldsRef.current = null
    setCardFieldsEligible(false)

    const buttonsInstance = window.paypal.Buttons({
      style: {
        shape: 'pill',
        layout: 'vertical',
        color: 'blue',
        label: 'pay',
      },
      createOrder,
      async onApprove(data, actions) {
        try {
          await captureOrder(data.orderID)
        } catch (error) {
          if (
            typeof error === 'object' &&
            error !== null &&
            'message' in error &&
            String((error as { message: string }).message).includes('INSTRUMENT_DECLINED')
          ) {
            return actions.restart()
          }
          setPaypalError(error instanceof Error ? error.message : 'Nao foi possivel processar o pagamento.')
        }
      },
      onCancel() {
        setResultMessage('Pagamento cancelado.')
      },
      onError(error) {
        console.error(error)
        setPaypalError('Erro no checkout PayPal.')
      },
    })

    const cardFieldsInstance = window.paypal.CardFields({
      createOrder,
      async onApprove(data) {
        await captureOrder(data.orderID)
      },
      onError(error) {
        console.error(error)
        setPaypalError('Erro no pagamento com cartao.')
      },
      style: {
        input: {
          border: '0.0625rem solid #90969730',
          'border-radius': '1rem',
          'box-sizing': 'border-box',
          background: '#ffffff',
          'font-family': 'inherit',
          'font-size': '0.9rem',
          padding: '0.9rem 0.75rem',
          width: '100%',
        },
      },
    })

    Promise.all([
      buttonsInstance.render('#paypal-button-container'),
      (async () => {
        if (!cardFieldsInstance.isEligible()) return
        if (!cardName || !cardNumber || !cardExpiry || !cardCvv) return
        setCardFieldsEligible(true)
        cardFieldsRef.current = cardFieldsInstance
        await Promise.all([
          cardFieldsInstance.NameField().render('#card-name-field'),
          cardFieldsInstance.NumberField().render('#card-number-field'),
          cardFieldsInstance.ExpiryField().render('#card-expiry-field'),
          cardFieldsInstance.CVVField().render('#card-cvv-field'),
        ])
      })(),
    ])
      .catch((error) => {
        console.error(error)
        setPaypalError('Nao foi possivel inicializar o checkout PayPal.')
      })
      .finally(() => {
        isRenderingRef.current = false
      })
  }, [sdkLoaded, items, clearCart, hasValidPayPalClientId, customerChecked, checkoutCustomer])

  async function handleCardPayment() {
    if (!cardFieldsRef.current) return
    setCardFieldsLoading(true)
    setPaypalError(null)
    try {
      await cardFieldsRef.current.submit()
    } catch (error) {
      setPaypalError(error instanceof Error ? error.message : 'Falha no pagamento com cartao.')
    } finally {
      setCardFieldsLoading(false)
    }
  }

  if (!customerChecked || !checkoutCustomer) {
    return (
      <main className="mx-auto min-h-screen max-w-lg bg-background px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <p className="text-sm text-muted-foreground">Carregando checkout...</p>
      </main>
    )
  }

  if (successOrderNumber) {
    return (
      <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center bg-background px-6 text-center">
        <div className="relative mb-6">
          <div className="absolute inset-0 rounded-full bg-green-200 animate-ping opacity-40" />
          <div className="relative w-20 h-20 rounded-full bg-green-500 text-white flex items-center justify-center text-4xl shadow-lg">
            ✓
          </div>
        </div>
        <h1 className="text-2xl font-extrabold text-foreground">Pagamento confirmado</h1>
        <p className="text-sm text-muted-foreground mt-2">Sua ordem foi gerada com sucesso.</p>
        <div className="mt-6 w-full max-w-xs rounded-2xl border border-border bg-card px-5 py-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Numero da ordem</p>
          <p className="mt-1 text-2xl font-bold text-accent">#{successOrderNumber}</p>
        </div>
        <Link
          href="/"
          className="mt-6 w-full max-w-xs rounded-2xl bg-primary py-3.5 text-sm font-bold text-primary-foreground"
        >
          Voltar ao cardapio
        </Link>
      </main>
    )
  }

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-background max-w-lg mx-auto px-4 pt-10">
        <Link href="/carrinho" className="text-sm font-semibold text-accent">
          Voltar ao carrinho
        </Link>
        <p className="mt-4 text-sm text-muted-foreground">Seu carrinho esta vazio.</p>
      </main>
    )
  }

  return (
    <main className="mx-auto min-h-screen max-w-lg bg-background pb-28">
      {!!paypalScriptSrc && (
        <Script src={paypalScriptSrc} strategy="afterInteractive" onLoad={() => setSdkLoaded(true)} />
      )}

      <header className="sticky top-0 z-40 border-b border-border/90 bg-background/90 px-4 pb-3 backdrop-blur-md pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="flex items-center gap-3">
          <Link
            href="/checkout/dados"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-border bg-card shadow-sm transition-colors active:bg-secondary"
            aria-label="Back"
          >
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-base font-bold text-foreground">Payment</h1>
        </div>
      </header>

      <section className="px-4 pt-4 space-y-4">
        <div className="space-y-0.5 rounded-3xl border border-border bg-card p-3 text-xs text-muted-foreground shadow-sm">
          <p className="font-semibold text-foreground text-sm">{checkoutCustomer.nome}</p>
          <p>{checkoutCustomer.email}</p>
          <p>{checkoutCustomer.telefone}</p>
          <Link href="/checkout/dados" className="inline-block pt-1 font-medium text-accent">
            Editar dados
          </Link>
        </div>

        <div className="rounded-3xl border border-border bg-card p-4 shadow-sm">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{totalItems} {totalItems === 1 ? t.item : t.items}</span>
            <span>{t.currency}{totalPrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-xl mt-1">
            <span>{t.total}</span>
            <span className="text-accent">
              {t.currency}
              {totalPrice.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-2 shadow-sm">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMethod('paypal')}
              className={`h-11 rounded-2xl text-sm font-semibold transition-colors ${
                method === 'paypal'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground'
              }`}
            >
              <span className="inline-flex items-center gap-1.5">
                <Wallet size={14} />
                PayPal
              </span>
            </button>
            <button
              type="button"
              onClick={() => setMethod('card')}
              disabled={!cardFieldsEligible}
              className={`h-11 rounded-2xl text-sm font-semibold transition-colors disabled:opacity-40 ${
                method === 'card'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground'
              }`}
            >
              <span className="inline-flex items-center gap-1.5">
                <CreditCard size={14} />
                Card
              </span>
            </button>
          </div>
        </div>

        <div className={`${method === 'paypal' ? '' : 'hidden'} rounded-3xl border border-border bg-card p-4 shadow-sm`}>
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-3">Pay securely with PayPal</p>
          <p className="text-[11px] text-muted-foreground leading-snug mb-3">
            Pagamento com a carteira PayPal não usa a opção de salvar cartão digitado. O cartão ainda não fica armazenado
            em nossos servidores.
          </p>
          <div id="paypal-button-container" />
        </div>

        <div
          className={`${method === 'card' && cardFieldsEligible ? '' : 'hidden'} space-y-2 rounded-3xl border border-border bg-card p-3 shadow-sm`}
        >
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Card details</p>
          <p className="text-[11px] text-muted-foreground leading-snug">
            Os dados do cartão são processados pelo PayPal. Ainda não armazenamos o cartão: abaixo você só registra se
            deseja salvar para compras futuras quando ativarmos o vault.
          </p>
          <div id="card-name-field" className="rounded-xl bg-transparent min-h-12 overflow-hidden" />
          <div id="card-number-field" className="rounded-xl bg-transparent min-h-12 overflow-hidden" />
          <div className="grid grid-cols-2 gap-2">
            <div id="card-expiry-field" className="rounded-xl bg-transparent min-h-12 overflow-hidden" />
            <div id="card-cvv-field" className="rounded-xl bg-transparent min-h-12 overflow-hidden" />
          </div>
          <label className="flex gap-2.5 items-start text-[11px] text-muted-foreground cursor-pointer leading-snug pt-1">
            <input
              type="checkbox"
              checked={salvarCartaoEstePedido}
              onChange={(e) => setSalvarCartaoEstePedido(e.target.checked)}
              className="mt-0.5 rounded border-border shrink-0"
            />
            <span>Salvar este cartão para próximas compras (confirmo minha intenção neste pagamento).</span>
          </label>
          <button
            type="button"
            onClick={handleCardPayment}
            disabled={cardFieldsLoading}
            className="mt-1 w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground shadow-sm disabled:opacity-60"
          >
            {cardFieldsLoading ? 'Processing...' : 'Pay & Confirm'}
          </button>
        </div>

        {paypalError && <p className="text-xs text-red-500">{paypalError}</p>}
        {resultMessage && <p className="text-xs text-foreground">{resultMessage}</p>}
      </section>

    </main>
  )
}
