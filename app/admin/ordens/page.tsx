'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ChefHat } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/lib/lang-context'
import { LogoLoadingScreen } from '@/components/logo-loading-screen'

type KitchenStatus = 'new' | 'preparing' | 'delivered'

type OrderItem = {
  nome_item: string
  quantidade: number
  observacao: string | null
  opcoes_selecionadas:
    | Array<{ label: string; info?: string | null; detailInfo?: string | null }>
    | null
}

type KitchenOrder = {
  id: string
  criado_em: string
  valor_total: number
  valor_pago: number | null
  taxa_entrega: number | null
  cliente_nome: string | null
  cliente_email: string | null
  cliente_telefone: string | null
  tipo_atendimento: 'take_out' | 'delivery' | null
  endereco_entrega: string | null
  status_producao: KitchenStatus
  pedido_itens: OrderItem[]
}

/** Calendário “hoje” no fuso de São Francisco (mesmo que Los_Angeles). */
const KITCHEN_TIMEZONE = 'America/Los_Angeles'
const HIDDEN_DELIVERED_STORAGE_KEY = 'brasil-bistro-kitchen-hidden-delivered-v1'

function dateKeyInTimeZone(iso: string, timeZone: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d)
}

function todayKeySanFrancisco(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: KITCHEN_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

function loadHiddenDeliveredIds(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(HIDDEN_DELIVERED_STORAGE_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw) as { date?: string; ids?: string[] }
    const today = todayKeySanFrancisco()
    if (parsed.date !== today || !Array.isArray(parsed.ids)) return new Set()
    return new Set(parsed.ids)
  } catch {
    return new Set()
  }
}

function saveHiddenDeliveredIds(ids: Set<string>) {
  const today = todayKeySanFrancisco()
  localStorage.setItem(
    HIDDEN_DELIVERED_STORAGE_KEY,
    JSON.stringify({ date: today, ids: [...ids] })
  )
}

