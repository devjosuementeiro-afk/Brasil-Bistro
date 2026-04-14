'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ChefHat, ImageIcon, Loader2, Pencil, Plus, Tag, Trash2, Upload, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/lib/lang-context'
import { LogoLoadingScreen } from '@/components/logo-loading-screen'
import { cn } from '@/lib/utils'

const CARDAPIO_BUCKET = 'cardapio-imagens'

function pathFromPublicStorageUrl(url: string): string | null {
  const marker = `/storage/v1/object/public/${CARDAPIO_BUCKET}/`
  const idx = url.indexOf(marker)
  if (idx === -1) return null
  const raw = url.slice(idx + marker.length).split('?')[0]
  try {
    return decodeURIComponent(raw)
  } catch {
    return raw
  }
}

type PromocaoTipo =
  | 'subtotal_minimo_percentual'
  | 'codigo_promocional'
  | 'categoria_percentual'
  | 'delivery_gratis_subtotal_minimo'
  | 'compre_x_ganhe_y'

type CategoriaRow = { id: string; nome: string }
type ItemCardapioRow = { id: string; nome: string }

function idsFromDb(v: unknown): string[] {
  if (v == null) return []
  if (!Array.isArray(v)) return []
  return v.filter((x): x is string => typeof x === 'string' && x.length > 0)
}

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
  imagem_banner_url: string | null
  banner_ordem: number | null
  cupom_categoria_ids: string[] | null
  cupom_item_ids: string[] | null
  compre_x_item_id: string | null
  compre_x_qtd: number | null
  ganhe_item_id: string | null
  ganhe_qtd: number | null
  categorias: { nome: string } | null
}

