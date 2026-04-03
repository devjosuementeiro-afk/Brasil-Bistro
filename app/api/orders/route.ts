import { NextResponse } from 'next/server'
import { parseCustomerPayload } from '@/lib/checkout-customer'

const PAYPAL_API_BASE =
  process.env.PAYPAL_ENV === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com'

async function getPayPalAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('PAYPAL_CLIENT_ID/PAYPAL_CLIENT_SECRET nao configurados')
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
    cache: 'no-store',
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Falha ao obter access token PayPal: ${err}`)
  }

  const data = (await response.json()) as { access_token: string }
  return data.access_token
}

type OrderRequestBody = {
  customer?: unknown
  cart?: Array<{
    id: string
    name: string
    quantity: number
    unitAmount: number
    observation?: string
    selectedOptions?: Array<{
      optionId: string
      groupType: 'size' | 'quantity' | 'extra'
      groupName?: string
      label: string
      priceDelta: number
      info?: string | null
      /** Legado (antes de renomear para info) */
      detailInfo?: string | null
    }>
  }>
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as OrderRequestBody
    const parsedCustomer = parseCustomerPayload(body.customer)
    if (!parsedCustomer.ok) {
      return NextResponse.json({ error: parsedCustomer.message }, { status: 400 })
    }

    const safeItems = (body.cart ?? []).map((item) => ({
      id: item.id,
      name: item.name,
      quantity: Math.max(1, Number(item.quantity) || 1),
      unitAmount: Math.max(0, Number(item.unitAmount) || 0),
      observation: (item.observation ?? '').trim(),
      selectedOptions: (item.selectedOptions ?? []).map((opt) => ({
        optionId: String(opt.optionId),
        groupType: opt.groupType,
        groupName: opt.groupName,
        label: String(opt.label),
        priceDelta: Number(opt.priceDelta ?? 0),
        info: opt.info ?? opt.detailInfo ?? null,
      })),
    }))

    const total = safeItems.reduce(
      (acc, item) => acc + item.quantity * item.unitAmount,
      0
    )

    if (total <= 0 || safeItems.length === 0) {
      return NextResponse.json(
        { error: 'Carrinho invalido para checkout.' },
        { status: 400 }
      )
    }

    const accessToken = await getPayPalAccessToken()
    const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: 'USD',
              value: total.toFixed(2),
              breakdown: {
                item_total: {
                  currency_code: 'USD',
                  value: total.toFixed(2),
                },
              },
            },
            items: safeItems.map((item) => ({
              name: item.name,
              quantity: String(item.quantity),
              unit_amount: {
                currency_code: 'USD',
                value: item.unitAmount.toFixed(2),
              },
            })),
          },
        ],
      }),
      cache: 'no-store',
    })

    const data = await response.json()
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Erro ao criar order no PayPal',
      },
      { status: 500 }
    )
  }
}
