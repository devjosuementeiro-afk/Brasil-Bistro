'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Plus, Pencil, Trash2, LogOut, ChefHat, X, Check,
  Eye, EyeOff, Star, Package, ImageIcon, Upload, Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLang } from '@/lib/lang-context'

const BUCKET = 'cardapio-imagens'

interface Categoria {
  id: string
  nome: string
  icone: string | null
  ordem: number
  ativo: boolean
}

interface Item {
  id: string
  nome: string
  descricao: string | null
  preco: number
  imagem_url: string | null
  quantidade_info: string | null
  tamanhos_disponiveis: string | null
  ingredientes_info: string | null
  alergenicos_alerta: string | null
  disponivel: boolean
  destaque: boolean
  categoria_id: string | null
  ordem: number
  categorias: Categoria | null
}

type OptionLine = {
  label: string
  priceDelta: number
  /** Texto livre (descrição, peso, observação) — persiste em `detail_info` no banco */
  info: string
  ordem: number
}

type ExtraGroupForm = {
  key: string
  grupoId?: string
  nome: string
  minEscolhas: number | null
  maxEscolhas: number | null
  options: OptionLine[]
}

function sameCategoriaKey(
  a: string | null | undefined,
  b: string | null | undefined
): boolean {
  return (a ?? '') === (b ?? '')
}

type SupabaseClient = ReturnType<typeof createClient>

/** Renumera `ordem` 1..n sem violar UNIQUE (categoria_id, ordem) em duas passadas. */
async function persistOrdensItensNaLista(supabase: SupabaseClient, orderedIds: string[]) {
  if (orderedIds.length === 0) return
  const step = 1000
  for (let i = 0; i < orderedIds.length; i++) {
    await supabase.from('itens_cardapio').update({ ordem: (i + 1) * step }).eq('id', orderedIds[i])
  }
  for (let i = 0; i < orderedIds.length; i++) {
    await supabase.from('itens_cardapio').update({ ordem: i + 1 }).eq('id', orderedIds[i])
  }
}

async function persistOrdensCategoriasNaLista(supabase: SupabaseClient, orderedIds: string[]) {
  if (orderedIds.length === 0) return
  const step = 1000
  for (let i = 0; i < orderedIds.length; i++) {
    await supabase.from('categorias').update({ ordem: (i + 1) * step }).eq('id', orderedIds[i])
  }
  for (let i = 0; i < orderedIds.length; i++) {
    await supabase.from('categorias').update({ ordem: i + 1 }).eq('id', orderedIds[i])
  }
}

