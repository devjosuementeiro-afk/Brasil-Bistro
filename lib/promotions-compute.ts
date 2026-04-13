/** Tipos alinhados à tabela `promocoes` (Supabase). */

export type PromocaoTipo = 'subtotal_minimo_percentual' | 'codigo_promocional' | 'categoria_percentual'

export type PromocaoRow = {
  id: string
  nome: string
  /** Se preenchido, texto mostrado ao cliente; senão usa `nome`. */
  nome_exibicao?: string | null
  tipo: PromocaoTipo
  ativo: boolean
  percentual_desconto: number
  valor_minimo_subtotal: number | null
  codigo: string | null
  categoria_id: string | null
  validade_inicio: string | null
  validade_fim: string | null
}

export function promoCustomerLabel(p: Pick<PromocaoRow, 'nome' | 'nome_exibicao'>): string {
  const ex = p.nome_exibicao?.trim()
  return (ex && ex.length > 0 ? ex : p.nome).trim() || 'Promotion'
}

export type CartLineForPromo = {
  itemId: string
  categoriaId: string | null
  lineTotal: number
}

export type PromotionComputeResult = {
  subtotal: number
  discountAmount: number
  totalPayable: number
  breakdown: { label: string; amount: number }[]
  /** Mensagens quando o cliente ainda não qualifica (ex.: falta valor para pedido mínimo). */
  hints: string[]
  /** Código enviado existe mas não há promo ativa correspondente. */
  codeInvalid: boolean
}

export function roundMoney(n: number): number {
  return Math.round(n * 100) / 100
}

function isPromoActiveNow(p: PromocaoRow, now: Date): boolean {
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

function normalizeCode(s: string) {
  return s.trim().toUpperCase().replace(/\s+/g, '')
}

/**
 * Regras:
 * - Código promocional válido: aplica só o desconto desse código sobre o subtotal.
 * - Sem código (ou código inválido): usa o melhor entre (a) pedido mínimo → % no subtotal inteiro e (b) soma dos % por linha nas categorias elegíveis.
 */
export function computePromotionDiscount(
  lines: CartLineForPromo[],
  promocoes: PromocaoRow[],
  promoCodeInput: string | null | undefined,
  now = new Date()
): PromotionComputeResult {
  const subtotal = roundMoney(lines.reduce((a, l) => a + l.lineTotal, 0))
  const codeNorm = normalizeCode(promoCodeInput ?? '')
  const active = promocoes.filter((p) => isPromoActiveNow(p, now))

  if (subtotal <= 0) {
    return {
      subtotal: 0,
      discountAmount: 0,
      totalPayable: 0,
      breakdown: [],
      hints: [],
      codeInvalid: Boolean(codeNorm),
    }
  }

  const subMinPromos = active.filter(
    (p) =>
      p.tipo === 'subtotal_minimo_percentual' &&
      p.valor_minimo_subtotal != null &&
      Number(p.valor_minimo_subtotal) > 0
  )

  let subMinDiscount = 0
  let subMinLabel = ''
  const qualifyingSubMin = subMinPromos.filter((p) => subtotal >= Number(p.valor_minimo_subtotal))
  if (qualifyingSubMin.length) {
    const best = qualifyingSubMin.reduce((a, b) =>
      Number(b.percentual_desconto) > Number(a.percentual_desconto) ? b : a
    )
    subMinDiscount = roundMoney((subtotal * Number(best.percentual_desconto)) / 100)
    subMinLabel = promoCustomerLabel(best)
  }

  const catPromos = active.filter((p) => p.tipo === 'categoria_percentual' && p.categoria_id)
  let catDiscount = 0
  const catLabels: string[] = []
  for (const line of lines) {
    if (!line.categoriaId) continue
    const match = catPromos.filter((p) => p.categoria_id === line.categoriaId)
    if (!match.length) continue
    const best = match.reduce((a, b) =>
      Number(b.percentual_desconto) > Number(a.percentual_desconto) ? b : a
    )
    const d = roundMoney((line.lineTotal * Number(best.percentual_desconto)) / 100)
    catDiscount += d
    if (d > 0) catLabels.push(promoCustomerLabel(best))
  }
  catDiscount = roundMoney(catDiscount)

  let codeDiscount = 0
  let codeLabel = ''
  let codeMatched = false
  const codeMinHints: string[] = []
  if (codeNorm) {
    const codePromo = active.find(
      (p) =>
        p.tipo === 'codigo_promocional' &&
        p.codigo &&
        normalizeCode(p.codigo) === codeNorm
    )
    if (codePromo) {
      codeMatched = true
      const minCode =
        codePromo.valor_minimo_subtotal != null ? Number(codePromo.valor_minimo_subtotal) : 0
      if (minCode > 0 && subtotal < minCode) {
        const need = roundMoney(minCode - subtotal)
        codeMinHints.push(
          `PROMO_HINT_CODE_MIN|${need.toFixed(2)}|${minCode.toFixed(2)}|${Number(codePromo.percentual_desconto)}`
        )
        codeDiscount = 0
      } else {
        codeDiscount = roundMoney((subtotal * Number(codePromo.percentual_desconto)) / 100)
        codeLabel = promoCustomerLabel(codePromo)
      }
    }
  }

  const breakdown: { label: string; amount: number }[] = []
  let discountAmount = 0

  if (codeNorm) {
    if (codeMatched && codeDiscount > 0) {
      discountAmount = codeDiscount
      breakdown.push({ label: codeLabel || 'Promo code', amount: codeDiscount })
    } else {
      discountAmount = 0
    }
  } else if (subMinDiscount >= catDiscount) {
    discountAmount = subMinDiscount
    if (subMinDiscount > 0) breakdown.push({ label: subMinLabel || 'Minimum order', amount: subMinDiscount })
  } else {
    discountAmount = catDiscount
    if (catDiscount > 0) {
      breakdown.push({
        label: [...new Set(catLabels)].join(', ') || 'Category',
        amount: catDiscount,
      })
    }
  }

  discountAmount = roundMoney(Math.min(discountAmount, Math.max(0, subtotal - 0.01)))
  const totalPayable = roundMoney(subtotal - discountAmount)

  const hints: string[] = [...codeMinHints]
  if (!codeNorm) {
    for (const p of subMinPromos) {
      const min = Number(p.valor_minimo_subtotal)
      if (subtotal < min) {
        const need = roundMoney(min - subtotal)
        hints.push(
          `PROMO_HINT_MIN|${need.toFixed(2)}|${min.toFixed(2)}|${Number(p.percentual_desconto)}`
        )
      }
    }
  }

  return {
    subtotal,
    discountAmount,
    totalPayable,
    breakdown,
    hints,
    codeInvalid: Boolean(codeNorm) && !codeMatched,
  }
}

export function cartItemsToPromoLines(
  items: Array<{ item: { id: string; categoria_id: string | null }; totalPrice: number }>
): CartLineForPromo[] {
  return items.map((ci) => ({
    itemId: ci.item.id,
    categoriaId: ci.item.categoria_id,
    lineTotal: roundMoney(ci.totalPrice),
  }))
}
