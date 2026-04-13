import { createAdminClient } from '@/lib/supabase/admin'
import {
  computePromotionDiscount,
  roundMoney,
  type CartLineForPromo,
  type PromocaoRow,
  type PromotionComputeResult,
} from '@/lib/promotions-compute'

export type OrderCartLineInput = {
  id: string
  quantity: number
  unitAmount: number
  categoria_id?: string | null
}

export async function computePromotionForOrderCart(
  cart: OrderCartLineInput[],
  promoCode: string | null | undefined
): Promise<PromotionComputeResult> {
  const lines: CartLineForPromo[] = cart.map((row) => ({
    itemId: row.id,
    categoriaId: row.categoria_id ?? null,
    lineTotal: roundMoney(row.quantity * row.unitAmount),
  }))

  const supabase = createAdminClient()
  const { data: promocoes, error } = await supabase.from('promocoes').select('*')
  if (error) {
    throw new Error(error.message)
  }

  return computePromotionDiscount(lines, (promocoes ?? []) as PromocaoRow[], promoCode ?? null)
}
