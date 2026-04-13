'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ChefHat, Pencil, Plus, Tag, Trash2, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/lib/lang-context'
import { LogoLoadingScreen } from '@/components/logo-loading-screen'
import { cn } from '@/lib/utils'

type PromocaoTipo = 'subtotal_minimo_percentual' | 'codigo_promocional' | 'categoria_percentual'

type CategoriaRow = { id: string; nome: string }

type PromocaoRow = {
  id: string
  nome: string
  nome_exibicao: string | null
  tipo: PromocaoTipo
  ativo: boolean
  percentual_desconto: number
  valor_minimo_subtotal: number | null
  codigo: string | null
  categoria_id: string | null
  validade_inicio: string | null
  validade_fim: string | null
  categorias: { nome: string } | null
}

const TIPOS: PromocaoTipo[] = [
  'subtotal_minimo_percentual',
  'codigo_promocional',
  'categoria_percentual',
]

function toDateInput(iso: string | null) {
  if (!iso) return ''
  return iso.slice(0, 10)
}

function fromDateStart(d: string) {
  const t = d.trim()
  if (!t) return null
  return `${t}T00:00:00.000Z`
}

function fromDateEnd(d: string) {
  const t = d.trim()
  if (!t) return null
  return `${t}T23:59:59.999Z`
}

