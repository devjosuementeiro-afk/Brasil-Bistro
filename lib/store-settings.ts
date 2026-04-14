import { createAdminClient } from '@/lib/supabase/admin'

type StoreSettingsRow = {
  taxa_entrega_padrao: number | null
}

export async function getDeliveryFeeAmount(): Promise<number> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('configuracoes_loja')
    .select('taxa_entrega_padrao')
    .order('atualizado_em', { ascending: false })
    .limit(1)
    .maybeSingle<StoreSettingsRow>()

  const fee = Number(data?.taxa_entrega_padrao ?? 0)
  if (!Number.isFinite(fee) || fee < 0) return 0
  return Number(fee.toFixed(2))
}
