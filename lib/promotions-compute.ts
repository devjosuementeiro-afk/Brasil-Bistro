/** Tipos alinhados à tabela `promocoes` (Supabase). */

export type PromocaoTipo =
  | 'subtotal_minimo_percentual'
  | 'codigo_promocional'
  | 'categoria_percentual'
  | 'delivery_gratis_subtotal_minimo'
  | 'compre_x_ganhe_y'

export type PromocaoRow = {
  id: string
  nome: string
  /** Se preenchido, texto mostrado ao cliente; senão usa `nome`. */
  nome_exibicao?: string | null
  imagem_banner_url?: string | null
  banner_ordem?: number | null
  tipo: PromocaoTipo
  ativo: boolean
  percentual_desconto: number
  valor_minimo_subtotal: number | null
  codigo: string | null
  categoria_id: string | null
  validade_inicio: string | null
  validade_fim: string | null
  /** Tipo código: categorias elegíveis (OR com cupom_item_ids). Vazio/null = sem filtro. */
  cupom_categoria_ids?: string[] | null
  /** Tipo código: IDs de itens_cardapio elegíveis. Vazio/null = sem filtro. */
  cupom_item_ids?: string[] | null
  /** Tipo compre_x_ganhe_y: item gatilho. */
  compre_x_item_id?: string | null
  /** Tipo compre_x_ganhe_y: quantidade mínima do item gatilho. */
  compre_x_qtd?: number | null
  /** Tipo compre_x_ganhe_y: item grátis. */
  ganhe_item_id?: string | null
  /** Tipo compre_x_ganhe_y: quantidade grátis por ciclo. */
  ganhe_qtd?: number | null
}

export function promoCustomerLabel(p: Pick<PromocaoRow, 'nome' | 'nome_exibicao'>): string {
  const ex = p.nome_exibicao?.trim()
  return (ex && ex.length > 0 ? ex : p.nome).trim() || 'Promotion'
}

