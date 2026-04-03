import { NextResponse } from 'next/server'

const PAYPAL_API_BASE =
  process.env.PAYPAL_ENV === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com'

async function getPayPalAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('PAYPAL_CLIENT_ID/PAYPAL_CLIENT_SECRET não configurados')
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

type CreateOrderBody = {
  currencyCode?: string
  total?: number
  items?: Array<{
    id: string
    name: string
    quantity: number
    unitAmount: number
  }>
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateOrderBody

    const currencyCode = body.currencyCode ?? 'USD'
    const safeItems = (body.items ?? []).map((item) => ({
      ...item,
      quantity: Math.max(1, Number(item.quantity) || 1),
      unitAmount: Math.max(0, Number(item.unitAmount) || 0),
    }))

    // Recalcula total no servidor para evitar confiar no valor do navegador.
    const total = safeItems.reduce(
      (acc, item) => acc + item.quantity * item.unitAmount,
      0
    )

    if (total <= 0) {
      return NextResponse.json(
        { error: 'Pedido inválido. Total deve ser maior que zero.' },
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
              currency_code: currencyCode,
              value: total.toFixed(2),
              breakdown: {
                item_total: {
                  currency_code: currencyCode,
                  value: total.toFixed(2),
                },
              },
            },
            items: safeItems.map((item) => ({
              name: item.name,
              quantity: String(item.quantity),
              unit_amount: {
                currency_code: currencyCode,
                value: item.unitAmount.toFixed(2),
              },
            })),
          },
        ],
      }),
      cache: 'no-store',
    })

    if (!response.ok) {
      const err = await response.text()
      return NextResponse.json(
        { error: `PayPal create order failed: ${err}` },
        { status: 500 }
      )
    }

    const data = (await response.json()) as { id: string }
    return NextResponse.json({ id: data.id })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Erro ao criar pedido PayPal',
      },
      { status: 500 }
    )
  }
}
