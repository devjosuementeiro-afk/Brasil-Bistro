import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { parseCustomerPayload } from '@/lib/checkout-customer'
import { getDeliveryFeeAmount } from '@/lib/store-settings'
import { computePromotionForOrderCart } from '@/lib/order-promotions'

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

type CaptureBody = {
  customer?: unknown
  promoCode?: string | null
  cart?: Array<{
    id: string
    combo_id?: string | null
    name: string
    quantity: number
    unitAmount: number
    categoria_id?: string | null
    observation?: string
    selectedOptions?: Array<{
      optionId: string
      groupType: 'size' | 'quantity' | 'extra'
      groupName?: string
      label: string
      priceDelta: number
      info?: string | null
      detailInfo?: string | null
    }>
  }>
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orderID: string }> }
) {
  try {
    const { orderID } = await params
    if (!orderID) {
      return NextResponse.json({ error: 'orderID ausente' }, { status: 400 })
    }

    const body = (await request.json().catch(() => ({}))) as CaptureBody
    const parsedCustomer = parseCustomerPayload(body.customer)
    if (!parsedCustomer.ok) {
      return NextResponse.json({ error: parsedCustomer.message }, { status: 400 })
    }
    const { customer } = parsedCustomer

    const safeItems = (body.cart ?? []).map((item) => ({
      id: item.id,
      combo_id: item.combo_id ?? null,
      name: item.name,
      quantity: Math.max(1, Number(item.quantity) || 1),
      unitAmount: Math.max(0, Number(item.unitAmount) || 0),
      categoria_id: item.categoria_id ?? null,
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
    const promo = await computePromotionForOrderCart(
      safeItems.map((i) => ({
        id: i.id,
        quantity: i.quantity,
        unitAmount: i.unitAmount,
        categoria_id: i.categoria_id,
      })),
      body.promoCode ?? null
    )
    const rawDeliveryFee = customer.fulfillmentType === 'delivery' ? await getDeliveryFeeAmount() : 0
    const deliveryFee = customer.fulfillmentType === 'delivery' && promo.deliveryFreeEligible ? 0 : rawDeliveryFee

    const accessToken = await getPayPalAccessToken()

    const response = await fetch(
      `${PAYPAL_API_BASE}/v2/checkout/orders/${orderID}/capture`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      }
    )

    const data = (await response.json()) as Record<string, unknown> & {
      status?: string
      purchase_units?: Array<{
        amount?: { currency_code?: string; value?: string }
        payments?: {
          captures?: Array<{
            status?: string
            id?: string
            amount?: { value?: string; currency_code?: string }
            seller_receivable_breakdown?: {
              gross_amount?: { value?: number }
              paypal_fee?: { value?: number }
              net_amount?: { value?: number }
            }
          }>
          authorizations?: Array<{ status?: string; id?: string }>
        }
      }>
      details?: unknown
      debug_id?: string
      message?: string
    }
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    const orderStatus = String(data?.status ?? '')
    const capture =
      data?.purchase_units?.[0]?.payments?.captures?.[0] ??
      data?.purchase_units?.[0]?.payments?.authorizations?.[0]
    const captureStatus = String(capture?.status ?? '')

    // HTTP 201/200 não garante pagamento aprovado — cartão recusado pode vir com status != COMPLETED.
    if (orderStatus && orderStatus !== 'COMPLETED') {
      return NextResponse.json(
        {
          error: 'Pedido PayPal nao foi concluido.',
          order_status: orderStatus,
          details: data?.details ?? null,
          debug_id: data?.debug_id ?? null,
          message: data?.message,
        },
        { status: 422 }
      )
    }

    if (captureStatus !== 'COMPLETED' || !capture?.id) {
      return NextResponse.json(
        {
          error: 'Pagamento nao capturado com sucesso.',
          capture_status: captureStatus || 'AUSENTE',
          details: data?.details ?? null,
          debug_id: data?.debug_id ?? null,
          message: data?.message,
        },
        { status: 422 }
      )
    }
    const captureId = String(capture?.id ?? '')
    const currencyCode = String(
      capture?.amount?.currency_code ??
      data?.purchase_units?.[0]?.amount?.currency_code ??
      'USD'
    )
    const totalValue = Number(
      capture?.amount?.value ??
      data?.purchase_units?.[0]?.amount?.value ??
      0
    )
    const grossAmount = Number(
      capture?.seller_receivable_breakdown?.gross_amount?.value ?? totalValue
    )
    const paypalFee = Number(
      capture?.seller_receivable_breakdown?.paypal_fee?.value ?? 0
    )
    const netAmount = Number(
      capture?.seller_receivable_breakdown?.net_amount?.value ??
      Math.max(0, grossAmount - paypalFee)
    )

    let localOrderId: string | null = null

    {
      const supabase = createAdminClient()

      const { data: existingOrder } = await supabase
        .from('pedidos')
        .select('id')
        .eq('paypal_order_id', orderID)
        .maybeSingle()

      localOrderId = existingOrder?.id ?? null
      if (!localOrderId) {
        const { data: insertedOrder, error: insertOrderError } = await supabase
          .from('pedidos')
          .insert({
            paypal_order_id: orderID,
            paypal_capture_id: captureId || null,
            status_pagamento: 'paid',
            status_producao: 'new',
            valor_total: totalValue,
            moeda: currencyCode,
            valor_pago: totalValue,
            valor_bruto: grossAmount,
            taxa_paypal: paypalFee,
            valor_liquido: netAmount,
            taxa_entrega: deliveryFee,
            origem_pagamento: 'paypal',
            cliente_nome: customer.nome,
            cliente_email: customer.email,
            cliente_telefone: customer.telefone,
            cliente_user_id: customer.userId,
            tipo_atendimento: customer.fulfillmentType,
            endereco_entrega: customer.enderecoEntrega,
            cliente_aceita_sms_atualizacoes: customer.aceitaSmsAtualizacoes,
            cliente_aceita_email_atualizacoes: customer.aceitaEmailAtualizacoes,
            cliente_consentiu_salvar_cartao: customer.consentiuSalvarCartao,
            payload_pagamento: data,
          })
          .select('id')
          .single()

        if (insertOrderError) {
          throw insertOrderError
        }

        localOrderId = insertedOrder?.id ?? null

        if (localOrderId && safeItems.length > 0) {
          const { error: insertItemsError } = await supabase
            .from('pedido_itens')
            .insert(
              safeItems.map((item) => ({
                pedido_id: localOrderId,
                item_id: item.combo_id ? null : item.id,
                combo_id: item.combo_id ?? null,
                nome_item: item.name,
                quantidade: item.quantity,
                preco_unitario: item.unitAmount,
                subtotal: Number((item.quantity * item.unitAmount).toFixed(2)),
                observacao: item.observation || null,
                opcoes_selecionadas: item.selectedOptions?.length
                  ? item.selectedOptions
                  : null,
              }))
            )

          if (insertItemsError) {
            throw insertItemsError
          }
        }
      }
    }

    const orderNumber = localOrderId
      ? localOrderId.replace(/-/g, '').slice(-8).toUpperCase()
      : null

    return NextResponse.json(
      {
        ...data,
        local_order_id: localOrderId,
        order_number: orderNumber,
      },
      { status: response.status }
    )
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Erro ao capturar pagamento no PayPal',
      },
      { status: 500 }
    )
  }
}
