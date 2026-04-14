import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

type Row = {
  id: string
  nome: string
  nome_exibicao: string | null
  imagem_banner_url: string | null
  banner_ordem: number | null
  ativo: boolean
  validade_inicio: string | null
  validade_fim: string | null
  criado_em: string
}

function isPromoActiveRow(p: Row, now: Date): boolean {
  if (!p.ativo) return false
  const t = now.getTime()
  if (p.validade_inicio) {
    const s = new Date(p.validade_inicio).getTime()
    if (!Number.isNaN(s) && t < s) return false
  }
  if (p.validade_fim) {
    const e = new Date(p.validade_fim).getTime()
    if (!Number.isNaN(e) && t > e) return false
  }
  return true
}

export type PromoBannerSlide = {
  id: string
  title: string
  imageUrl: string
}

export async function GET() {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('promocoes')
      .select(
        'id, nome, nome_exibicao, imagem_banner_url, banner_ordem, ativo, validade_inicio, validade_fim, criado_em'
      )

    if (error) {
      return NextResponse.json({ error: error.message, slides: [] }, { status: 500 })
    }

    const now = new Date()
    const slides: PromoBannerSlide[] = (data as Row[] | null)
      ?.filter(
        (p) =>
          isPromoActiveRow(p, now) &&
          typeof p.imagem_banner_url === 'string' &&
          p.imagem_banner_url.trim().length > 0
      )
      .sort((a, b) => {
        const oa = Number(a.banner_ordem ?? 0)
        const ob = Number(b.banner_ordem ?? 0)
        if (oa !== ob) return oa - ob
        return new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime()
      })
      .map((p) => ({
        id: p.id,
        title: (p.nome_exibicao?.trim() || p.nome).trim() || 'Promoção',
        imageUrl: p.imagem_banner_url!.trim(),
      })) ?? []

    return NextResponse.json({ slides })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Erro ao carregar banners.', slides: [] },
      { status: 500 }
    )
  }
}
