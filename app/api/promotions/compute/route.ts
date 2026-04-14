import { NextResponse } from 'next/server'
import { computePromotionForOrderCart } from '@/lib/order-promotions'

type Body = {
  items?: Array<{
    item?: { id?: string; categoria_id?: string | null }
    quantity?: number
    unitPrice?: number
    totalPrice?: number
  }>
  promoCode?: string | null
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as Body
    const raw = body.items ?? []
    const cart = raw
      .map((row) => {
        const id = row.item?.id
        if (typeof id !== 'string') return null
        const lineTotal = Number(row.totalPrice)
        if (!Number.isFinite(lineTotal) || lineTotal <= 0) return null
        return {
          id,
          quantity: Math.max(1, Math.floor(Number(row.quantity) || 1)),
          unitAmount:
            Number.isFinite(Number(row.unitPrice)) && Number(row.unitPrice) > 0
              ? Number(row.unitPrice)
              : lineTotal / Math.max(1, Math.floor(Number(row.quantity) || 1)),
          categoria_id: row.item?.categoria_id ?? null,
        }
      })
      .filter((x): x is NonNullable<typeof x> => x != null)

    const result = await computePromotionForOrderCart(cart, body.promoCode ?? null)
    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Erro ao calcular promoções.' },
      { status: 500 }
    )
  }
}