const TIPOS: PromocaoTipo[] = [
  'subtotal_minimo_percentual',
  'codigo_promocional',
  'categoria_percentual',
  'delivery_gratis_subtotal_minimo',
  'compre_x_ganhe_y',
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

function PromoBannerUploader({
  supabase,
  url,
  onUrl,
  t,
}: {
  supabase: ReturnType<typeof createClient>
  url: string
  onUrl: (u: string) => void
  t: { [key: string]: string }
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [erro, setErro] = useState('')
  const [preview, setPreview] = useState(url)

  useEffect(() => {
    setPreview(url)
  }, [url])

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setErro('')

    if (file.size > 5 * 1024 * 1024) {
      setErro(t.fileTooLarge)
      return
    }
    if (!file.type.startsWith('image/')) {
      setErro(t.invalidFile)
      return
    }

    const localUrl = URL.createObjectURL(file)
    setPreview(localUrl)
    setUploading(true)

    try {
      const ext = file.name.split('.').pop() || 'jpg'
      const nome = `promocoes/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      if (url) {
        const oldPath = pathFromPublicStorageUrl(url)
        if (oldPath) await supabase.storage.from(CARDAPIO_BUCKET).remove([oldPath])
      }

      const { error: uploadError } = await supabase.storage
        .from(CARDAPIO_BUCKET)
        .upload(nome, file, { cacheControl: '3600', upsert: false })

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from(CARDAPIO_BUCKET).getPublicUrl(nome)
      onUrl(data.publicUrl)
    } catch {
      setErro(t.uploadError)
      setPreview(url)
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function handleRemover() {
    if (!url) return
    const path = pathFromPublicStorageUrl(url)
    if (path) await supabase.storage.from(CARDAPIO_BUCKET).remove([path])
    setPreview('')
    onUrl('')
  }

  return (
    <div>
      <label className="mb-1 block text-xs font-semibold">{t.promoFieldBannerImage}</label>
      {preview ? (
        <div className="relative h-36 overflow-hidden rounded-2xl bg-secondary">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="" className="h-full w-full object-cover" />
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <Loader2 size={28} className="animate-spin text-white" />
            </div>
          )}
          {!uploading && (
            <div className="absolute right-2 top-2 flex gap-2">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 shadow"
                aria-label="Trocar imagem"
              >
                <Upload size={14} className="text-foreground" />
              </button>
              <button
                type="button"
                onClick={() => void handleRemover()}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500 shadow"
                aria-label="Remover imagem"
              >
                <X size={14} className="text-white" />
              </button>
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex h-36 w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-secondary transition-colors active:border-primary/40 active:bg-primary/5 disabled:opacity-60"
        >
          {uploading ? (
            <Loader2 size={24} className="animate-spin text-primary" />
          ) : (
            <>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <ImageIcon size={20} className="text-primary" />
              </div>
              <p className="text-sm font-semibold text-foreground">{t.uploadPhoto}</p>
              <p className="text-xs text-muted-foreground">{t.uploadHint}</p>
            </>
          )}
        </button>
      )}
      {erro && <p className="mt-1.5 text-xs font-medium text-red-500">{erro}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  )
}

export default function AdminPromocoesPage() {
  const supabase = createClient()
  const { t } = useLang()
  const [loading, setLoading] = useState(true)
  const [promocoes, setPromocoes] = useState<PromocaoRow[]>([])
  const [categorias, setCategorias] = useState<CategoriaRow[]>([])
  const [itensCardapio, setItensCardapio] = useState<ItemCardapioRow[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<PromocaoRow | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [deliveryFeeDraft, setDeliveryFeeDraft] = useState('0')
  const [deliveryFeeSaving, setDeliveryFeeSaving] = useState(false)

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
    imagemBannerUrl: '',
    bannerOrdem: '0',
    cupomCategoriaIds: [] as string[],
    cupomItemIds: [] as string[],
    compreXItemId: '',
    compreXQtd: '',
    ganheItemId: '',
    ganheQtd: '1',
  })

  const tipoLabel = useMemo(
    () => ({
      subtotal_minimo_percentual: t.promoTipoSubtotal,
      codigo_promocional: t.promoTipoCodigo,
      categoria_percentual: t.promoTipoCategoria,
      delivery_gratis_subtotal_minimo: t.promoTipoDeliveryGratis,
      compre_x_ganhe_y: t.promoTipoCompreGanhe,
    }),
    [t]
  )

  const load = useCallback(async () => {
    setLoading(true)
    setErro(null)
    const [
      { data: promos, error: e1 },
      { data: cats, error: e2 },
      { data: menuItems, error: e3 },
      { data: cfg, error: e4 },
    ] =
      await Promise.all([
        supabase
          .from('promocoes')
          .select('*, categorias(nome)')
          .order('criado_em', { ascending: false }),
        supabase.from('categorias').select('id, nome').eq('ativo', true).order('ordem'),
        supabase.from('itens_cardapio').select('id, nome').eq('disponivel', true).order('nome'),
        supabase
          .from('configuracoes_loja')
          .select('id, taxa_entrega_padrao')
          .order('atualizado_em', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ])
    if (e1) setErro(e1.message)
    else setPromocoes((promos as PromocaoRow[]) ?? [])
    if (e2 && !e1) setErro(e2.message)
    if (e3 && !e1 && !e2) setErro(e3.message)
    if (e4 && !e1 && !e2 && !e3) setErro(e4.message)
    setCategorias((cats as CategoriaRow[]) ?? [])
    setItensCardapio((menuItems as ItemCardapioRow[]) ?? [])
    setDeliveryFeeDraft(String(Number(cfg?.taxa_entrega_padrao ?? 0).toFixed(2)))
    setLoading(false)
  }, [supabase])

  async function salvarTaxaEntrega() {
    const fee = Number(deliveryFeeDraft)
    if (!Number.isFinite(fee) || fee < 0) {
      setErro(t.promoErrDeliveryFee)
      return
    }
    setDeliveryFeeSaving(true)
    setErro(null)
    try {
      const { data: existing, error: fetchError } = await supabase
        .from('configuracoes_loja')
        .select('id')
        .order('atualizado_em', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (fetchError) throw fetchError
      if (existing?.id) {
        const { error } = await supabase
          .from('configuracoes_loja')
          .update({ taxa_entrega_padrao: Number(fee.toFixed(2)) })
          .eq('id', existing.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('configuracoes_loja')
          .insert({ taxa_entrega_padrao: Number(fee.toFixed(2)) })
        if (error) throw error
      }
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : String(e))
    } finally {
      setDeliveryFeeSaving(false)
    }
  }

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
      imagemBannerUrl: '',
      bannerOrdem: '0',
      cupomCategoriaIds: [],
      cupomItemIds: [],
      compreXItemId: '',
      compreXQtd: '',
      ganheItemId: '',
      ganheQtd: '1',
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
      imagemBannerUrl: p.imagem_banner_url ?? '',
      bannerOrdem: String(p.banner_ordem ?? 0),
      cupomCategoriaIds: idsFromDb(p.cupom_categoria_ids),
      cupomItemIds: idsFromDb(p.cupom_item_ids),
      compreXItemId: p.compre_x_item_id ?? '',
      compreXQtd: p.compre_x_qtd != null ? String(p.compre_x_qtd) : '',
      ganheItemId: p.ganhe_item_id ?? '',
      ganheQtd: p.ganhe_qtd != null ? String(p.ganhe_qtd) : '1',
    })
    setErro(null)
    setModalOpen(true)
  }

  function toggleCupomCategoria(id: string) {
    setForm((f) => ({
      ...f,
      cupomCategoriaIds: f.cupomCategoriaIds.includes(id)
        ? f.cupomCategoriaIds.filter((x) => x !== id)
        : [...f.cupomCategoriaIds, id],
    }))
  }

  function toggleCupomItem(id: string) {
    setForm((f) => ({
      ...f,
      cupomItemIds: f.cupomItemIds.includes(id)
        ? f.cupomItemIds.filter((x) => x !== id)
        : [...f.cupomItemIds, id],
    }))
  }

  function validar(): string | null {
    if (!form.nome.trim()) return t.promoErrName
    if (form.tipo !== 'delivery_gratis_subtotal_minimo' && form.tipo !== 'compre_x_ganhe_y') {
      const pct = Number(form.percentual)
      if (!Number.isFinite(pct) || pct <= 0 || pct > 100) return t.promoErrPercent
    }
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
    if (form.tipo === 'delivery_gratis_subtotal_minimo') {
      const m = Number(form.valorMinimo)
      if (!Number.isFinite(m) || m <= 0) return t.promoErrMinSubtotal
    }
    if (form.tipo === 'compre_x_ganhe_y') {
      if (!form.compreXItemId || !form.ganheItemId) return t.promoErrBuyXGetYItems
      const x = Number(form.compreXQtd)
      const y = Number(form.ganheQtd)
      if (!Number.isFinite(x) || x <= 0 || !Number.isFinite(y) || y <= 0) {
        return t.promoErrBuyXGetYQty
      }
    }
    return null
  }

  function buildRowPayload() {
    const pct =
      form.tipo === 'delivery_gratis_subtotal_minimo' || form.tipo === 'compre_x_ganhe_y'
        ? 100
        : Number(form.percentual)
    const nomeEx = form.nomeExibicao.trim()
    const base = {
      nome: form.nome.trim(),
      nome_exibicao: nomeEx.length > 0 ? nomeEx : null,
      tipo: form.tipo,
      ativo: form.ativo,
      percentual_desconto: pct,
      validade_inicio: fromDateStart(form.validFrom),
      validade_fim: fromDateEnd(form.validTo),
      imagem_banner_url: form.imagemBannerUrl.trim() || null,
      banner_ordem: Math.max(0, Math.floor(Number(form.bannerOrdem)) || 0),
    }
    if (form.tipo === 'subtotal_minimo_percentual') {
      return {
        ...base,
        valor_minimo_subtotal: Number(form.valorMinimo),
        codigo: null,
        categoria_id: null,
        cupom_categoria_ids: null,
        cupom_item_ids: null,
        compre_x_item_id: null,
        compre_x_qtd: null,
        ganhe_item_id: null,
        ganhe_qtd: null,
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
        cupom_categoria_ids: form.cupomCategoriaIds.length > 0 ? form.cupomCategoriaIds : null,
        cupom_item_ids: form.cupomItemIds.length > 0 ? form.cupomItemIds : null,
        compre_x_item_id: null,
        compre_x_qtd: null,
        ganhe_item_id: null,
        ganhe_qtd: null,
      }
    }
    if (form.tipo === 'delivery_gratis_subtotal_minimo') {
      return {
        ...base,
        valor_minimo_subtotal: Number(form.valorMinimo),
        codigo: null,
        categoria_id: null,
        cupom_categoria_ids: null,
        cupom_item_ids: null,
        compre_x_item_id: null,
        compre_x_qtd: null,
        ganhe_item_id: null,
        ganhe_qtd: null,
      }
    }
    if (form.tipo === 'compre_x_ganhe_y') {
      return {
        ...base,
        valor_minimo_subtotal: null,
        codigo: null,
        categoria_id: null,
        cupom_categoria_ids: null,
        cupom_item_ids: null,
        compre_x_item_id: form.compreXItemId,
        compre_x_qtd: Math.max(1, Math.floor(Number(form.compreXQtd))),
        ganhe_item_id: form.ganheItemId,
        ganhe_qtd: Math.max(1, Math.floor(Number(form.ganheQtd))),
      }
    }
    return {
      ...base,
      valor_minimo_subtotal: null,
      codigo: null,
      categoria_id: form.categoriaId,
      cupom_categoria_ids: null,
      cupom_item_ids: null,
      compre_x_item_id: null,
      compre_x_qtd: null,
      ganhe_item_id: null,
      ganhe_qtd: null,
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

  async function excluir(p: PromocaoRow) {
    if (!confirm(t.promoDeleteConfirm)) return
    setErro(null)
    try {
      if (p.imagem_banner_url) {
        const path = pathFromPublicStorageUrl(p.imagem_banner_url)
        if (path) await supabase.storage.from(CARDAPIO_BUCKET).remove([path])
      }
      const { error } = await supabase.from('promocoes').delete().eq('id', p.id)
      if (error) throw error
      void load()
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : String(e))
    }
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
      const nc = idsFromDb(p.cupom_categoria_ids).length
      const ni = idsFromDb(p.cupom_item_ids).length
      const scope =
        nc + ni > 0 ? ` · ${nc > 0 ? `${nc} cat.` : ''}${nc > 0 && ni > 0 ? ' ' : ''}${ni > 0 ? `${ni} prod.` : ''}` : ''
      return `${p.codigo ?? '—'}${min} → ${pct}${scope}`
    }
    if (p.tipo === 'delivery_gratis_subtotal_minimo') {
      return `≥ $${Number(p.valor_minimo_subtotal ?? 0).toFixed(2)} → ${t.promoDeliveryFreeLabel}`
    }
    if (p.tipo === 'compre_x_ganhe_y') {
      return `${t.promoBuyXGetYLabel} (${Number(p.compre_x_qtd ?? 0)} x ${p.compre_x_item_id ?? '—'} → ${Number(p.ganhe_qtd ?? 0)} x ${p.ganhe_item_id ?? '—'})`
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
        <div className="mb-4 rounded-2xl border border-border bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-foreground">{t.promoDeliveryFeeTitle}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t.promoDeliveryFeeHint}</p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-semibold">{t.promoDeliveryFeeLabel}</label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={deliveryFeeDraft}
                onChange={(e) => setDeliveryFeeDraft(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <button
              type="button"
              onClick={() => void salvarTaxaEntrega()}
              disabled={deliveryFeeSaving}
              className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-60"
            >
              {deliveryFeeSaving ? '…' : t.promoDeliveryFeeSave}
            </button>
          </div>
        </div>

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
                  <div className="flex items-center gap-2 min-w-0">
                    {p.imagem_banner_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.imagem_banner_url}
                        alt=""
                        className="h-10 w-10 shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <ImageIcon size={16} className="text-muted-foreground" aria-hidden />
                      </span>
                    )}
                    <span className="font-semibold text-foreground truncate">{p.nome}</span>
                  </div>
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
                      onClick={() => void excluir(p)}
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
              <PromoBannerUploader
                supabase={supabase}
                url={form.imagemBannerUrl}
                onUrl={(u) => setForm((f) => ({ ...f, imagemBannerUrl: u }))}
                t={t}
              />
              <div>
                <label className="mb-1 block text-xs font-semibold">{t.promoFieldBannerOrder}</label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={form.bannerOrdem}
                  onChange={(e) => setForm((f) => ({ ...f, bannerOrdem: e.target.value }))}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
                <p className="mt-1 text-[11px] text-muted-foreground">{t.promoBannerImageHint}</p>
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
              {form.tipo !== 'delivery_gratis_subtotal_minimo' && form.tipo !== 'compre_x_ganhe_y' ? (
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
              ) : null}
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
                  <div>
                    <label className="mb-1 block text-xs font-semibold">{t.promoCouponCategories}</label>
                    <div className="max-h-36 space-y-2 overflow-y-auto rounded-xl border border-border bg-background px-2 py-2">
                      {categorias.length === 0 ? (
                        <p className="text-xs text-muted-foreground">—</p>
                      ) : (
                        categorias.map((c) => (
                          <label
                            key={c.id}
                            className="flex cursor-pointer items-center gap-2 rounded-lg px-1 py-1 text-sm hover:bg-muted/60"
                          >
                            <input
                              type="checkbox"
                              checked={form.cupomCategoriaIds.includes(c.id)}
                              onChange={() => toggleCupomCategoria(c.id)}
                              className="rounded border-border"
                            />
                            <span>{c.nome}</span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold">{t.promoCouponProducts}</label>
                    <div className="max-h-44 space-y-2 overflow-y-auto rounded-xl border border-border bg-background px-2 py-2">
                      {itensCardapio.length === 0 ? (
                        <p className="text-xs text-muted-foreground">—</p>
                      ) : (
                        itensCardapio.map((it) => (
                          <label
                            key={it.id}
                            className="flex cursor-pointer items-center gap-2 rounded-lg px-1 py-1 text-sm hover:bg-muted/60"
                          >
                            <input
                              type="checkbox"
                              checked={form.cupomItemIds.includes(it.id)}
                              onChange={() => toggleCupomItem(it.id)}
                              className="rounded border-border"
                            />
                            <span className="line-clamp-2">{it.nome}</span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                  <p className="text-[11px] leading-snug text-muted-foreground">{t.promoCouponScopeHint}</p>
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
              {form.tipo === 'delivery_gratis_subtotal_minimo' && (
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
              {form.tipo === 'compre_x_ganhe_y' && (
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold">{t.promoBuyXItem}</label>
                    <select
                      value={form.compreXItemId}
                      onChange={(e) => setForm((f) => ({ ...f, compreXItemId: e.target.value }))}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">{t.promoSelectProduct}</option>
                      {itensCardapio.map((it) => (
                        <option key={it.id} value={it.id}>
                          {it.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold">{t.promoBuyXQty}</label>
                    <input
                      type="number"
                      min={1}
                      step={1}
                      value={form.compreXQtd}
                      onChange={(e) => setForm((f) => ({ ...f, compreXQtd: e.target.value }))}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold">{t.promoGetYItem}</label>
                    <select
                      value={form.ganheItemId}
                      onChange={(e) => setForm((f) => ({ ...f, ganheItemId: e.target.value }))}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">{t.promoSelectProduct}</option>
                      {itensCardapio.map((it) => (
                        <option key={it.id} value={it.id}>
                          {it.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold">{t.promoGetYQty}</label>
                    <input
                      type="number"
                      min={1}
                      step={1}
                      value={form.ganheQtd}
                      onChange={(e) => setForm((f) => ({ ...f, ganheQtd: e.target.value }))}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
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
