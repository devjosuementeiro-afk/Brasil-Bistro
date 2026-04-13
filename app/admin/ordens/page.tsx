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
  cliente_nome: string | null
  cliente_email: string | null
  cliente_telefone: string | null
  status_producao: KitchenStatus
  pedido_itens: OrderItem[]
}

const STATUS_COLUMNS: Array<{ key: KitchenStatus; title: string }> = [
  { key: 'new', title: 'Novas Ordens' },
  { key: 'preparing', title: 'Preparação' },
  { key: 'delivered', title: 'Entregue' },
]

/** ISO do Postgres (timestamptz) → texto no fuso/locale do navegador (ex.: US vs BR). */
function formatPedidoInstante(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(d)
}

export default function AdminOrdensPage() {
  const { t } = useLang()
  const supabase = useMemo(() => createClient(), [])
  const [orders, setOrders] = useState<KitchenOrder[]>([])
  const [loading, setLoading] = useState(true)

  const fetchOrders = useCallback(async () => {
    const { data } = await supabase
      .from('pedidos')
      .select(
        'id, criado_em, valor_total, valor_pago, cliente_nome, cliente_email, cliente_telefone, status_producao, pedido_itens(nome_item, quantidade, observacao, opcoes_selecionadas)'
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
      // rollback otimista simples
      setOrders((prev) =>
        prev.map((o) =>
          o.id === order.id ? { ...o, status_producao: order.status_producao } : o
        )
      )
    }
  }

  return (
    <main className="min-h-screen bg-[#F6F7FA]">
      <header className="sticky top-0 z-40 bg-white border-b border-border px-4 pt-6 pb-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center"
              aria-label="Voltar"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <p className="text-xs text-muted-foreground">Cozinha</p>
              <h1 className="font-bold text-base">Pipeline de Ordens</h1>
            </div>
          </div>
          <ChefHat size={18} className="text-accent" />
        </div>
      </header>

      <section className="max-w-7xl mx-auto p-4">
        {loading ? (
          <LogoLoadingScreen
            variant="contained"
            message={t.loadingOrders}
            className="min-h-[min(420px,65vh)] bg-[#F6F7FA]"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {STATUS_COLUMNS.map((col) => {
              const columnOrders = orders.filter((o) => o.status_producao === col.key)
              return (
                <div key={col.key} className="bg-white rounded-2xl border border-border p-3">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-semibold text-sm">{col.title}</h2>
                    <span className="text-xs bg-secondary rounded-full px-2 py-0.5">
                      {columnOrders.length}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {columnOrders.length === 0 && (
                      <p className="text-xs text-muted-foreground">Sem ordens nesta etapa.</p>
                    )}

                    {columnOrders.map((order) => (
                      <div
                        key={order.id}
                        className="w-full text-left rounded-xl border border-border p-3 bg-[#FCFCFD]"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0">
                            <p className="font-bold text-sm">
                              #{order.id.replace(/-/g, '').slice(-8).toUpperCase()}
                            </p>
                            {order.criado_em && (
                              <p className="mt-0.5 text-[10px] text-muted-foreground" title={order.criado_em}>
                                {formatPedidoInstante(order.criado_em)}
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
                        {(order.cliente_nome || order.cliente_email || order.cliente_telefone) && (
                          <div className="mt-2 text-[11px] text-muted-foreground space-y-0.5 border-t border-border pt-2">
                            {order.cliente_nome && <p className="font-medium text-foreground">{order.cliente_nome}</p>}
                            {order.cliente_email && <p>{order.cliente_email}</p>}
                            {order.cliente_telefone && <p>Tel. {order.cliente_telefone}</p>}
                          </div>
                        )}
                        <div className="mt-2 flex gap-1">
                          {STATUS_COLUMNS.map((statusCol) => (
                            <button
                              key={`${order.id}-${statusCol.key}`}
                              type="button"
                              onClick={() => updateOrderStatus(order, statusCol.key)}
                              className={`px-2 py-1 rounded-lg text-[10px] font-semibold border transition-colors ${
                                order.status_producao === statusCol.key
                                  ? 'border-primary bg-primary text-primary-foreground'
                                  : 'bg-white text-muted-foreground border-border'
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
                                <p className="text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1 mt-1">
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
