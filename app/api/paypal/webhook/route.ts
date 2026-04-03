import { NextResponse } from 'next/server'

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

type VerifySignatureResponse = {
  verification_status?: 'SUCCESS' | 'FAILURE'
}

type ProcessedEventStatus = 'paid' | 'denied' | 'refunded' | 'reversed'

export async function POST(request: Request) {
  try {
    const webhookId = process.env.PAYPAL_WEBHOOK_ID
    if (!webhookId) {
      return NextResponse.json(
        { error: 'PAYPAL_WEBHOOK_ID nao configurado.' },
        { status: 500 }
      )
    }

    const event = await request.json()

    const transmissionId = request.headers.get('paypal-transmission-id')
    const transmissionTime = request.headers.get('paypal-transmission-time')
    const transmissionSig = request.headers.get('paypal-transmission-sig')
    const certUrl = request.headers.get('paypal-cert-url')
    const authAlgo = request.headers.get('paypal-auth-algo')

    if (
      !transmissionId ||
      !transmissionTime ||
      !transmissionSig ||
      !certUrl ||
      !authAlgo
    ) {
      return NextResponse.json(
        { error: 'Headers de webhook PayPal ausentes.' },
        { status: 400 }
      )
    }

    const accessToken = await getPayPalAccessToken()

    const verifyResponse = await fetch(
      `${PAYPAL_API_BASE}/v1/notifications/verify-webhook-signature`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          auth_algo: authAlgo,
          cert_url: certUrl,
          transmission_id: transmissionId,
          transmission_sig: transmissionSig,
          transmission_time: transmissionTime,
          webhook_id: webhookId,
          webhook_event: event,
        }),
        cache: 'no-store',
      }
    )

    if (!verifyResponse.ok) {
      const err = await verifyResponse.text()
      return NextResponse.json(
        { error: `Falha ao verificar assinatura PayPal: ${err}` },
        { status: 400 }
      )
    }

    const verifyData = (await verifyResponse.json()) as VerifySignatureResponse
    if (verifyData.verification_status !== 'SUCCESS') {
      return NextResponse.json(
        { error: 'Assinatura de webhook invalida.' },
        { status: 400 }
      )
    }

    const eventType = String(event?.event_type ?? '')
    const captureId = event?.resource?.id ?? null
    const orderId =
      event?.resource?.supplementary_data?.related_ids?.order_id ?? null

    let processedStatus: ProcessedEventStatus | null = null

    // TODO: persistir pedido/captura no banco e disparar impressao PrintNode.
    // Mantemos tratamento explicito dos 4 eventos de captura.
    switch (eventType) {
      case 'PAYMENT.CAPTURE.COMPLETED':
        processedStatus = 'paid'
        break
      case 'PAYMENT.CAPTURE.DENIED':
        processedStatus = 'denied'
        break
      case 'PAYMENT.CAPTURE.REFUNDED':
        processedStatus = 'refunded'
        break
      case 'PAYMENT.CAPTURE.REVERSED':
        processedStatus = 'reversed'
        break
      default:
        return NextResponse.json({
          received: true,
          ignored: true,
          eventType,
        })
    }

    console.log(`PayPal webhook: ${eventType}`, {
      id: event?.id,
      captureId,
      orderId,
      processedStatus,
    })

    return NextResponse.json({
      received: true,
      ignored: false,
      eventType,
      processedStatus,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Erro no webhook do PayPal',
      },
      { status: 500 }
    )
  }
}
