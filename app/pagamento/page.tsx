'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCart, type SelectedOption } from '@/lib/cart-context'
import { useLang } from '@/lib/lang-context'
import { formatPromotionHints } from '@/lib/promo-hint-format'
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

function formatPaymentOptionLine(o: SelectedOption, currency: string): string {
  const label =
    o.groupType === 'extra' && o.groupName ? `${o.groupName}: ${o.label}` : o.label
  if (o.priceDelta != null && Math.abs(o.priceDelta) > 0.0001) {
    const sign = o.priceDelta > 0 ? '+' : ''
    return `${label} (${sign}${currency}${o.priceDelta.toFixed(2)})`
  }
  return label
}

export default function PagamentoPage() {
  const router = useRouter()
  const {
    items,
    totalItems,
    clearCart,
    promoCode,
    setPromoCode,
    promotionResult,
    promotionLoading,
    promotionError,
    subtotalBeforePromo,
    totalWithPromotion,
  } = useCart()
  const { t, lang } = useLang()
  const [promoDraft, setPromoDraft] = useState(promoCode)

  useEffect(() => {
    setPromoDraft(promoCode)
  }, [promoCode])
  const [checkoutCustomer, setCheckoutCustomer] = useState<CheckoutCustomer | null>(null)
  const [customerChecked, setCustomerChecked] = useState(false)
  const [sdkLoaded, setSdkLoaded] = useState(false)
  const [paypalError, setPaypalError] = useState<string | null>(null)
  const [resultMessage, setResultMessage] = useState('')
  const [cardFieldsEligible, setCardFieldsEligible] = useState(false)
  const [cardFieldsLoading, setCardFieldsLoading] = useState(false)
  const [method, setMethod] = useState<'paypal' | 'card'>('card')
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
      locale: lang === 'pt' ? 'pt_BR' : 'en_US',
    })
    return `${base}?${query.toString()}`
  }, [hasValidPayPalClientId, paypalClientId, paypalEnv, lang])

  useEffect(() => {
    setSdkLoaded(false)
  }, [lang])

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
        promoCode: promoCode.trim() || null,
        cart: items.map(({ item, quantity, observation, unitPrice, selectedOptions }) => ({
          id: item.id,
          name: item.nome,
          quantity,
          unitAmount: unitPrice,
          categoria_id: item.categoria_id,
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
        promoCode: promoCode.trim() || null,
        cart: items.map(({ item, quantity, observation, unitPrice, selectedOptions }) => ({
          id: item.id,
          name: item.nome,
          quantity,
          unitAmount: unitPrice,
          categoria_id: item.categoria_id,
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
  }, [
    sdkLoaded,
    items,
    clearCart,
    hasValidPayPalClientId,
    customerChecked,
    checkoutCustomer,
    lang,
    promoCode,
    totalWithPromotion,
  ])

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
        <p className="text-sm text-muted-foreground">{t.paymentCheckoutLoading}</p>
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
        <h1 className="text-2xl font-extrabold text-foreground">{t.paymentConfirmedTitle}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t.paymentConfirmedSubtitle}</p>
        <div className="mt-6 w-full max-w-xs rounded-2xl border border-border bg-card px-5 py-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{t.paymentOrderNumberLabel}</p>
          <p className="mt-1 text-2xl font-bold text-accent">#{successOrderNumber}</p>
        </div>
        <Link
          href="/"
          className="mt-6 w-full max-w-xs rounded-2xl bg-primary py-3.5 text-sm font-bold text-primary-foreground"
        >
          {t.paymentBackToMenu}
        </Link>
      </main>
    )
  }

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-background max-w-lg mx-auto px-4 pt-10">
        <Link href="/carrinho" className="text-sm font-semibold text-accent">
          {t.paymentBackToCart}
        </Link>
        <p className="mt-4 text-sm text-muted-foreground">{t.paymentEmptyCart}</p>
      </main>
    )
  }

  return (
    <main className="mx-auto min-h-screen max-w-lg bg-background pb-28">
      {!!paypalScriptSrc && (
        <Script
          key={`paypal-sdk-${lang}`}
          src={paypalScriptSrc}
          strategy="afterInteractive"
          onLoad={() => setSdkLoaded(true)}
        />
      )}

      <header className="sticky top-0 z-40 border-b border-border/90 bg-background/90 px-4 pb-3 backdrop-blur-md pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="flex items-center gap-3">
          <Link
            href="/checkout/dados"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-border bg-card shadow-sm transition-colors active:bg-secondary"
            aria-label={t.paymentHeaderBackAria}
          >
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-base font-bold text-foreground">{t.paymentTitle}</h1>
        </div>
      </header>

      <section className="px-4 pt-4 space-y-4">
        <div className="space-y-0.5 rounded-3xl border border-border bg-card p-3 text-xs text-muted-foreground shadow-sm">
          <p className="font-semibold text-foreground text-sm">{checkoutCustomer.nome}</p>
          <p>{checkoutCustomer.email}</p>
          <p>{checkoutCustomer.telefone}</p>
          <Link href="/checkout/dados" className="inline-block pt-1 font-medium text-accent">
            {t.paymentEditDetails}
          </Link>
        </div>

        <div className="rounded-3xl border border-border bg-card p-4 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {t.paymentOrderSummary}
          </p>
          {promotionResult && promotionResult.discountAmount > 0 && (
            <p className="mt-2 rounded-xl border border-primary/30 bg-primary/8 px-3 py-2 text-[11px] leading-snug text-foreground">
              {t.cartPromoStoreOff}
              {promotionResult.breakdown.length > 0
                ? ` (${promotionResult.breakdown.map((b) => b.label).join(', ')})`
                : ''}
            </p>
          )}
          {promotionResult &&
            promotionResult.discountAmount <= 0 &&
            formatPromotionHints(promotionResult.hints, lang, t.currency).map((line) => (
              <p key={line} className="mt-2 text-[11px] leading-snug text-muted-foreground">
                {line}
              </p>
            ))}
          {promotionResult?.codeInvalid && promoCode.trim() ? (
            <p className="mt-2 text-[11px] text-destructive">{t.cartPromoInvalid}</p>
          ) : null}
          {promotionError ? <p className="mt-2 text-[11px] text-destructive">{promotionError}</p> : null}
          <ul className="mt-3 divide-y divide-border/70 border-t border-border/70 pt-3">
            {items.map(
              ({
                cartItemId,
                item,
                quantity,
                unitPrice,
                totalPrice: lineTotal,
                observation,
                selectedOptions,
              }) => (
                <li key={cartItemId} className="py-3 first:pt-0">
                  <p className="font-serif text-sm font-semibold leading-snug text-foreground">{item.nome}</p>
                  {selectedOptions.length > 0 && (
                    <ul className="mt-2 space-y-1 border-l-2 border-primary/20 pl-2.5">
                      {selectedOptions.map((opt) => (
                        <li key={`${cartItemId}-${opt.optionId}`} className="text-[11px] leading-snug text-muted-foreground">
                          {formatPaymentOptionLine(opt, t.currency)}
                        </li>
                      ))}
                    </ul>
                  )}
                  {observation.trim() ? (
                    <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
                      <span className="font-medium text-foreground/80">{t.paymentObsLabel}</span> {observation.trim()}
                    </p>
                  ) : null}
                  <div className="mt-2.5 flex items-baseline justify-between gap-3 tabular-nums">
                    <span className="text-[11px] text-muted-foreground">
                      {quantity} × {t.currency}
                      {unitPrice.toFixed(2)}
                    </span>
                    <span className="text-sm font-semibold text-foreground">
                      {t.currency}
                      {lineTotal.toFixed(2)}
                    </span>
                  </div>
                </li>
              )
            )}
          </ul>
          <div className="mt-3 flex justify-between border-t border-border/80 pt-3 text-xs text-muted-foreground">
            <span>
              {totalItems} {totalItems === 1 ? t.item : t.items}
            </span>
            {promotionLoading ? <span className="opacity-60">…</span> : null}
          </div>
          <div className="mt-1 flex justify-between text-xs text-muted-foreground">
            <span>{t.paymentSubtotal}</span>
            <span className="tabular-nums">
              {t.currency}
              {subtotalBeforePromo.toFixed(2)}
            </span>
          </div>
          {promotionResult && promotionResult.discountAmount > 0 ? (
            <div className="flex justify-between text-xs font-medium text-primary">
              <span>{t.paymentDiscount}</span>
              <span className="tabular-nums">
                −{t.currency}
                {promotionResult.discountAmount.toFixed(2)}
              </span>
            </div>
          ) : null}
          <div className="flex justify-between pt-1 font-bold text-xl">
            <span>{t.total}</span>
            <span className="text-accent tabular-nums">
              {t.currency}
              {totalWithPromotion.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-3 shadow-sm">
          <label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {t.paymentPromoCodeLabel}
          </label>
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              value={promoDraft}
              onChange={(e) => setPromoDraft(e.target.value)}
              className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm"
              autoCapitalize="characters"
              autoCorrect="off"
            />
            <button
              type="button"
              onClick={() => setPromoCode(promoDraft.trim())}
              className="shrink-0 rounded-xl bg-secondary px-3 py-2 text-xs font-semibold text-secondary-foreground"
            >
              {t.cartPromoApply}
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-2 shadow-sm">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMethod('card')}
              className={`h-11 rounded-2xl text-sm font-semibold transition-colors ${
                method === 'card'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground'
              }`}
            >
              <span className="inline-flex items-center gap-1.5">
                <CreditCard size={14} />
                {t.paymentMethodCard}
              </span>
            </button>
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
                {t.paymentMethodPayPal}
              </span>
            </button>
          </div>
        </div>

        <div className={`${method === 'card' ? '' : 'hidden'} space-y-2 rounded-3xl border border-border bg-card p-3 shadow-sm`}>
          {!sdkLoaded && (
            <p className="py-6 text-center text-sm text-muted-foreground">{t.paymentCardLoading}</p>
          )}
          {sdkLoaded && !cardFieldsEligible && (
            <p className="py-4 text-center text-sm leading-snug text-muted-foreground">{t.paymentCardUnavailable}</p>
          )}
          <div className={cardFieldsEligible ? 'space-y-2' : 'hidden'}>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{t.paymentCardDetailsTitle}</p>
            <p className="text-[11px] leading-snug text-muted-foreground">{t.paymentCardIntro}</p>
            <div id="card-name-field" className="min-h-12 overflow-hidden rounded-xl bg-transparent" />
            <div id="card-number-field" className="min-h-12 overflow-hidden rounded-xl bg-transparent" />
            <div className="grid grid-cols-2 gap-2">
              <div id="card-expiry-field" className="min-h-12 overflow-hidden rounded-xl bg-transparent" />
              <div id="card-cvv-field" className="min-h-12 overflow-hidden rounded-xl bg-transparent" />
            </div>
            <label className="flex cursor-pointer items-start gap-2.5 pt-1 text-[11px] leading-snug text-muted-foreground">
              <input
                type="checkbox"
                checked={salvarCartaoEstePedido}
                onChange={(e) => setSalvarCartaoEstePedido(e.target.checked)}
                className="mt-0.5 shrink-0 rounded border-border"
              />
              <span>{t.paymentSaveCardCheckbox}</span>
            </label>
            <button
              type="button"
              onClick={handleCardPayment}
              disabled={cardFieldsLoading}
              className="mt-1 w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground shadow-sm disabled:opacity-60"
            >
              {cardFieldsLoading ? t.paymentProcessing : t.paymentPayConfirm}
            </button>
          </div>
        </div>

        <div className={`${method === 'paypal' ? '' : 'hidden'} rounded-3xl border border-border bg-card p-4 shadow-sm`}>
          <p className="mb-3 text-xs uppercase tracking-wide text-muted-foreground">{t.paymentPaypalSecureTitle}</p>
          <p className="mb-3 text-[11px] leading-snug text-muted-foreground">{t.paymentPaypalIntro}</p>
          <div id="paypal-button-container" />
        </div>

        {paypalError && <p className="text-xs text-red-500">{paypalError}</p>}
        {resultMessage && <p className="text-xs text-foreground">{resultMessage}</p>}
      </section>

    </main>
  )
}