export type CartLineForPromo = {
  itemId: string
  categoriaId: string | null
  quantity: number
  unitAmount: number
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
  /** Verdadeiro quando há promoção ativa de frete grátis já elegível no subtotal. */
  deliveryFreeEligible: boolean
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

function normalizeUuidArray(v: unknown): string[] {
  if (v == null) return []
  if (!Array.isArray(v)) return []
  return v.filter((x): x is string => typeof x === 'string' && x.length > 0)
}

export function couponHasProductRestrictions(p: Pick<PromocaoRow, 'cupom_categoria_ids' | 'cupom_item_ids'>): boolean {
  return normalizeUuidArray(p.cupom_categoria_ids).length > 0 || normalizeUuidArray(p.cupom_item_ids).length > 0
}

/** Soma dos subtotais das linhas que o cupom pode abater. Sem restrição = subtotal total. */
export function eligibleSubtotalForCoupon(lines: CartLineForPromo[], p: PromocaoRow): number {
  const catIds = new Set(normalizeUuidArray(p.cupom_categoria_ids))
  const itemIds = new Set(normalizeUuidArray(p.cupom_item_ids))
  const hasCat = catIds.size > 0
  const hasItem = itemIds.size > 0
  if (!hasCat && !hasItem) {
    return roundMoney(lines.reduce((a, l) => a + l.lineTotal, 0))
  }
  let sum = 0
  for (const line of lines) {
    const catOk = hasCat && line.categoriaId != null && catIds.has(line.categoriaId)
    const itemOk = hasItem && itemIds.has(line.itemId)
    const ok =
      hasCat && hasItem ? catOk || itemOk : hasCat ? catOk : hasItem ? itemOk : false
    if (ok) sum += line.lineTotal
  }
  return roundMoney(sum)
}

/**
 * Regras:
 * - Código promocional válido: % sobre o subtotal (ou só sobre linhas elegíveis se houver cupom_categoria_ids / cupom_item_ids).
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
      deliveryFreeEligible: false,
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

  const buyXGetYPromos = active.filter(
    (p) =>
      p.tipo === 'compre_x_ganhe_y' &&
      p.compre_x_item_id &&
      Number(p.compre_x_qtd ?? 0) > 0 &&
      p.ganhe_item_id &&
      Number(p.ganhe_qtd ?? 0) > 0
  )
  let buyXGetYDiscount = 0
  const buyXGetYLabels: string[] = []
  for (const promo of buyXGetYPromos) {
    const triggerId = String(promo.compre_x_item_id)
    const giftId = String(promo.ganhe_item_id)
    const triggerQty = lines
      .filter((l) => l.itemId === triggerId)
      .reduce((acc, l) => acc + Math.max(0, Math.floor(l.quantity)), 0)
    const buyQty = Math.max(1, Math.floor(Number(promo.compre_x_qtd)))
    const giftQtyPerCycle = Math.max(1, Math.floor(Number(promo.ganhe_qtd)))
    const cycles = Math.floor(triggerQty / buyQty)
    if (cycles <= 0) continue
    let freeQtyRemaining = cycles * giftQtyPerCycle
    const giftLines = lines.filter((l) => l.itemId === giftId)
    for (const giftLine of giftLines) {
      if (freeQtyRemaining <= 0) break
      const lineQty = Math.max(0, Math.floor(giftLine.quantity))
      const freeQtyOnLine = Math.min(lineQty, freeQtyRemaining)
      if (freeQtyOnLine <= 0) continue
      buyXGetYDiscount += roundMoney(freeQtyOnLine * giftLine.unitAmount)
      freeQtyRemaining -= freeQtyOnLine
    }
    if (freeQtyRemaining < cycles * giftQtyPerCycle) {
      buyXGetYLabels.push(promoCustomerLabel(promo))
    }
  }
  buyXGetYDiscount = roundMoney(buyXGetYDiscount)

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
      const restricted = couponHasProductRestrictions(codePromo)
      const eligibleSubtotal = restricted
        ? eligibleSubtotalForCoupon(lines, codePromo)
        : subtotal

      if (restricted && eligibleSubtotal <= 0) {
        codeMinHints.push('PROMO_HINT_CODE_NO_ELIGIBLE')
        codeDiscount = 0
      } else {
        const minCode =
          codePromo.valor_minimo_subtotal != null ? Number(codePromo.valor_minimo_subtotal) : 0
        const basisForMin = restricted ? eligibleSubtotal : subtotal
        if (minCode > 0 && basisForMin < minCode) {
          const need = roundMoney(minCode - basisForMin)
          codeMinHints.push(
            `PROMO_HINT_CODE_MIN|${need.toFixed(2)}|${minCode.toFixed(2)}|${Number(codePromo.percentual_desconto)}`
          )
          codeDiscount = 0
        } else {
          const discountBase = restricted ? eligibleSubtotal : subtotal
          codeDiscount = roundMoney((discountBase * Number(codePromo.percentual_desconto)) / 100)
          codeLabel = promoCustomerLabel(codePromo)
        }
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
  } else if (subMinDiscount >= catDiscount && subMinDiscount >= buyXGetYDiscount) {
    discountAmount = subMinDiscount
    if (subMinDiscount > 0) breakdown.push({ label: subMinLabel || 'Minimum order', amount: subMinDiscount })
  } else if (buyXGetYDiscount >= catDiscount) {
    discountAmount = buyXGetYDiscount
    if (buyXGetYDiscount > 0) {
      breakdown.push({
        label: [...new Set(buyXGetYLabels)].join(', ') || 'Buy X get Y',
        amount: buyXGetYDiscount,
      })
    }
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
  const deliveryFreePromos = active.filter(
    (p) =>
      p.tipo === 'delivery_gratis_subtotal_minimo' &&
      p.valor_minimo_subtotal != null &&
      Number(p.valor_minimo_subtotal) > 0
  )
  const deliveryFreeEligible = deliveryFreePromos.some(
    (p) => subtotal >= Number(p.valor_minimo_subtotal)
  )
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
    for (const p of deliveryFreePromos) {
      const min = Number(p.valor_minimo_subtotal)
      if (subtotal < min) {
        const need = roundMoney(min - subtotal)
        hints.push(`PROMO_HINT_DELIVERY_FREE|${need.toFixed(2)}|${min.toFixed(2)}`)
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
    deliveryFreeEligible,
  }
}

export function cartItemsToPromoLines(
  items: Array<{
    item: { id: string; categoria_id: string | null }
    totalPrice: number
    quantity?: number
    unitPrice?: number
  }>
): CartLineForPromo[] {
  return items.map((ci) => ({
    itemId: ci.item.id,
    categoriaId: ci.item.categoria_id,
    quantity: Math.max(1, Math.floor(ci.quantity ?? 1)),
    unitAmount:
      ci.unitPrice != null && Number.isFinite(ci.unitPrice)
        ? roundMoney(ci.unitPrice)
        : roundMoney(ci.totalPrice / Math.max(1, Math.floor(ci.quantity ?? 1))),
    lineTotal: roundMoney(ci.totalPrice),
  }))
}
