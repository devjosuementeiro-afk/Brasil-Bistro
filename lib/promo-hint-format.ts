/** Traduz hints emitidos por `computePromotionDiscount` (prefixo PROMO_HINT_*). */

export function formatPromotionHints(
  hints: string[],
  lang: 'en' | 'pt',
  currency: string
): string[] {
  return hints.map((h) => {
    const parts = h.split('|')
    if (parts[0] === 'PROMO_HINT_MIN' && parts.length >= 4) {
      const need = parts[1]
      const min = parts[2]
      const pct = parts[3]
      if (lang === 'pt') {
        return `Faltam ${currency}${need} para ganhar ${pct}% de desconto (pedido mín. ${currency}${min}).`
      }
      return `Add ${currency}${need} more to unlock ${pct}% off (min. order ${currency}${min}).`
    }
    if (parts[0] === 'PROMO_HINT_CODE_MIN' && parts.length >= 4) {
      const need = parts[1]
      const min = parts[2]
      const pct = parts[3]
      if (lang === 'pt') {
        return `Este código exige pedido mínimo de ${currency}${min}. Faltam ${currency}${need} no carrinho para ${pct}% de desconto.`
      }
      return `This code requires a minimum order of ${currency}${min}. Add ${currency}${need} more to your cart for ${pct}% off.`
    }
    return h
  })
}