export default function AdminPage() {
  const router = useRouter()
  const supabase = createClient()
  const { t, lang, toggleLang } = useLang()

  const TABS = [t.tabItems, t.tabCategories] as const
  type Tab = typeof TABS[number]

  const [tab, setTab] = useState<Tab>(t.tabItems)
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [itens, setItens] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)

  // Modal item
  const [modalItem, setModalItem] = useState(false)
  const [itemEditando, setItemEditando] = useState<Item | null>(null)
  const [formItem, setFormItem] = useState({
    nome: '', descricao: '', preco: '', imagem_url: '',
    quantidade_info: '', tamanhos_disponiveis: '', ingredientes_info: '', alergenicos_alerta: '',
    size_options: [] as OptionLine[],
    quantity_options: [] as OptionLine[],
    extra_groups: [] as ExtraGroupForm[],
    categoria_id: '', disponivel: true, destaque: false, ordem: 0,
  })
  const [salvandoItem, setSalvandoItem] = useState(false)

  // Modal categoria
  const [modalCat, setModalCat] = useState(false)
  const [catEditando, setCatEditando] = useState<Categoria | null>(null)
  const [formCat, setFormCat] = useState({ nome: '', icone: '', ordem: 0, ativo: true })
  const [salvandoCat, setSalvandoCat] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [{ data: cats }, { data: its }] = await Promise.all([
      supabase.from('categorias').select('*').order('ordem'),
      supabase.from('itens_cardapio').select('*, categorias(id, nome, icone, ordem, ativo)').order('ordem'),
    ])
    setCategorias(cats ?? [])
    setItens(its ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchData() }, [fetchData])

  // Reset tab label when lang changes
  useEffect(() => { setTab(t.tabItems) }, [lang, t.tabItems])

  const maxPosicaoItem = useMemo(() => {
    if (!modalItem) return 1
    const catKey = formItem.categoria_id || null
    const n = itens.filter(
      (i) =>
        sameCategoriaKey(i.categoria_id, catKey) &&
        (!itemEditando || i.id !== itemEditando.id)
    ).length
    return Math.max(1, n + 1)
  }, [modalItem, formItem.categoria_id, itemEditando, itens])

  const maxPosicaoCategoria = useMemo(() => {
    if (!modalCat) return 1
    const n = categorias.filter((c) => !catEditando || c.id !== catEditando.id).length
    return Math.max(1, n + 1)
  }, [modalCat, catEditando, categorias])

  useEffect(() => {
    if (!modalItem) return
    if (formItem.ordem < 1 || formItem.ordem > maxPosicaoItem) {
      setFormItem((p) => ({ ...p, ordem: maxPosicaoItem }))
    }
  }, [modalItem, maxPosicaoItem, formItem.categoria_id, itemEditando?.id])

  useEffect(() => {
    if (!modalCat) return
    if (formCat.ordem < 1 || formCat.ordem > maxPosicaoCategoria) {
      setFormCat((p) => ({ ...p, ordem: maxPosicaoCategoria }))
    }
  }, [modalCat, maxPosicaoCategoria])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  // ---- ITEM ----
  function normalizeOptionLines(lines: OptionLine[]) {
    return lines
      .map((line, index) => ({
        label: line.label.trim(),
        priceDelta: Number(line.priceDelta) || 0,
        info: line.info.trim(),
        ordem: index,
      }))
      .filter((line) => line.label.length > 0)
  }

  async function loadOptions(itemId: string) {
    const { data: groups } = await supabase
      .from('item_opcao_grupos')
      .select('id, tipo, nome, min_escolhas, max_escolhas, ordem')
      .eq('item_id', itemId)
      .order('ordem')

    if (!groups?.length) {
      return {
        sizeOptions: [] as OptionLine[],
        quantityOptions: [] as OptionLine[],
        extraGroups: [] as ExtraGroupForm[],
      }
    }

    const groupIds = groups.map((g) => g.id)
    const { data: options } = await supabase
      .from('item_opcoes')
      .select('grupo_id, label, price_delta, detail_info, ordem')
      .in('grupo_id', groupIds)
      .eq('ativo', true)
      .order('ordem')

    const byGroup = new Map<string, OptionLine[]>()
    ;(options ?? []).forEach((op) => {
      const line: OptionLine = {
        label: op.label,
        priceDelta: Number(op.price_delta ?? 0),
        info: op.detail_info ?? '',
        ordem: Number(op.ordem ?? 0),
      }
      byGroup.set(op.grupo_id, [...(byGroup.get(op.grupo_id) ?? []), line])
    })

    const sizeGroup = groups.find((g) => g.tipo === 'size')
    const quantityGroup = groups.find((g) => g.tipo === 'quantity')
    const extraGroups: ExtraGroupForm[] = groups
      .filter((g) => g.tipo === 'extra')
      .map((g) => ({
        key: g.id,
        grupoId: g.id,
        nome: g.nome ?? '',
        minEscolhas: g.min_escolhas == null ? null : Number(g.min_escolhas),
        maxEscolhas: g.max_escolhas == null ? null : Number(g.max_escolhas),
        options: byGroup.get(g.id) ?? [],
      }))

    return {
      sizeOptions: sizeGroup ? (byGroup.get(sizeGroup.id) ?? []) : [],
      quantityOptions: quantityGroup ? (byGroup.get(quantityGroup.id) ?? []) : [],
      extraGroups,
    }
  }

  async function saveOptionGroup(
    itemId: string,
    tipo: 'size' | 'quantity',
    nome: string,
    lines: OptionLine[]
  ) {
    const { data: existingGroup } = await supabase
      .from('item_opcao_grupos')
      .select('id')
      .eq('item_id', itemId)
      .eq('tipo', tipo)
      .maybeSingle()

    if (!lines.length) {
      if (existingGroup?.id) {
        await supabase.from('item_opcao_grupos').delete().eq('id', existingGroup.id)
      }
      return
    }

    let groupId = existingGroup?.id as string | undefined
    if (!groupId) {
      const { data: inserted } = await supabase
        .from('item_opcao_grupos')
        .insert({
          item_id: itemId,
          tipo,
          nome,
          obrigatorio: true,
          ordem: tipo === 'size' ? 1 : 2,
          min_escolhas: 1,
          max_escolhas: 1,
        })
        .select('id')
        .single()
      groupId = inserted?.id
    } else {
      await supabase
        .from('item_opcao_grupos')
        .update({ nome, min_escolhas: 1, max_escolhas: 1 })
        .eq('id', groupId)
    }

    if (!groupId) return
    await supabase.from('item_opcoes').delete().eq('grupo_id', groupId)
    await supabase.from('item_opcoes').insert(
      lines.map((line) => ({
        grupo_id: groupId,
        label: line.label,
        price_delta: line.priceDelta,
        detail_info: line.info || null,
        ordem: line.ordem,
        ativo: true,
      }))
    )
  }

  async function saveExtraGroups(itemId: string, groups: ExtraGroupForm[]) {
    const prepared = groups
      .map((g, index) => {
        let min =
          g.minEscolhas == null ? null : Math.max(0, Math.floor(Number(g.minEscolhas)))
        let max =
          g.maxEscolhas == null ? null : Math.max(0, Math.floor(Number(g.maxEscolhas)))
        if (min !== null && Number.isNaN(min)) min = null
        if (max !== null && Number.isNaN(max)) max = null
        if (min !== null && max !== null && max < min) max = min
        const lines = normalizeOptionLines(g.options)
        const nome = g.nome.trim()
        return {
          key: g.key,
          grupoId: g.grupoId,
          nome,
          minEscolhas: min,
          maxEscolhas: max,
          lines,
          ordem: 10 + index,
        }
      })
      .filter((g) => g.nome.length > 0 && g.lines.length > 0)

    const { data: existingRows } = await supabase
      .from('item_opcao_grupos')
      .select('id')
      .eq('item_id', itemId)
      .eq('tipo', 'extra')

    const existingIds = new Set((existingRows ?? []).map((r) => r.id))
    const kept = new Set<string>()

    for (const g of prepared) {
      let groupId = g.grupoId
      if (groupId && existingIds.has(groupId)) {
        await supabase
          .from('item_opcao_grupos')
          .update({
            nome: g.nome,
            min_escolhas: g.minEscolhas,
            max_escolhas: g.maxEscolhas,
            ordem: g.ordem,
            obrigatorio: (g.minEscolhas ?? 0) > 0,
          })
          .eq('id', groupId)
        kept.add(groupId)
      } else {
        const { data: inserted } = await supabase
          .from('item_opcao_grupos')
          .insert({
            item_id: itemId,
            tipo: 'extra',
            nome: g.nome,
            min_escolhas: g.minEscolhas,
            max_escolhas: g.maxEscolhas,
            ordem: g.ordem,
            obrigatorio: (g.minEscolhas ?? 0) > 0,
          })
          .select('id')
          .single()
        groupId = inserted?.id
        if (groupId) kept.add(groupId)
      }

      if (!groupId) continue
      await supabase.from('item_opcoes').delete().eq('grupo_id', groupId)
      await supabase.from('item_opcoes').insert(
        g.lines.map((line) => ({
          grupo_id: groupId,
          label: line.label,
          price_delta: line.priceDelta,
          detail_info: line.info || null,
          ordem: line.ordem,
          ativo: true,
        }))
      )
    }

    for (const id of existingIds) {
      if (!kept.has(id)) {
        await supabase.from('item_opcao_grupos').delete().eq('id', id)
      }
    }
  }

  function addOptionLine(kind: 'size' | 'quantity') {
    setFormItem((prev) => ({
      ...prev,
      [kind === 'size' ? 'size_options' : 'quantity_options']: [
        ...(kind === 'size' ? prev.size_options : prev.quantity_options),
        {
          label: '',
          priceDelta: 0,
          info: '',
          ordem: (kind === 'size' ? prev.size_options : prev.quantity_options).length,
        },
      ],
    }))
  }

  function updateOptionLine(
    kind: 'size' | 'quantity',
    index: number,
    patch: Partial<OptionLine>
  ) {
    setFormItem((prev) => {
      const target = kind === 'size' ? prev.size_options : prev.quantity_options
      const next = target.map((line, i) => (i === index ? { ...line, ...patch } : line))
      return {
        ...prev,
        [kind === 'size' ? 'size_options' : 'quantity_options']: next,
      }
    })
  }

  function removeOptionLine(kind: 'size' | 'quantity', index: number) {
    setFormItem((prev) => {
      const target = kind === 'size' ? prev.size_options : prev.quantity_options
      const next = target.filter((_, i) => i !== index)
      return {
        ...prev,
        [kind === 'size' ? 'size_options' : 'quantity_options']: next,
      }
    })
  }

  function addExtraGroup() {
    setFormItem((prev) => ({
      ...prev,
      extra_groups: [
        ...prev.extra_groups,
        {
          key: crypto.randomUUID(),
          nome: '',
          minEscolhas: null,
          maxEscolhas: null,
          options: [],
        },
      ],
    }))
  }

  function removeExtraGroup(index: number) {
    setFormItem((prev) => ({
      ...prev,
      extra_groups: prev.extra_groups.filter((_, i) => i !== index),
    }))
  }

  function updateExtraGroup(index: number, patch: Partial<Omit<ExtraGroupForm, 'key' | 'options'>>) {
    setFormItem((prev) => {
      const next = prev.extra_groups.map((g, i) => (i === index ? { ...g, ...patch } : g))
      return { ...prev, extra_groups: next }
    })
  }

  function addExtraOptionLine(groupIndex: number) {
    setFormItem((prev) => {
      const g = prev.extra_groups[groupIndex]
      if (!g) return prev
      const options = [
        ...g.options,
        {
          label: '',
          priceDelta: 0,
          info: '',
          ordem: g.options.length,
        },
      ]
      const extra_groups = prev.extra_groups.map((gr, i) => (i === groupIndex ? { ...gr, options } : gr))
      return { ...prev, extra_groups }
    })
  }

  function updateExtraOptionLine(
    groupIndex: number,
    optIndex: number,
    patch: Partial<OptionLine>
  ) {
    setFormItem((prev) => {
      const g = prev.extra_groups[groupIndex]
      if (!g) return prev
      const options = g.options.map((line, i) => (i === optIndex ? { ...line, ...patch } : line))
      const extra_groups = prev.extra_groups.map((gr, i) => (i === groupIndex ? { ...gr, options } : gr))
      return { ...prev, extra_groups }
    })
  }

  function removeExtraOptionLine(groupIndex: number, optIndex: number) {
    setFormItem((prev) => {
      const g = prev.extra_groups[groupIndex]
      if (!g) return prev
      const options = g.options.filter((_, i) => i !== optIndex)
      const extra_groups = prev.extra_groups.map((gr, i) => (i === groupIndex ? { ...gr, options } : gr))
      return { ...prev, extra_groups }
    })
  }

  function abrirNovoItem() {
    setItemEditando(null)
    const catKey = ''
    const outros = itens
      .filter((i) => sameCategoriaKey(i.categoria_id, catKey))
      .sort((a, b) => a.ordem - b.ordem || a.id.localeCompare(b.id))
    setFormItem({
      nome: '',
      descricao: '',
      preco: '',
      imagem_url: '',
      quantidade_info: '',
      tamanhos_disponiveis: '',
      ingredientes_info: '',
      alergenicos_alerta: '',
      size_options: [],
      quantity_options: [],
      extra_groups: [],
      categoria_id: '',
      disponivel: true,
      destaque: false,
      ordem: outros.length + 1,
    })
    setModalItem(true)
  }

  async function abrirEditarItem(item: Item) {
    setItemEditando(item)
    const optionData = await loadOptions(item.id)
    const mesmaCat = itens
      .filter((i) => sameCategoriaKey(i.categoria_id, item.categoria_id))
      .sort((a, b) => a.ordem - b.ordem || a.id.localeCompare(b.id))
    const posicao = Math.max(1, mesmaCat.findIndex((i) => i.id === item.id) + 1)
    setFormItem({
      nome: item.nome,
      descricao: item.descricao ?? '',
      preco: item.preco.toString(),
      imagem_url: item.imagem_url ?? '',
      quantidade_info: item.quantidade_info ?? '',
      tamanhos_disponiveis: item.tamanhos_disponiveis ?? '',
      ingredientes_info: item.ingredientes_info ?? '',
      alergenicos_alerta: item.alergenicos_alerta ?? '',
      size_options: optionData.sizeOptions,
      quantity_options: optionData.quantityOptions,
      extra_groups: optionData.extraGroups,
      categoria_id: item.categoria_id ?? '',
      disponivel: item.disponivel,
      destaque: item.destaque,
      ordem: posicao,
    })
    setModalItem(true)
  }

  async function salvarItem() {
    if (!formItem.nome || !formItem.preco) return
    setSalvandoItem(true)
    const catIdNorm = formItem.categoria_id.trim() || null

    const outros = itens
      .filter(
        (i) =>
          sameCategoriaKey(i.categoria_id, catIdNorm) &&
          (!itemEditando || i.id !== itemEditando.id)
      )
      .sort((a, b) => a.ordem - b.ordem || a.id.localeCompare(b.id))

    const maxPos = outros.length + 1
    const pos = Math.min(Math.max(1, formItem.ordem || 1), maxPos)

    const payloadBase = {
      nome: formItem.nome.trim(),
      descricao: formItem.descricao.trim() || null,
      preco: parseFloat(formItem.preco.replace(',', '.')),
      imagem_url: formItem.imagem_url.trim() || null,
      quantidade_info: formItem.quantidade_info.trim() || null,
      tamanhos_disponiveis: formItem.tamanhos_disponiveis.trim() || null,
      ingredientes_info: formItem.ingredientes_info.trim() || null,
      alergenicos_alerta: formItem.alergenicos_alerta.trim() || null,
      categoria_id: catIdNorm,
      disponivel: formItem.disponivel,
      destaque: formItem.destaque,
    }

    const montarIdsOrdenados = (itemId: string) => [
      ...outros.slice(0, pos - 1).map((i) => i.id),
      itemId,
      ...outros.slice(pos - 1).map((i) => i.id),
    ]

    try {
      if (itemEditando) {
        const id = itemEditando.id
        const oldCat = itemEditando.categoria_id
        await supabase.from('itens_cardapio').update(payloadBase).eq('id', id)

        if (!sameCategoriaKey(oldCat, catIdNorm)) {
          const oldRest = itens
            .filter((i) => i.id !== id && sameCategoriaKey(i.categoria_id, oldCat))
            .sort((a, b) => a.ordem - b.ordem || a.id.localeCompare(b.id))
          await persistOrdensItensNaLista(supabase, oldRest.map((i) => i.id))

          const newOthers = itens
            .filter((i) => i.id !== id && sameCategoriaKey(i.categoria_id, catIdNorm))
            .sort((a, b) => a.ordem - b.ordem || a.id.localeCompare(b.id))
          const newOrdered = [
            ...newOthers.slice(0, pos - 1).map((i) => i.id),
            id,
            ...newOthers.slice(pos - 1).map((i) => i.id),
          ]
          await persistOrdensItensNaLista(supabase, newOrdered)
        } else {
          await persistOrdensItensNaLista(supabase, montarIdsOrdenados(id))
        }

        await saveOptionGroup(id, 'size', 'Tamanho', normalizeOptionLines(formItem.size_options))
        await saveOptionGroup(id, 'quantity', 'Quantidade', normalizeOptionLines(formItem.quantity_options))
        await saveExtraGroups(id, formItem.extra_groups)
      } else {
        const nextOrdem = outros.length > 0 ? Math.max(...outros.map((o) => o.ordem)) + 1 : 1
        const { data: inserted } = await supabase
          .from('itens_cardapio')
          .insert({ ...payloadBase, ordem: nextOrdem })
          .select('id')
          .single()
        const newId = inserted?.id
        if (newId) {
          await persistOrdensItensNaLista(supabase, montarIdsOrdenados(newId))
          await saveOptionGroup(newId, 'size', 'Tamanho', normalizeOptionLines(formItem.size_options))
          await saveOptionGroup(newId, 'quantity', 'Quantidade', normalizeOptionLines(formItem.quantity_options))
          await saveExtraGroups(newId, formItem.extra_groups)
        }
      }
    } finally {
      setSalvandoItem(false)
      setModalItem(false)
      fetchData()
    }
  }

  async function excluirItem(id: string) {
    if (!confirm(t.deleteItemConfirm)) return
    const item = itens.find((i) => i.id === id)
    if (item?.imagem_url) {
      const path = item.imagem_url.split(`${BUCKET}/`)[1]
      if (path) await supabase.storage.from(BUCKET).remove([path])
    }
    await supabase.from('itens_cardapio').delete().eq('id', id)
    if (item) {
      const rest = itens
        .filter((i) => i.id !== id && sameCategoriaKey(i.categoria_id, item.categoria_id))
        .sort((a, b) => a.ordem - b.ordem || a.id.localeCompare(b.id))
      await persistOrdensItensNaLista(supabase, rest.map((i) => i.id))
    }
    fetchData()
  }

  async function toggleDisponivel(item: Item) {
    await supabase.from('itens_cardapio').update({ disponivel: !item.disponivel }).eq('id', item.id)
    fetchData()
  }

  // ---- CATEGORIA ----
  function abrirNovaCat() {
    setCatEditando(null)
    setFormCat({
      nome: '',
      icone: '',
      ordem: Math.max(1, categorias.length + 1),
      ativo: true,
    })
    setModalCat(true)
  }

  function abrirEditarCat(cat: Categoria) {
    setCatEditando(cat)
    const sorted = [...categorias].sort(
      (a, b) => a.ordem - b.ordem || a.id.localeCompare(b.id)
    )
    const pos = Math.max(1, sorted.findIndex((c) => c.id === cat.id) + 1)
    setFormCat({ nome: cat.nome, icone: cat.icone ?? '', ordem: pos, ativo: cat.ativo })
    setModalCat(true)
  }

  async function salvarCat() {
    if (!formCat.nome) return
    setSalvandoCat(true)
    const outros = categorias
      .filter((c) => !catEditando || c.id !== catEditando.id)
      .sort((a, b) => a.ordem - b.ordem || a.id.localeCompare(b.id))
    const maxPos = outros.length + 1
    const pos = Math.min(Math.max(1, formCat.ordem || 1), maxPos)
    const payloadBase = {
      nome: formCat.nome.trim(),
      icone: formCat.icone.trim() || null,
      ativo: formCat.ativo,
    }
    try {
      if (catEditando) {
        await supabase.from('categorias').update(payloadBase).eq('id', catEditando.id)
        const ordered = [
          ...outros.slice(0, pos - 1).map((c) => c.id),
          catEditando.id,
          ...outros.slice(pos - 1).map((c) => c.id),
        ]
        await persistOrdensCategoriasNaLista(supabase, ordered)
      } else {
        const nextOrdem = outros.length > 0 ? Math.max(...outros.map((c) => c.ordem)) + 1 : 1
        const { data: ins } = await supabase
          .from('categorias')
          .insert({ ...payloadBase, ordem: nextOrdem })
          .select('id')
          .single()
        const newId = ins?.id
        if (newId) {
          const ordered = [
            ...outros.slice(0, pos - 1).map((c) => c.id),
            newId,
            ...outros.slice(pos - 1).map((c) => c.id),
          ]
          await persistOrdensCategoriasNaLista(supabase, ordered)
        }
      }
    } finally {
      setSalvandoCat(false)
      setModalCat(false)
      fetchData()
    }
  }

  async function excluirCat(id: string) {
    if (!confirm(t.deleteCatConfirm)) return
    await supabase.from('categorias').delete().eq('id', id)
    const rest = categorias
      .filter((c) => c.id !== id)
      .sort((a, b) => a.ordem - b.ordem || a.id.localeCompare(b.id))
    await persistOrdensCategoriasNaLista(supabase, rest.map((c) => c.id))
    fetchData()
  }

  const isItemsTab = tab === t.tabItems

  return (
    <main className="min-h-screen bg-background max-w-lg mx-auto">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border px-4 pt-10 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <ChefHat size={18} className="text-primary-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">{t.adminPanel}</p>
              <h1 className="text-base font-bold text-foreground leading-tight">{t.adminTitle}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/ordens"
              className="text-xs font-bold px-2.5 py-1.5 rounded-xl bg-primary text-primary-foreground"
            >
              Ordens
            </Link>
            {/* Language toggle */}
            <button
              onClick={toggleLang}
              className="text-xs font-bold px-2.5 py-1.5 rounded-xl bg-secondary text-muted-foreground"
              aria-label={lang === 'en' ? 'Switch to Portuguese' : 'Mudar para Ingles'}
            >
              {lang === 'en' ? 'PT' : 'EN'}
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm text-muted-foreground font-medium px-3 py-2 rounded-xl hover:bg-secondary transition-colors"
            >
              <LogOut size={15} />
              {t.logout}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-3 bg-secondary rounded-xl p-1">
          {TABS.map((a) => (
            <button
              key={a}
              onClick={() => setTab(a)}
              className={cn(
                'flex-1 py-2 rounded-lg text-sm font-semibold transition-colors',
                tab === a ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
              )}
            >
              {a}
            </button>
          ))}
        </div>
      </header>

      <div className="px-4 pt-4 pb-8">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-secondary rounded-2xl animate-pulse" />)}
          </div>
        ) : isItemsTab ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                {itens.length} {itens.length === 1 ? t.item : t.items}
              </p>
              <button
                onClick={abrirNovoItem}
                className="flex items-center gap-1.5 bg-primary text-primary-foreground text-sm font-semibold px-4 py-2.5 rounded-xl active:opacity-80 transition-opacity"
              >
                <Plus size={16} />
                {t.newItem}
              </button>
            </div>

            {itens.length === 0 ? (
              <EmptyState
                icon={<Package size={28} className="text-muted-foreground" />}
                titulo={t.noItems}
                descricao={t.noItemsHintAdmin}
                acao={t.addItem}
                onAcao={abrirNovoItem}
              />
            ) : (
              <div className="space-y-3">
                {itens.map((item) => (
                  <div key={item.id} className="flex gap-3 bg-card rounded-2xl p-3 border border-border">
                    {item.imagem_url ? (
                      <img src={item.imagem_url} alt={item.nome} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-16 h-16 rounded-xl flex-shrink-0 bg-accent/10 flex items-center justify-center">
                        <ImageIcon size={22} className="text-accent/50" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-1">
                        <p className="font-semibold text-sm text-foreground line-clamp-1 flex-1">{item.nome}</p>
                        {item.destaque && <Star size={12} className="text-accent fill-accent flex-shrink-0 mt-0.5" />}
                      </div>
                      {item.categorias && (
                        <span className="text-[10px] text-accent font-semibold">{item.categorias.nome}</span>
                      )}
                      <p className="text-accent font-bold text-sm mt-0.5">
                        ${item.preco.toFixed(2)}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => toggleDisponivel(item)}
                          className={cn(
                            'flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg',
                            item.disponivel ? 'bg-green-100 text-green-700' : 'bg-secondary text-muted-foreground'
                          )}
                        >
                          {item.disponivel ? <Eye size={10} /> : <EyeOff size={10} />}
                          {item.disponivel ? t.available : t.hidden}
                        </button>
                        <button
                          onClick={() => abrirEditarItem(item)}
                          className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center"
                          aria-label="Edit"
                        >
                          <Pencil size={13} className="text-foreground" />
                        </button>
                        <button
                          onClick={() => excluirItem(item.id)}
                          className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center"
                          aria-label="Delete"
                        >
                          <Trash2 size={13} className="text-red-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                {categorias.length} {t.tabCategories.toLowerCase()}
              </p>
              <button
                onClick={abrirNovaCat}
                className="flex items-center gap-1.5 bg-primary text-primary-foreground text-sm font-semibold px-4 py-2.5 rounded-xl active:opacity-80 transition-opacity"
              >
                <Plus size={16} />
                {t.newCategory}
              </button>
            </div>

            {categorias.length === 0 ? (
              <EmptyState
                icon={<Package size={28} className="text-muted-foreground" />}
                titulo={t.noCategories}
                descricao={t.noCategoriesHint}
                acao={t.addCategory}
                onAcao={abrirNovaCat}
              />
            ) : (
              <div className="space-y-3">
                {categorias.map((cat) => (
                  <div key={cat.id} className="flex items-center gap-3 bg-card rounded-2xl p-4 border border-border">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-xl">{cat.icone ?? '📋'}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground">{cat.nome}</p>
                      <p className="text-xs text-muted-foreground">{t.order} {cat.ordem}</p>
                    </div>
                    <span className={cn(
                      'text-[10px] font-semibold px-2 py-1 rounded-lg',
                      cat.ativo ? 'bg-green-100 text-green-700' : 'bg-secondary text-muted-foreground'
                    )}>
                      {cat.ativo ? t.active : t.inactive}
                    </span>
                    <button onClick={() => abrirEditarCat(cat)} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center" aria-label="Edit">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => excluirCat(cat.id)} className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center" aria-label="Delete">
                      <Trash2 size={14} className="text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal Item */}
      {modalItem && (
        <Modal
          titulo={itemEditando ? t.editItem : t.newItem}
          labelSave={t.save}
          labelSaving={t.saving}
          onFechar={() => setModalItem(false)}
          onSalvar={salvarItem}
          salvando={salvandoItem}
        >
          <CampoTexto
            label={t.fieldName}
            value={formItem.nome}
            onChange={(v) => setFormItem({ ...formItem, nome: v })}
            placeholder={t.placeholderName}
          />
          <CampoTexto
            label={t.fieldDesc}
            value={formItem.descricao}
            onChange={(v) => setFormItem({ ...formItem, descricao: v })}
            placeholder={t.placeholderDesc}
            multiline
          />
          <CampoTexto
            label={t.fieldPrice}
            value={formItem.preco}
            onChange={(v) => setFormItem({ ...formItem, preco: v })}
            placeholder={t.placeholderPrice}
            inputMode="decimal"
            prefix="$"
          />

          <CampoTexto
            label="Quantidade/porcao"
            value={formItem.quantidade_info}
            onChange={(v) => setFormItem({ ...formItem, quantidade_info: v })}
            placeholder="Ex: 350g, 1 porcao, serve 2 pessoas"
          />
          <CampoTexto
            label="Tamanhos disponiveis"
            value={formItem.tamanhos_disponiveis}
            onChange={(v) => setFormItem({ ...formItem, tamanhos_disponiveis: v })}
            placeholder='Ex: 10", 14", 16"'
          />
          <OptionEditor
            title="Opcoes de tamanho"
            options={formItem.size_options}
            onAdd={() => addOptionLine('size')}
            onUpdate={(index, patch) => updateOptionLine('size', index, patch)}
            onRemove={(index) => removeOptionLine('size', index)}
          />
          <OptionEditor
            title="Opcoes de quantidade"
            options={formItem.quantity_options}
            onAdd={() => addOptionLine('quantity')}
            onUpdate={(index, patch) => updateOptionLine('quantity', index, patch)}
            onRemove={(index) => removeOptionLine('quantity', index)}
          />

          <div className="space-y-3 border-t border-border pt-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-foreground">Extras personalizados</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Ex.: Sabor, Complemento, Cobertura — min/máx opcionais (vazio = sem limite) e preço por opção.
                </p>
              </div>
              <button
                type="button"
                onClick={addExtraGroup}
                className="shrink-0 text-xs font-semibold rounded-lg bg-secondary px-2.5 py-1.5 text-foreground"
              >
                + Grupo
              </button>
            </div>
            {formItem.extra_groups.map((eg, gi) => (
              <div key={eg.key} className="space-y-2 rounded-xl border border-border bg-card/50 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1 space-y-2">
                    <CampoTexto
                      label="Nome do grupo"
                      value={eg.nome}
                      onChange={(v) => updateExtraGroup(gi, { nome: v })}
                      placeholder="Ex: Sabor, Complemento, Creme extra"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <CampoTexto
                        label="Mín. escolhas"
                        value={eg.minEscolhas == null ? '' : String(eg.minEscolhas)}
                        onChange={(v) => {
                          const t = v.trim()
                          if (t === '') {
                            updateExtraGroup(gi, { minEscolhas: null })
                            return
                          }
                          const n = parseInt(t, 10)
                          updateExtraGroup(gi, {
                            minEscolhas: Number.isNaN(n) ? null : Math.max(0, n),
                          })
                        }}
                        inputMode="numeric"
                        placeholder="vazio = sem mínimo"
                      />
                      <CampoTexto
                        label="Máx. escolhas"
                        value={eg.maxEscolhas == null ? '' : String(eg.maxEscolhas)}
                        onChange={(v) => {
                          const t = v.trim()
                          if (t === '') {
                            updateExtraGroup(gi, { maxEscolhas: null })
                            return
                          }
                          const n = parseInt(t, 10)
                          updateExtraGroup(gi, {
                            maxEscolhas: Number.isNaN(n) ? null : Math.max(0, n),
                          })
                        }}
                        inputMode="numeric"
                        placeholder="vazio = sem máximo"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeExtraGroup(gi)}
                    className="mt-6 shrink-0 rounded-lg bg-red-50 px-2 py-1 text-xs font-semibold text-red-600"
                  >
                    Remover
                  </button>
                </div>
                <OptionEditor
                  title="Opções deste grupo"
                  options={eg.options}
                  onAdd={() => addExtraOptionLine(gi)}
                  onUpdate={(index, patch) => updateExtraOptionLine(gi, index, patch)}
                  onRemove={(index) => removeExtraOptionLine(gi, index)}
                />
              </div>
            ))}
          </div>

          <CampoTexto
            label="Ingredientes"
            value={formItem.ingredientes_info}
            onChange={(v) => setFormItem({ ...formItem, ingredientes_info: v })}
            placeholder="Ex: queijo, tomate, oregano"
          />
          <CampoTexto
            label="Alerta de alergenicos"
            value={formItem.alergenicos_alerta}
            onChange={(v) => setFormItem({ ...formItem, alergenicos_alerta: v })}
            placeholder="Ex: contem lactose e gluten"
          />

          <UploadImagem
            supabase={supabase}
            imagemAtual={formItem.imagem_url}
            onUpload={(url) => setFormItem({ ...formItem, imagem_url: url })}
            onRemover={() => setFormItem({ ...formItem, imagem_url: '' })}
            labelImage={t.fieldImage}
            labelUpload={t.uploadPhoto}
            labelHint={t.uploadHint}
            labelError={t.uploadError}
            labelFileTooLarge={t.fileTooLarge}
            labelInvalidFile={t.invalidFile}
          />

          <div>
            <label className="text-sm font-semibold text-foreground block mb-1.5">{t.fieldCategory}</label>
            <select
              value={formItem.categoria_id}
              onChange={(e) => {
                const v = e.target.value
                const n = itens.filter(
                  (i) =>
                    sameCategoriaKey(i.categoria_id, v || null) &&
                    (!itemEditando || i.id !== itemEditando.id)
                ).length
                setFormItem({ ...formItem, categoria_id: v, ordem: n + 1 })
              }}
              className="w-full rounded-xl bg-secondary px-3 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-accent/30"
            >
              <option value="">{t.noCategory}</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </div>

          <SelectPosicaoNaLista
            label={t.fieldOrder}
            value={Math.min(Math.max(1, formItem.ordem), maxPosicaoItem)}
            max={maxPosicaoItem}
            onChange={(n) => setFormItem({ ...formItem, ordem: n })}
            hint="1º = primeiro nesta categoria. A ordem no banco é definida automaticamente."
          />

          <div className="flex gap-4">
            <Toggle label={t.fieldAvailable} value={formItem.disponivel} onChange={(v) => setFormItem({ ...formItem, disponivel: v })} />
            <Toggle label={t.fieldFeatured} value={formItem.destaque} onChange={(v) => setFormItem({ ...formItem, destaque: v })} />
          </div>
        </Modal>
      )}

      {/* Modal Categoria */}
      {modalCat && (
        <Modal
          titulo={catEditando ? t.editCategory : t.newCategory}
          labelSave={t.save}
          labelSaving={t.saving}
          onFechar={() => setModalCat(false)}
          onSalvar={salvarCat}
          salvando={salvandoCat}
        >
          <CampoTexto label={t.fieldName} value={formCat.nome} onChange={(v) => setFormCat({ ...formCat, nome: v })} placeholder={t.placeholderName} />
          <CampoTexto label={t.fieldIcon} value={formCat.icone} onChange={(v) => setFormCat({ ...formCat, icone: v })} placeholder={t.placeholderIcon} />
          <SelectPosicaoNaLista
            label={t.fieldOrder}
            value={Math.min(Math.max(1, formCat.ordem), maxPosicaoCategoria)}
            max={maxPosicaoCategoria}
            onChange={(n) => setFormCat({ ...formCat, ordem: n })}
            hint="1º = primeira categoria no cardápio. A ordem no banco é definida automaticamente."
          />
          <Toggle label={t.fieldActive} value={formCat.ativo} onChange={(v) => setFormCat({ ...formCat, ativo: v })} />
        </Modal>
      )}
    </main>
  )
}

/* ---- Upload de Imagem ---- */
function UploadImagem({ supabase, imagemAtual, onUpload, onRemover, labelImage, labelUpload, labelHint, labelError, labelFileTooLarge, labelInvalidFile }: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any
  imagemAtual: string
  onUpload: (url: string) => void
  onRemover: () => void
  labelImage: string
  labelUpload: string
  labelHint: string
  labelError: string
  labelFileTooLarge: string
  labelInvalidFile: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [erro, setErro] = useState('')
  const [preview, setPreview] = useState<string>(imagemAtual)

  useEffect(() => { setPreview(imagemAtual) }, [imagemAtual])

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setErro('')

    if (file.size > 5 * 1024 * 1024) { setErro(labelFileTooLarge); return }
    if (!file.type.startsWith('image/')) { setErro(labelInvalidFile); return }

    const localUrl = URL.createObjectURL(file)
    setPreview(localUrl)
    setUploading(true)

    try {
      const ext = file.name.split('.').pop()
      const nome = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(nome, file, { cacheControl: '3600', upsert: false })

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from(BUCKET).getPublicUrl(nome)
      onUpload(data.publicUrl)
    } catch {
      setErro(labelError)
      setPreview(imagemAtual)
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function handleRemover() {
    if (!imagemAtual) return
    const path = imagemAtual.split(`${BUCKET}/`)[1]
    if (path) await supabase.storage.from(BUCKET).remove([path])
    setPreview('')
    onRemover()
  }

  return (
    <div>
      <label className="text-sm font-semibold text-foreground block mb-1.5">{labelImage}</label>

      {preview ? (
        <div className="relative rounded-2xl overflow-hidden bg-secondary" style={{ height: 180 }}>
          <img src={preview} alt="preview" className="w-full h-full object-cover" />
          {uploading && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <Loader2 size={28} className="text-white animate-spin" />
            </div>
          )}
          {!uploading && (
            <div className="absolute top-2 right-2 flex gap-2">
              <button type="button" onClick={() => inputRef.current?.click()} className="w-8 h-8 rounded-lg bg-white/90 flex items-center justify-center shadow" aria-label="Change image">
                <Upload size={14} className="text-foreground" />
              </button>
              <button type="button" onClick={handleRemover} className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center shadow" aria-label="Remove image">
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
          className="w-full h-36 rounded-2xl border-2 border-dashed border-border bg-secondary flex flex-col items-center justify-center gap-2 transition-colors active:bg-accent/10 active:border-accent/40 disabled:opacity-60"
        >
          {uploading ? (
            <Loader2 size={24} className="text-accent animate-spin" />
          ) : (
            <>
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <ImageIcon size={20} className="text-accent" />
              </div>
              <p className="text-sm font-semibold text-foreground">{labelUpload}</p>
              <p className="text-xs text-muted-foreground">{labelHint}</p>
            </>
          )}
        </button>
      )}

      {erro && <p className="text-xs text-red-500 mt-1.5 font-medium">{erro}</p>}

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

/* ---- Sub-componentes ---- */

function SelectPosicaoNaLista({
  label,
  value,
  max,
  onChange,
  hint,
}: {
  label: string
  value: number
  max: number
  onChange: (n: number) => void
  hint?: string
}) {
  const safeMax = Math.max(1, max)
  const safeVal = Math.min(Math.max(1, value), safeMax)
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-foreground">{label}</label>
      <select
        value={safeVal}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className="w-full rounded-xl bg-secondary px-3 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-accent/30"
      >
        {Array.from({ length: safeMax }, (_, i) => i + 1).map((n) => (
          <option key={n} value={n}>
            {n}º {n === 1 ? '(primeiro)' : n === safeMax ? '(último)' : ''}
          </option>
        ))}
      </select>
      {hint && <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">{hint}</p>}
    </div>
  )
}

function EmptyState({ icon, titulo, descricao, acao, onAcao }: {
  icon: React.ReactNode; titulo: string; descricao: string; acao: string; onAcao: () => void
}) {
  return (
    <div className="flex flex-col items-center py-16 text-center gap-3">
      <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">{icon}</div>
      <p className="font-semibold text-foreground">{titulo}</p>
      <p className="text-sm text-muted-foreground">{descricao}</p>
      <button onClick={onAcao} className="mt-2 bg-primary text-primary-foreground font-semibold px-6 py-2.5 rounded-xl text-sm">{acao}</button>
    </div>
  )
}

function Modal({ titulo, children, onFechar, onSalvar, salvando, labelSave, labelSaving }: {
  titulo: string; children: React.ReactNode; onFechar: () => void; onSalvar: () => void; salvando: boolean; labelSave: string; labelSaving: string
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end" onClick={onFechar}>
      <div
        className="w-full max-w-lg mx-auto bg-background rounded-t-3xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 pt-5 pb-3 border-b border-border sticky top-0 bg-background z-10">
          <h2 className="font-bold text-base text-foreground">{titulo}</h2>
          <button onClick={onFechar} className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center">
            <X size={16} />
          </button>
        </div>
        <div className="px-4 py-4 space-y-4">{children}</div>
        <div className="px-4 pb-8 pt-2 sticky bottom-0 bg-background border-t border-border">
          <button
            onClick={onSalvar}
            disabled={salvando}
            className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-2xl text-sm flex items-center justify-center gap-2 disabled:opacity-60 active:opacity-80 transition-opacity"
          >
            {salvando ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            {salvando ? labelSaving : labelSave}
          </button>
        </div>
      </div>
    </div>
  )
}

function CampoTexto({ label, value, onChange, placeholder, multiline, inputMode, prefix }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; multiline?: boolean; inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']; prefix?: string
}) {
  return (
    <div>
      <label className="text-sm font-semibold text-foreground block mb-1.5">{label}</label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="w-full bg-secondary rounded-xl px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-accent/30 resize-none"
        />
      ) : (
        <div className={cn('flex items-center bg-secondary rounded-xl', prefix && 'pl-3')}>
          {prefix && <span className="text-sm font-semibold text-muted-foreground pr-1">{prefix}</span>}
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            inputMode={inputMode}
            className={cn(
              'flex-1 bg-transparent py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-accent/30 rounded-xl',
              prefix ? 'pr-3' : 'px-3'
            )}
          />
        </div>
      )}
    </div>
  )
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="flex items-center gap-2 text-sm font-semibold text-foreground"
    >
      <div className={cn('w-11 h-6 rounded-full transition-colors relative', value ? 'bg-primary' : 'bg-border')}>
        <div className={cn('absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform', value ? 'translate-x-5' : 'translate-x-0.5')} />
      </div>
      {label}
    </button>
  )
}

function OptionEditor({
  title,
  options,
  onAdd,
  onUpdate,
  onRemove,
}: {
  title: string
  options: { label: string; priceDelta: number; info: string; ordem: number }[]
  onAdd: () => void
  onUpdate: (index: number, patch: { label?: string; priceDelta?: number; info?: string }) => void
  onRemove: (index: number) => void
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-foreground">{title}</label>
        <button
          type="button"
          onClick={onAdd}
          className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-secondary text-foreground"
        >
          + Adicionar
        </button>
      </div>
      {options.length === 0 && (
        <p className="text-xs text-muted-foreground">Nenhuma opcao cadastrada.</p>
      )}
      {options.length > 0 && (
        <div className="grid grid-cols-[1fr_1fr_88px_34px] gap-2 px-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          <span>Nome</span>
          <span>Info</span>
          <span>Preço +</span>
          <span className="sr-only">Remover</span>
        </div>
      )}
      {options.map((opt, index) => (
        <div key={`${title}-${index}`} className="grid grid-cols-[1fr_1fr_88px_34px] gap-2 items-center">
          <input
            type="text"
            value={opt.label}
            onChange={(e) => onUpdate(index, { label: e.target.value })}
            placeholder="Nome da opcao"
            className="w-full bg-secondary rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-accent/30"
          />
          <input
            type="text"
            value={opt.info}
            onChange={(e) => onUpdate(index, { info: e.target.value })}
            placeholder="Descricao, peso, etc."
            className="w-full bg-secondary rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-accent/30"
          />
          <input
            type="number"
            step="0.01"
            value={String(opt.priceDelta)}
            onChange={(e) => onUpdate(index, { priceDelta: Number(e.target.value) || 0 })}
            placeholder="0.00"
            className="w-full bg-secondary rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-accent/30"
          />
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="w-8 h-8 rounded-lg bg-red-50 text-red-500 text-sm font-bold"
            aria-label="Remover opcao"
          >
            ×
          </button>
        </div>
      ))}
      <p className="text-[11px] text-muted-foreground">
        Em <strong className="text-foreground">Info</strong> use descricao, peso, complemento etc. Preco adicional pode ser negativo (desconto).
      </p>
    </div>
  )
}