export default function AdminPromocoesPage() {
  const supabase = createClient()
  const { t } = useLang()
  const [loading, setLoading] = useState(true)
  const [promocoes, setPromocoes] = useState<PromocaoRow[]>([])
  const [categorias, setCategorias] = useState<CategoriaRow[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<PromocaoRow | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const [form, setForm] = useState({
    nome: '',
    nomeExibicao: '',
    tipo: 'subtotal_minimo_percentual' as PromocaoTipo,
    ativo: true,
    percentual: '',
    valorMinimo: '',
    codigo: '',
    categoriaId: '',
    validFrom: '',
    validTo: '',
  })

  const tipoLabel = useMemo(
    () => ({
      subtotal_minimo_percentual: t.promoTipoSubtotal,
      codigo_promocional: t.promoTipoCodigo,
      categoria_percentual: t.promoTipoCategoria,
    }),
    [t]
  )

  const load = useCallback(async () => {
    setLoading(true)
    setErro(null)
    const [{ data: promos, error: e1 }, { data: cats, error: e2 }] = await Promise.all([
      supabase
        .from('promocoes')
        .select('*, categorias(nome)')
        .order('criado_em', { ascending: false }),
      supabase.from('categorias').select('id, nome').eq('ativo', true).order('ordem'),
    ])
    if (e1) setErro(e1.message)
    else setPromocoes((promos as PromocaoRow[]) ?? [])
    if (e2 && !e1) setErro(e2.message)
    setCategorias((cats as CategoriaRow[]) ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    void load()
  }, [load])

  function abrirNovo() {
    setEditando(null)
    setForm({
      nome: '',
      nomeExibicao: '',
      tipo: 'subtotal_minimo_percentual',
      ativo: true,
      percentual: '',
      valorMinimo: '',
      codigo: '',
      categoriaId: '',
      validFrom: '',
      validTo: '',
    })
    setErro(null)
    setModalOpen(true)
  }

  function abrirEditar(p: PromocaoRow) {
    setEditando(p)
    setForm({
      nome: p.nome,
      nomeExibicao: p.nome_exibicao ?? '',
      tipo: p.tipo,
      ativo: p.ativo,
      percentual: String(p.percentual_desconto),
      valorMinimo: p.valor_minimo_subtotal != null ? String(p.valor_minimo_subtotal) : '',
      codigo: p.codigo ?? '',
      categoriaId: p.categoria_id ?? '',
      validFrom: toDateInput(p.validade_inicio),
      validTo: toDateInput(p.validade_fim),
    })
    setErro(null)
    setModalOpen(true)
  }

  function validar(): string | null {
    if (!form.nome.trim()) return t.promoErrName
    const pct = Number(form.percentual)
    if (!Number.isFinite(pct) || pct <= 0 || pct > 100) return t.promoErrPercent
    if (form.tipo === 'subtotal_minimo_percentual') {
      const m = Number(form.valorMinimo)
      if (!Number.isFinite(m) || m <= 0) return t.promoErrMinSubtotal
    }
    if (form.tipo === 'codigo_promocional') {
      if (!form.codigo.trim()) return t.promoErrCode
      if (form.valorMinimo.trim()) {
        const m = Number(form.valorMinimo)
        if (!Number.isFinite(m) || m <= 0) return t.promoErrMinSubtotal
      }
    }
    if (form.tipo === 'categoria_percentual') {
      if (!form.categoriaId) return t.promoErrCategory
    }
    return null
  }

  function buildRowPayload() {
    const pct = Number(form.percentual)
    const nomeEx = form.nomeExibicao.trim()
    const base = {
      nome: form.nome.trim(),
      nome_exibicao: nomeEx.length > 0 ? nomeEx : null,
      tipo: form.tipo,
      ativo: form.ativo,
      percentual_desconto: pct,
      validade_inicio: fromDateStart(form.validFrom),
      validade_fim: fromDateEnd(form.validTo),
    }
    if (form.tipo === 'subtotal_minimo_percentual') {
      return {
        ...base,
        valor_minimo_subtotal: Number(form.valorMinimo),
        codigo: null,
        categoria_id: null,
      }
    }
    if (form.tipo === 'codigo_promocional') {
      const minRaw = form.valorMinimo.trim()
      const minVal = minRaw ? Number(minRaw) : null
      return {
        ...base,
        valor_minimo_subtotal: minVal != null && minVal > 0 ? minVal : null,
        codigo: form.codigo.trim().toUpperCase().replace(/\s+/g, ''),
        categoria_id: null,
      }
    }
    return {
      ...base,
      valor_minimo_subtotal: null,
      codigo: null,
      categoria_id: form.categoriaId,
    }
  }

  async function salvar() {
    const v = validar()
    if (v) {
      setErro(v)
      return
    }
    setSalvando(true)
    setErro(null)
    const row = buildRowPayload()
    try {
      if (editando) {
        const { error } = await supabase.from('promocoes').update(row).eq('id', editando.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('promocoes').insert(row)
        if (error) throw error
      }
      setModalOpen(false)
      await load()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      if (msg.includes('promocoes_codigo_upper_unique') || msg.includes('duplicate')) {
        setErro(t.promoErrCodeDuplicate)
      } else {
        setErro(msg)
      }
    } finally {
      setSalvando(false)
    }
  }

  async function excluir(id: string) {
    if (!confirm(t.promoDeleteConfirm)) return
    setErro(null)
    const { error } = await supabase.from('promocoes').delete().eq('id', id)
    if (error) setErro(error.message)
    else void load()
  }

  function regraResumo(p: PromocaoRow): string {
    const pct = `${Number(p.percentual_desconto)}%`
    if (p.tipo === 'subtotal_minimo_percentual') {
      return `≥ $${Number(p.valor_minimo_subtotal ?? 0).toFixed(2)} → ${pct}`
    }
    if (p.tipo === 'codigo_promocional') {
      const min =
        p.valor_minimo_subtotal != null && Number(p.valor_minimo_subtotal) > 0
          ? ` ≥ $${Number(p.valor_minimo_subtotal).toFixed(2)}`
          : ''
      return `${p.codigo ?? '—'}${min} → ${pct}`
    }
    return `${p.categorias?.nome ?? '—'} → ${pct}`
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <LogoLoadingScreen variant="fullscreen" message={t.loadingAdmin} />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#F6F7FA]">
      <header className="sticky top-0 z-40 border-b border-border bg-white px-4 pb-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="mx-auto flex max-w-4xl flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link
                href="/admin"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary transition-colors hover:bg-secondary/80"
                aria-label={t.promoBackAdmin}
              >
                <ArrowLeft size={18} />
              </Link>
              <div>
                <p className="text-xs text-muted-foreground">{t.adminPanel}</p>
                <h1 className="flex items-center gap-2 text-lg font-bold text-foreground">
                  <Tag size={20} className="text-primary" />
                  {t.promoPageTitle}
                </h1>
              </div>
            </div>
            <ChefHat size={20} className="shrink-0 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">{t.promoPageSubtitle}</p>
          <button
            type="button"
            onClick={abrirNovo}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground shadow-sm sm:w-auto sm:self-start sm:px-5"
          >
            <Plus size={18} />
            {t.promoAdd}
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-6">
        {erro && !modalOpen && (
          <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {erro}
          </p>
        )}

        {promocoes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-white px-6 py-14 text-center text-sm text-muted-foreground">
            {t.promoEmpty}
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
            <div className="hidden grid-cols-[1fr_1.2fr_0.7fr_1.4fr_0.5fr_0.9fr] gap-2 border-b border-border bg-muted/40 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground md:grid">
              <span>{t.promoColName}</span>
              <span>{t.promoColType}</span>
              <span>{t.promoColDiscount}</span>
              <span>{t.promoColDetail}</span>
              <span>{t.promoColActive}</span>
              <span className="text-right">{t.promoColActions}</span>
            </div>
            <ul className="divide-y divide-border">
              {promocoes.map((p) => (
                <li
                  key={p.id}
                  className="flex flex-col gap-2 px-3 py-3 md:grid md:grid-cols-[1fr_1.2fr_0.7fr_1.4fr_0.5fr_0.9fr] md:items-center md:gap-2"
                >
                  <span className="font-semibold text-foreground">{p.nome}</span>
                  <span className="text-sm text-muted-foreground">{tipoLabel[p.tipo]}</span>
                  <span className="text-sm font-semibold text-primary">{Number(p.percentual_desconto)}%</span>
                  <span className="text-xs text-muted-foreground md:text-sm">{regraResumo(p)}</span>
                  <span className="text-sm">{p.ativo ? '✓' : '—'}</span>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => abrirEditar(p)}
                      className="rounded-lg border border-border px-2 py-1 text-xs font-semibold text-foreground hover:bg-muted"
                    >
                      <Pencil size={14} className="inline md:mr-1" />
                      <span className="hidden md:inline">{t.promoEdit}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => void excluir(p.id)}
                      className="rounded-lg border border-red-200 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={14} className="inline md:mr-1" />
                      <span className="hidden md:inline">{t.promoDelete}</span>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="promo-modal-title"
        >
          <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-border bg-card shadow-xl sm:rounded-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-border bg-card px-4 py-3">
              <h2 id="promo-modal-title" className="text-base font-bold text-foreground">
                {editando ? t.promoModalEdit : t.promoModalNew}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-2 text-muted-foreground hover:bg-muted"
                aria-label={t.promoCancel}
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3 px-4 py-4">
              {erro && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700" role="alert">
                  {erro}
                </p>
              )}
              <div>
                <label className="mb-1 block text-xs font-semibold">{t.promoFieldName}</label>
                <input
                  value={form.nome}
                  onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold">{t.promoFieldDisplayName}</label>
                <input
                  value={form.nomeExibicao}
                  onChange={(e) => setForm((f) => ({ ...f, nomeExibicao: e.target.value }))}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder=""
                />
                <p className="mt-1 text-[11px] text-muted-foreground">{t.promoFieldDisplayNameHint}</p>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold">{t.promoFieldType}</label>
                <select
                  value={form.tipo}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, tipo: e.target.value as PromocaoTipo }))
                  }
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {TIPOS.map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {tipoLabel[tipo]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold">{t.promoFieldPercent}</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  step={0.01}
                  value={form.percentual}
                  onChange={(e) => setForm((f) => ({ ...f, percentual: e.target.value }))}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              {form.tipo === 'subtotal_minimo_percentual' && (
                <div>
                  <label className="mb-1 block text-xs font-semibold">{t.promoFieldMinSubtotal}</label>
                  <input
                    type="number"
                    min={0.01}
                    step={0.01}
                    value={form.valorMinimo}
                    onChange={(e) => setForm((f) => ({ ...f, valorMinimo: e.target.value }))}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              )}
              {form.tipo === 'codigo_promocional' && (
                <>
                  <div>
                    <label className="mb-1 block text-xs font-semibold">{t.promoFieldCode}</label>
                    <input
                      value={form.codigo}
                      onChange={(e) => setForm((f) => ({ ...f, codigo: e.target.value }))}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm uppercase outline-none focus:ring-2 focus:ring-primary/20"
                      autoComplete="off"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold">{t.promoFieldCodeMinSubtotal}</label>
                    <input
                      type="number"
                      min={0.01}
                      step={0.01}
                      value={form.valorMinimo}
                      onChange={(e) => setForm((f) => ({ ...f, valorMinimo: e.target.value }))}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </>
              )}
              {form.tipo === 'categoria_percentual' && (
                <div>
                  <label className="mb-1 block text-xs font-semibold">{t.promoFieldCategory}</label>
                  <select
                    value={form.categoriaId}
                    onChange={(e) => setForm((f) => ({ ...f, categoriaId: e.target.value }))}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">{t.promoSelectCategory}</option>
                    {categorias.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.ativo}
                  onChange={(e) => setForm((f) => ({ ...f, ativo: e.target.checked }))}
                  className="rounded border-border"
                />
                {t.promoFieldActive}
              </label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold">{t.promoFieldValidFrom}</label>
                  <input
                    type="date"
                    value={form.validFrom}
                    onChange={(e) => setForm((f) => ({ ...f, validFrom: e.target.value }))}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold">{t.promoFieldValidTo}</label>
                  <input
                    type="date"
                    value={form.validTo}
                    onChange={(e) => setForm((f) => ({ ...f, validTo: e.target.value }))}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 rounded-xl border border-border py-3 text-sm font-semibold"
                >
                  {t.promoCancel}
                </button>
                <button
                  type="button"
                  disabled={salvando}
                  onClick={() => void salvar()}
                  className={cn(
                    'flex-1 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground disabled:opacity-60'
                  )}
                >
                  {salvando ? '…' : t.promoSave}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