/** Data/hora exibidas no mesmo fuso do filtro “dia”. */
function formatPedidoKitchenTz(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat(undefined, {
    timeZone: KITCHEN_TIMEZONE,
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(d)
}

export default function AdminOrdensPage() {
  const { t } = useLang()
  const supabase = useMemo(() => createClient(), [])
  const [orders, setOrders] = useState<KitchenOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [hiddenDeliveredIds, setHiddenDeliveredIds] = useState<Set<string>>(new Set())

  const statusColumns = useMemo(
    () =>
      [
        { key: 'new' as const, title: t.kitchenColNew },
        { key: 'preparing' as const, title: t.kitchenColPrep },
        { key: 'delivered' as const, title: t.kitchenColDelivered },
      ] as const,
    [t]
  )

  const fetchOrders = useCallback(async () => {
    const { data } = await supabase
      .from('pedidos')
      .select(
        'id, criado_em, valor_total, valor_pago, taxa_entrega, cliente_nome, cliente_email, cliente_telefone, tipo_atendimento, endereco_entrega, status_producao, pedido_itens(nome_item, quantidade, observacao, opcoes_selecionadas)'
      )
      .order('criado_em', { ascending: false })

    setOrders((data as KitchenOrder[]) ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchOrders()
    const timer = setInterval(fetchOrders, 5000)
    return () => clearInterval(timer)
  }, [fetchOrders])

  useEffect(() => {
    setHiddenDeliveredIds(loadHiddenDeliveredIds())
  }, [orders])

  const ordersTodaySf = useMemo(() => {
    const key = todayKeySanFrancisco()
    return orders.filter((o) => dateKeyInTimeZone(o.criado_em, KITCHEN_TIMEZONE) === key)
  }, [orders])

  async function updateOrderStatus(order: KitchenOrder, next: KitchenStatus) {
    if (next === order.status_producao) return

    setOrders((prev) =>
      prev.map((o) => (o.id === order.id ? { ...o, status_producao: next } : o))
    )

    const { error } = await supabase
      .from('pedidos')
      .update({ status_producao: next })
      .eq('id', order.id)

    if (error) {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === order.id ? { ...o, status_producao: order.status_producao } : o
        )
      )
    }
  }

  function persistHiddenDelivered(next: Set<string>) {
    saveHiddenDeliveredIds(next)
    setHiddenDeliveredIds(new Set(next))
  }

  function clearDeliveredColumn(visibleDelivered: KitchenOrder[]) {
    const next = new Set(hiddenDeliveredIds)
    for (const o of visibleDelivered) next.add(o.id)
    persistHiddenDelivered(next)
  }

  function showAllDeliveredAgain() {
    persistHiddenDelivered(new Set())
  }

  return (
    <main className="min-h-screen bg-[#F6F7FA]">
      <header className="sticky top-0 z-40 border-b border-border bg-white px-4 pb-3 pt-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary"
              aria-label="Voltar"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <p className="text-xs text-muted-foreground">{t.kitchenTitle}</p>
              <h1 className="text-base font-bold">{t.kitchenPipelineTitle}</h1>
              <p className="mt-0.5 text-[10px] text-muted-foreground">{t.kitchenTodayNote}</p>
            </div>
          </div>
          <ChefHat size={18} className="text-accent" />
        </div>
      </header>

      <section className="mx-auto max-w-7xl p-4">
        {loading ? (
          <LogoLoadingScreen
            variant="contained"
            message={t.loadingOrders}
            className="min-h-[min(420px,65vh)] bg-[#F6F7FA]"
          />
        ) : ordersTodaySf.length === 0 ? (
          <p className="rounded-2xl border border-border bg-white px-4 py-8 text-center text-sm text-muted-foreground">
            {t.kitchenNoOrdersToday}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {statusColumns.map((col) => {
              const columnOrders = ordersTodaySf.filter((o) => o.status_producao === col.key)
              const isDelivered = col.key === 'delivered'
              const visibleDelivered = isDelivered
                ? columnOrders.filter((o) => !hiddenDeliveredIds.has(o.id))
                : columnOrders
              const hiddenInDelivered = isDelivered
                ? columnOrders.filter((o) => hiddenDeliveredIds.has(o.id)).length
                : 0

              const cards = isDelivered ? visibleDelivered : columnOrders

              return (
                <div key={col.key} className="rounded-2xl border border-border bg-white p-3">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-sm font-semibold">{col.title}</h2>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">
                        {isDelivered ? visibleDelivered.length : columnOrders.length}
                      </span>
                      {isDelivered && hiddenInDelivered > 0 && (
                        <span className="text-[10px] text-muted-foreground">
                          {t.kitchenHiddenCount.replace('{n}', String(hiddenInDelivered))}
                        </span>
                      )}
                    </div>
                  </div>

                  {isDelivered && (
                    <div className="mb-3 space-y-1">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => clearDeliveredColumn(visibleDelivered)}
                          disabled={visibleDelivered.length === 0}
                          className="rounded-lg border border-border bg-white px-2.5 py-1 text-[11px] font-semibold text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {t.kitchenClearDelivered}
                        </button>
                        {hiddenInDelivered > 0 && (
                          <button
                            type="button"
                            onClick={showAllDeliveredAgain}
                            className="rounded-lg border border-primary/40 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-foreground"
                          >
                            {t.kitchenShowDeliveredAgain}
                          </button>
                        )}
                      </div>
                      <p className="text-[10px] leading-snug text-muted-foreground">
                        {t.kitchenClearDeliveredHint}
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    {cards.length === 0 && (
                      <p className="text-xs text-muted-foreground">Sem ordens nesta etapa.</p>
                    )}

                    {cards.map((order) => (
                      <div
                        key={order.id}
                        className="w-full rounded-xl border border-border bg-[#FCFCFD] p-3 text-left"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-bold">
                              #{order.id.replace(/-/g, '').slice(-8).toUpperCase()}
                            </p>
                            {order.criado_em && (
                              <p
                                className="mt-0.5 text-[10px] text-muted-foreground"
                                title={order.criado_em}
                              >
                                {formatPedidoKitchenTz(order.criado_em)}
                              </p>
                            )}
                          </div>
                          <p className="shrink-0 text-xs font-semibold text-foreground">
                            Total $
                            {Number(
                              order.valor_pago != null ? order.valor_pago : order.valor_total ?? 0
                            ).toFixed(2)}
                          </p>
                        </div>
                        {Number(order.taxa_entrega ?? 0) > 0 ? (
                          <p className="mt-1 text-[10px] text-muted-foreground">
                            {t.paymentDeliveryFee}: ${Number(order.taxa_entrega ?? 0).toFixed(2)}
                          </p>
                        ) : null}
                        {(order.cliente_nome || order.cliente_email || order.cliente_telefone) && (
                          <div className="mt-2 space-y-0.5 border-t border-border pt-2 text-[11px] text-muted-foreground">
                            {order.cliente_nome && (
                              <p className="font-medium text-foreground">{order.cliente_nome}</p>
                            )}
                            {order.cliente_email && <p>{order.cliente_email}</p>}
                            {order.cliente_telefone && <p>Tel. {order.cliente_telefone}</p>}
                            {order.tipo_atendimento && (
                              <p>
                                {order.tipo_atendimento === 'delivery'
                                  ? t.checkoutDelivery
                                  : t.checkoutTakeOut}
                              </p>
                            )}
                            {order.tipo_atendimento === 'delivery' && order.endereco_entrega ? (
                              <p>{order.endereco_entrega}</p>
                            ) : null}
                          </div>
                        )}
                        <div className="mt-2 flex flex-wrap gap-1">
                          {statusColumns.map((statusCol) => (
                            <button
                              key={`${order.id}-${statusCol.key}`}
                              type="button"
                              onClick={() => updateOrderStatus(order, statusCol.key)}
                              className={`rounded-lg border px-2 py-1 text-[10px] font-semibold transition-colors ${
                                order.status_producao === statusCol.key
                                  ? 'border-primary bg-primary text-primary-foreground'
                                  : 'border-border bg-white text-muted-foreground'
                              }`}
                            >
                              {statusCol.title}
                            </button>
                          ))}
                        </div>
                        <div className="mt-2 space-y-1">
                          {order.pedido_itens?.map((it, i) => (
                            <div key={`${order.id}-${i}`} className="text-xs">
                              <p className="font-medium">
                                {it.quantidade}x {it.nome_item}
                              </p>
                              {it.opcoes_selecionadas && it.opcoes_selecionadas.length > 0 && (
                                <p className="text-muted-foreground">
                                  {it.opcoes_selecionadas
                                    .map((op) =>
                                      op?.info ?? op?.detailInfo
                                        ? `${op.label} (${op.info ?? op.detailInfo})`
                                        : op.label
                                    )
                                    .join(' • ')}
                                </p>
                              )}
                              {it.observacao && (
                                <p className="mt-1 rounded border border-amber-200 bg-amber-50 px-2 py-1 text-amber-700">
                                  Obs interna: {it.observacao}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </main>
  )
}
