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
    if (parts[0] === 'PROMO_HINT_CODE_NO_ELIGIBLE') {
      if (lang === 'pt') {
        return 'Este cupom não se aplica aos itens do seu carrinho (categoria ou produto).'
      }
      return 'This coupon does not apply to the items in your cart (category or product).'
    }
    if (parts[0] === 'PROMO_HINT_DELIVERY_FREE' && parts.length >= 3) {
      const need = parts[1]
      const min = parts[2]
      if (lang === 'pt') {
        return `Faltam ${currency}${need} para ganhar frete grátis (mín. ${currency}${min}).`
      }
      return `Add ${currency}${need} more to unlock free delivery (min. ${currency}${min}).`
    }
    return h
  })
}
