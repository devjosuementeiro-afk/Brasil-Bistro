'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { ShoppingBag, Star, Plus, Minus, Inbox, UtensilsCrossed } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useCart, type ItemCardapio } from '@/lib/cart-context'
import { useLang } from '@/lib/lang-context'
import { cn } from '@/lib/utils'
import logoPrincipal from '@/logo/logo-principal-preto.png'

interface Categoria {
  id: string
  nome: string
  icone: string | null
  ordem: number
}

interface ItemComCategoria extends ItemCardapio {
  disponivel: boolean
  destaque: boolean
  categorias: Categoria | null
}

export default function MenuPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [itens, setItens] = useState<ItemComCategoria[]>([])
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string>('todas')
  const [loading, setLoading] = useState(true)
  const { totalItems, items, addItem, updateQuantity } = useCart()
  const { t } = useLang()

  const fetchData = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const [{ data: cats }, { data: its }] = await Promise.all([
      supabase.from('categorias').select('*').eq('ativo', true).order('ordem'),
      supabase
        .from('itens_cardapio')
        .select('*, categorias(id, nome, icone, ordem)')
        .eq('disponivel', true)
        .order('destaque', { ascending: false })
        .order('ordem'),
    ])
    setCategorias(cats ?? [])
    setItens(its ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const itensFiltrados = itens.filter((item) => {
    return categoriaSelecionada === 'todas' || item.categoria_id === categoriaSelecionada
  })

  const sortItensCardapio = useCallback((arr: ItemComCategoria[]) => {
    return [...arr].sort((a, b) => {
      if (a.destaque !== b.destaque) return Number(b.destaque) - Number(a.destaque)
      return (a.ordem ?? 0) - (b.ordem ?? 0)
    })
  }, [])

  /** Em "Todas": secções na ordem das categorias; dentro de cada uma, destaque depois ordem. */
  const secoesPorCategoria = useMemo(() => {
    if (categoriaSelecionada !== 'todas') return null

    const byId = new Map<string, ItemComCategoria[]>()
    for (const item of itensFiltrados) {
      const key = item.categoria_id ?? '__sem_categoria__'
      const list = byId.get(key)
      if (list) list.push(item)
      else byId.set(key, [item])
    }

    type Secao = {
      id: string
      nome: string
      icone: string | null
      items: ItemComCategoria[]
    }
    const out: Secao[] = []

    for (const cat of categorias) {
      const list = byId.get(cat.id)
      if (list?.length) {
        out.push({
          id: cat.id,
          nome: cat.nome,
          icone: cat.icone,
          items: sortItensCardapio(list),
        })
        byId.delete(cat.id)
      }
    }

    const restantes = [...byId.entries()].sort(([, listaA], [, listaB]) => {
      const nomeA = listaA[0]?.categorias?.nome ?? ''
      const nomeB = listaB[0]?.categorias?.nome ?? ''
      return nomeA.localeCompare(nomeB, undefined, { sensitivity: 'base' })
    })

    for (const [key, list] of restantes) {
      if (!list.length) continue
      const first = list[0]
      const nome =
        key === '__sem_categoria__'
          ? t.noCategory
          : first?.categorias?.nome ?? t.noCategory
      out.push({
        id: key === '__sem_categoria__' ? 'sem-categoria' : key,
        nome,
        icone: first?.categorias?.icone ?? null,
        items: sortItensCardapio(list),
      })
    }

    return out
  }, [categoriaSelecionada, itensFiltrados, categorias, sortItensCardapio, t.noCategory])

  const itensListaOrdenados = useMemo(
    () => sortItensCardapio(itensFiltrados),
    [itensFiltrados, sortItensCardapio]
  )

  const destaques = itensFiltrados.filter((i) => i.destaque)

  const destaquesOrdenados = useMemo(() => {
    const ordemCat = new Map(categorias.map((c) => [c.id, c.ordem]))
    return [...destaques].sort((a, b) => {
      const oa = a.categoria_id != null ? (ordemCat.get(a.categoria_id) ?? 999) : 9999
      const ob = b.categoria_id != null ? (ordemCat.get(b.categoria_id) ?? 999) : 9999
      if (oa !== ob) return oa - ob
      return (a.ordem ?? 0) - (b.ordem ?? 0)
    })
  }, [destaques, categorias])

  function getQtd(id: string) {
    return items.filter((ci) => ci.item.id === id).reduce((acc, ci) => acc + ci.quantity, 0)
  }

  function getFirstCartLineId(id: string) {
    return items.find((ci) => ci.item.id === id)?.cartItemId ?? null
  }

  return (
    <main className="mx-auto min-h-screen max-w-lg bg-background pb-28">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-card/80 shadow-[0_1px_0_rgba(0,0,0,0.04)] backdrop-blur-xl">
        <div className="space-y-4 px-4 pb-4 pt-[max(0.875rem,env(safe-area-inset-top))]">
          <div className="flex items-center gap-4">
            <Image
              src={logoPrincipal}
              alt="Brasil Bistro"
              className="h-auto w-[76px] shrink-0 sm:w-[84px]"
              priority
            />
            <div className="min-w-0 flex-1 border-l border-border pl-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                {t.menuLabel}
              </p>
              <h1 className="font-serif text-[1.35rem] font-semibold leading-tight tracking-tight text-foreground">
                {t.ourDishes}
              </h1>
            </div>
            <Link
              href="/carrinho"
              className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[var(--shadow-card)] transition-transform active:scale-[0.97]"
              aria-label={`${t.cart} (${totalItems})`}
            >
              <ShoppingBag size={20} strokeWidth={2} />
              {totalItems > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border border-card bg-foreground px-1 text-[10px] font-bold text-background">
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </Link>
          </div>
        </div>

        {categorias.length > 0 && (
          <div
            className="flex snap-x snap-mandatory gap-2 overflow-x-auto scrollbar-hide px-4 pb-4 pt-0"
            role="tablist"
            aria-label="Categorias"
          >
            <button
              type="button"
              role="tab"
              aria-selected={categoriaSelecionada === 'todas'}
              onClick={() => setCategoriaSelecionada('todas')}
              className={cn(
                'shrink-0 snap-start rounded-xl px-4 py-2.5 text-[13px] font-semibold tracking-tight transition-all',
                categoriaSelecionada === 'todas'
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'border border-border/80 bg-card text-foreground shadow-sm active:bg-muted'
              )}
            >
              {t.all}
            </button>
            {categorias.map((cat) => (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={categoriaSelecionada === cat.id}
                onClick={() => setCategoriaSelecionada(cat.id)}
                className={cn(
                  'flex shrink-0 snap-start items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-[13px] font-semibold tracking-tight transition-all',
                  categoriaSelecionada === cat.id
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'border border-border/80 bg-card text-foreground shadow-sm active:bg-muted'
                )}
              >
                {cat.icone && <span className="text-base leading-none opacity-80">{cat.icone}</span>}
                {cat.nome}
              </button>
            ))}
          </div>
        )}
      </header>

      <div className="px-4 pt-6">
        {loading ? (
          <div className="space-y-3" aria-busy="true" aria-label="Carregando cardápio">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-[88px] animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : itensFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/70 bg-card/80 px-6 py-16 text-center shadow-[var(--shadow-card)]">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl border border-border/60 bg-secondary/80">
              <Inbox size={24} className="text-muted-foreground" aria-hidden />
            </div>
            <p className="font-serif text-lg font-semibold text-foreground">{t.noItemsFound}</p>
            <p className="mt-2 max-w-[280px] text-sm leading-relaxed text-muted-foreground">
              {t.noItemsHint}
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            {destaques.length > 0 && (
              <section aria-labelledby="sec-destaques">
                <div className="mb-4 flex items-center justify-between gap-2 px-0.5">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-primary/25 bg-primary/8 text-primary">
                      <Star size={17} strokeWidth={1.5} className="text-primary" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <h2 id="sec-destaques" className="font-serif text-lg font-semibold tracking-tight text-foreground">
                        {t.featured}
                      </h2>
                      <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                        {t.featuredSubtitle}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="-mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto scrollbar-hide pb-1 pl-1 pr-4">
                  {destaquesOrdenados.map((item) => {
                    const firstLineId = getFirstCartLineId(item.id)
                    return (
                      <DestaqueCard
                        key={item.id}
                        item={item}
                        qtd={getQtd(item.id)}
                        addLabel={t.addToCart}
                        currency={t.currency}
                        onAdd={() => addItem(item, 1)}
                        onInc={() => firstLineId && updateQuantity(firstLineId, getQtd(item.id) + 1)}
                        onDec={() => firstLineId && updateQuantity(firstLineId, getQtd(item.id) - 1)}
                      />
                    )
                  })}
                </div>
              </section>
            )}

            <section aria-labelledby="sec-cardapio">
              <div className="mb-4 flex items-end justify-between gap-2 border-b border-border/60 pb-3 px-0.5">
                <h2 id="sec-cardapio" className="font-serif text-lg font-semibold tracking-tight text-foreground">
                  {t.fullMenu}
                </h2>
                <span className="shrink-0 text-[11px] font-medium uppercase tracking-[0.12em] tabular-nums text-muted-foreground">
                  {itensFiltrados.length} {itensFiltrados.length === 1 ? t.item : t.items}
                </span>
              </div>
              {categoriaSelecionada === 'todas' && secoesPorCategoria ? (
                <div className="space-y-10">
                  {secoesPorCategoria.map((secao) => (
                    <section
                      key={secao.id}
                      aria-labelledby={`sec-cat-${secao.id}`}
                      className="scroll-mt-4"
                    >
                      <h3
                        id={`sec-cat-${secao.id}`}
                        className="mb-3 flex items-center gap-2 border-b border-border/50 pb-2 font-serif text-base font-semibold tracking-tight text-foreground"
                      >
                        {secao.icone && (
                          <span className="text-lg leading-none opacity-85" aria-hidden>
                            {secao.icone}
                          </span>
                        )}
                        {secao.nome}
                      </h3>
                      <ul className="list-none space-y-3 p-0 m-0">
                        {secao.items.map((item) => {
                          const firstLineId = getFirstCartLineId(item.id)
                          return (
                            <li key={item.id}>
                              <ItemCard
                                item={item}
                                qtd={getQtd(item.id)}
                                addLabel={t.addToCart}
                                currency={t.currency}
                                onAdd={() => addItem(item, 1)}
                                onInc={() => firstLineId && updateQuantity(firstLineId, getQtd(item.id) + 1)}
                                onDec={() => firstLineId && updateQuantity(firstLineId, getQtd(item.id) - 1)}
                              />
                            </li>
                          )
                        })}
                      </ul>
                    </section>
                  ))}
                </div>
              ) : (
                <ul className="space-y-3 list-none p-0 m-0">
                  {itensListaOrdenados.map((item) => {
                    const firstLineId = getFirstCartLineId(item.id)
                    return (
                      <li key={item.id}>
                        <ItemCard
                          item={item}
                          qtd={getQtd(item.id)}
                          addLabel={t.addToCart}
                          currency={t.currency}
                          onAdd={() => addItem(item, 1)}
                          onInc={() => firstLineId && updateQuantity(firstLineId, getQtd(item.id) + 1)}
                          onDec={() => firstLineId && updateQuantity(firstLineId, getQtd(item.id) - 1)}
                        />
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>
          </div>
        )}
      </div>
    </main>
  )
}

function DestaqueCard({
  item,
  qtd,
  addLabel,
  currency,
  onAdd,
  onInc,
  onDec,
}: {
  item: ItemComCategoria
  qtd: number
  addLabel: string
  currency: string
  onAdd: () => void
  onInc: () => void
  onDec: () => void
}) {
  return (
    <article className="w-[168px] shrink-0 snap-start overflow-hidden rounded-xl border border-border/80 bg-card shadow-[var(--shadow-luxury)]">
      <Link
        href={`/produto/${item.id}`}
        className="block rounded-t-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        {item.imagem_url ? (
          <div className="aspect-4/3 w-full overflow-hidden bg-muted">
            <img src={item.imagem_url} alt="" className="h-full w-full object-cover" />
          </div>
        ) : (
          <div className="flex aspect-4/3 w-full items-center justify-center bg-muted">
            <UtensilsCrossed size={28} strokeWidth={1.25} className="text-primary/50" aria-hidden />
          </div>
        )}
      </Link>
      <div className="p-3.5 pt-3">
        <Link
          href={`/produto/${item.id}`}
          className="line-clamp-2 min-h-10 text-[13px] font-semibold leading-snug text-foreground transition-colors hover:text-primary"
        >
          {item.nome}
        </Link>
        <p className="mt-2 font-serif text-base font-semibold tabular-nums text-primary">
          {currency}
          {item.preco.toFixed(2)}
        </p>
        <div className="mt-3">
          {qtd === 0 ? (
            <button
              type="button"
              onClick={onAdd}
              className="flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-sm transition-transform active:scale-[0.98]"
            >
              <Plus size={16} strokeWidth={2.5} aria-hidden />
              {addLabel}
            </button>
          ) : (
            <div className="flex h-10 items-center justify-between gap-1 rounded-xl border border-border/60 bg-secondary/80 px-1.5">
              <button
                type="button"
                onClick={onDec}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-card shadow-sm active:bg-background"
                aria-label="Remover uma unidade"
              >
                <Minus size={16} />
              </button>
              <span className="min-w-5 text-center text-sm font-bold tabular-nums">{qtd}</span>
              <button
                type="button"
                onClick={onInc}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm active:scale-[0.98]"
                aria-label="Adicionar uma unidade"
              >
                <Plus size={16} strokeWidth={2.5} />
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

function ItemCard({
  item,
  qtd,
  addLabel,
  currency,
  onAdd,
  onInc,
  onDec,
}: {
  item: ItemComCategoria
  qtd: number
  addLabel: string
  currency: string
  onAdd: () => void
  onInc: () => void
  onDec: () => void
}) {
  return (
    <article className="flex gap-4 overflow-hidden rounded-xl border border-border/80 bg-card p-3.5 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-luxury)]">
      <Link
        href={`/produto/${item.id}`}
        className="shrink-0 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
      >
        {item.imagem_url ? (
          <div className="h-[92px] w-[92px] overflow-hidden rounded-lg bg-muted">
            <img src={item.imagem_url} alt="" className="h-full w-full object-cover" />
          </div>
        ) : (
          <div className="flex h-[92px] w-[92px] items-center justify-center rounded-lg bg-muted">
            <UtensilsCrossed size={26} strokeWidth={1.25} className="text-primary/45" aria-hidden />
          </div>
        )}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="min-w-0 flex-1">
          {item.categorias && (
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary/90">{item.categorias.nome}</p>
          )}
          <Link
            href={`/produto/${item.id}`}
            className="mt-1 block line-clamp-2 text-[15px] font-semibold leading-snug text-foreground transition-colors hover:text-primary"
          >
            {item.nome}
          </Link>
          {item.descricao && (
            <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{item.descricao}</p>
          )}
        </div>
        <div className="mt-3 flex items-center justify-between gap-2">
          <p className="font-serif text-base font-semibold tabular-nums text-primary">
            {currency}
            {item.preco.toFixed(2)}
          </p>
          <div className="flex shrink-0 items-center justify-end">
            {qtd === 0 ? (
              <button
                type="button"
                onClick={onAdd}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm transition-transform active:scale-[0.98]"
                aria-label={`${addLabel}: ${item.nome}`}
              >
                <Plus size={20} strokeWidth={2.5} />
              </button>
            ) : (
              <div className="flex h-10 items-center gap-1 rounded-xl border border-border/60 bg-secondary/80 px-1">
                <button
                  type="button"
                  onClick={onDec}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-card shadow-sm"
                  aria-label="Remover uma unidade"
                >
                  <Minus size={16} />
                </button>
                <span className="min-w-5 text-center text-sm font-bold tabular-nums">{qtd}</span>
                <button
                  type="button"
                  onClick={onInc}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm"
                  aria-label="Adicionar uma unidade"
                >
                  <Plus size={16} strokeWidth={2.5} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}
