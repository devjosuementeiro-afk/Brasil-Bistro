'use client'

import { useCart } from '@/lib/cart-context'
import { useLang } from '@/lib/lang-context'
import { Minus, Plus, Trash2, ArrowLeft, ShoppingBag } from 'lucide-react'
import Link from 'next/link'

export default function CarrinhoPage() {
  const { items, updateQuantity, removeItem, totalPrice, totalItems, clearCart } =
    useCart()
  const { t } = useLang()

  if (items.length === 0) {
    return (
      <main className="mx-auto flex min-h-screen max-w-lg flex-col bg-background">
        <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-border/80 bg-card/85 px-4 pb-4 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-xl">
          <Link
            href="/"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border/80 bg-card shadow-sm transition-colors active:bg-muted"
            aria-label="Back"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="font-serif text-xl font-semibold tracking-tight text-foreground">{t.myCart}</h1>
        </header>
        <div className="flex flex-1 flex-col items-center justify-center gap-5 px-8 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-xl border border-primary/20 bg-primary/5">
            <ShoppingBag size={30} strokeWidth={1.5} className="text-primary" />
          </div>
          <h2 className="font-serif text-xl font-semibold text-foreground">{t.emptyCart}</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">{t.emptyCartHint}</p>
          <Link
            href="/"
            className="mt-1 rounded-xl bg-primary px-10 py-3.5 text-sm font-semibold text-primary-foreground shadow-md transition-opacity active:opacity-90"
          >
            {t.viewMenu}
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto min-h-screen max-w-lg bg-background pb-52">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-card/85 px-4 pb-4 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border/80 bg-card shadow-sm transition-colors active:bg-muted"
              aria-label="Back"
            >
              <ArrowLeft size={20} />
            </Link>
            <h1 className="font-serif text-xl font-semibold tracking-tight text-foreground">{t.myCart}</h1>
          </div>
          <button
            onClick={clearCart}
            className="text-xs text-muted-foreground font-medium underline underline-offset-2"
          >
            {t.clearAll}
          </button>
        </div>
      </header>

      <div className="px-4 pt-4 space-y-3">
        {items.map(({ cartItemId, item, quantity, totalPrice: itemTotal, observation, selectedOptions }) => (
          <div
            key={cartItemId}
            className="flex gap-3 rounded-xl border border-border/80 bg-card p-3 shadow-[var(--shadow-card)]"
          >
            {item.imagem_url ? (
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg">
                <img src={item.imagem_url} alt={item.nome} className="h-full w-full object-cover" />
              </div>
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-muted">
                <ShoppingBag size={20} strokeWidth={1.5} className="text-primary/40" aria-hidden />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-foreground line-clamp-1">{item.nome}</p>
              <p className="mt-0.5 font-serif text-sm font-semibold text-primary">
                {t.currency}
                {itemTotal.toFixed(2)}
              </p>
              {observation && (
                <p className="text-[11px] text-muted-foreground mt-1">
                  Obs: {observation}
                </p>
              )}
              {selectedOptions.length > 0 && (
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {selectedOptions
                    .map((o) =>
                      o.groupType === 'extra' && o.groupName
                        ? `${o.groupName}: ${o.label}`
                        : o.label
                    )
                    .join(' • ')}
                </p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-secondary/80 px-2 py-1">
                  <button
                    onClick={() => updateQuantity(cartItemId, quantity - 1)}
                    className="flex h-6 w-6 items-center justify-center rounded-md bg-card"
                    aria-label="Remove one"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="w-4 text-center text-xs font-bold">{quantity}</span>
                  <button
                    onClick={() => updateQuantity(cartItemId, quantity + 1)}
                    className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground"
                    aria-label="Add one"
                  >
                    <Plus size={12} />
                  </button>
                </div>
                <button
                  onClick={() => removeItem(cartItemId)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive"
                  aria-label={`Remove ${item.nome}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Resumo fixo */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 mx-auto max-w-lg border-t border-border/80 bg-card/95 px-4 pt-4 backdrop-blur-xl"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 80px)' }}
      >
        <div className="mb-4 space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>
              {totalItems} {totalItems === 1 ? t.item : t.items}
            </span>
            <span className="tabular-nums">
              {t.currency}
              {totalPrice.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-base font-semibold">
            <span>{t.total}</span>
            <span className="font-serif text-lg tabular-nums text-primary">
              {t.currency}
              {totalPrice.toFixed(2)}
            </span>
          </div>
        </div>
        <Link
          href="/checkout/dados"
          className="block w-full rounded-xl bg-primary py-4 text-center text-sm font-semibold text-primary-foreground shadow-md transition-opacity active:opacity-90"
        >
          {t.placeOrder}
        </Link>
      </div>
    </main>
  )
}
