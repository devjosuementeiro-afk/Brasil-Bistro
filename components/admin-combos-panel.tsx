'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Pencil, Plus, Trash2, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type ItemOption = {
  id: string
  nome: string
}

type ComboItemRow = {
  item_id: string
  quantidade: number
  ordem: number
  itens_cardapio?: { nome: string } | null
}

type ComboRow = {
  id: string
  nome: string
  descricao: string | null
  preco: number
  imagem_url: string | null
  destaque: boolean
  ativo: boolean
  ordem: number
  combo_itens: ComboItemRow[]
}

type FormComboItem = {
  itemId: string
  quantidade: number
}

export function AdminCombosPanel() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [combos, setCombos] = useState<ComboRow[]>([])
  const [itens, setItens] = useState<ItemOption[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<ComboRow | null>(null)
  const [form, setForm] = useState({
    nome: '',
    descricao: '',
    preco: '',
    imagem_url: '',
    destaque: false,
    ativo: true,
    ordem: '0',
    itens: [] as FormComboItem[],
  })

  const selectedSet = useMemo(() => new Set(form.itens.map((x) => x.itemId)), [form.itens])

  const load = useCallback(async () => {
    setLoading(true)
    setErro(null)
    const [{ data: combosData, error: cErr }, { data: itensData, error: iErr }] = await Promise.all([
      supabase
        .from('combos')
        .select('id, nome, descricao, preco, imagem_url, destaque, ativo, ordem, combo_itens(item_id, quantidade, ordem, itens_cardapio(nome))')
        .order('destaque', { ascending: false })
        .order('ordem', { ascending: true }),
      supabase.from('itens_cardapio').select('id, nome').eq('disponivel', true).order('nome'),
    ])
    if (cErr) setErro(cErr.message)
    else setCombos((combosData as ComboRow[]) ?? [])
    if (iErr && !cErr) setErro(iErr.message)
    setItens((itensData as ItemOption[]) ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    void load()
  }, [load])

  function abrirNovo() {
    setEditando(null)
    setForm({
      nome: '',
      descricao: '',
      preco: '',
      imagem_url: '',
      destaque: false,
      ativo: true,
      ordem: '0',
      itens: [],
    })
    setErro(null)
    setModalOpen(true)
  }

  function abrirEditar(c: ComboRow) {
    setEditando(c)
    setForm({
      nome: c.nome,
      descricao: c.descricao ?? '',
      preco: String(c.preco),
      imagem_url: c.imagem_url ?? '',
      destaque: c.destaque,
      ativo: c.ativo,
      ordem: String(c.ordem ?? 0),
      itens: (c.combo_itens ?? []).map((ci) => ({
        itemId: ci.item_id,
        quantidade: Math.max(1, Number(ci.quantidade) || 1),
      })),
    })
    setErro(null)
    setModalOpen(true)
  }

  function toggleItem(itemId: string) {
    setForm((prev) => {
      const has = prev.itens.some((x) => x.itemId === itemId)
      if (has) return { ...prev, itens: prev.itens.filter((x) => x.itemId !== itemId) }
      return { ...prev, itens: [...prev.itens, { itemId, quantidade: 1 }] }
    })
  }

  function setItemQuantidade(itemId: string, quantidade: number) {
    setForm((prev) => ({
      ...prev,
      itens: prev.itens.map((x) =>
        x.itemId === itemId ? { ...x, quantidade: Math.max(1, Math.floor(quantidade || 1)) } : x
      ),
    }))
  }

  async function salvar() {
    if (!form.nome.trim()) return setErro('Informe o nome do combo.')
    const preco = Number(form.preco)
    if (!Number.isFinite(preco) || preco < 0) return setErro('Informe um preço válido.')
    if (form.itens.length === 0) return setErro('Selecione ao menos 1 item para o combo.')
    setSaving(true)
    setErro(null)
    try {
      const payload = {
        nome: form.nome.trim(),
        descricao: form.descricao.trim() || null,
        preco: Number(preco.toFixed(2)),
        imagem_url: form.imagem_url.trim() || null,
        destaque: form.destaque,
        ativo: form.ativo,
        ordem: Math.max(0, Math.floor(Number(form.ordem) || 0)),
      }
      let comboId = editando?.id ?? null
      if (editando) {
        const { error } = await supabase.from('combos').update(payload).eq('id', editando.id)
        if (error) throw error
      } else {
        const { data, error } = await supabase.from('combos').insert(payload).select('id').single()
        if (error) throw error
        comboId = data.id
      }
      if (!comboId) throw new Error('Falha ao salvar combo.')
      const { error: delErr } = await supabase.from('combo_itens').delete().eq('combo_id', comboId)
      if (delErr) throw delErr
      const { error: insErr } = await supabase.from('combo_itens').insert(
        form.itens.map((x, idx) => ({
          combo_id: comboId,
          item_id: x.itemId,
          quantidade: Math.max(1, Math.floor(x.quantidade)),
          ordem: idx + 1,
        }))
      )
      if (insErr) throw insErr
      setModalOpen(false)
      await load()
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : String(e))
    } finally {
      setSaving(false)
    }
  }

  async function excluir(c: ComboRow) {
    if (!confirm('Excluir este combo?')) return
    const { error } = await supabase.from('combos').delete().eq('id', c.id)
    if (error) setErro(error.message)
    else void load()
  }

  if (loading) return <p className="text-sm text-muted-foreground">Carregando combos...</p>

  return (
    <>
      <div className="mb-4 flex justify-end">
        <button type="button" onClick={abrirNovo} className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">
          <Plus size={16} className="mr-1 inline" />
          Novo combo
        </button>
      </div>
      {erro && !modalOpen ? <p className="mb-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p> : null}
      {combos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-14 text-center text-sm text-muted-foreground">
          Nenhum combo cadastrado.
        </div>
      ) : (
        <ul className="space-y-3">
          {combos.map((c) => (
            <li key={c.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-base font-semibold text-foreground">{c.nome}</p>
                  {c.descricao ? <p className="mt-1 text-sm text-muted-foreground">{c.descricao}</p> : null}
                  <p className="mt-1 text-sm font-semibold text-accent">${Number(c.preco ?? 0).toFixed(2)}</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => abrirEditar(c)} className="rounded-lg border border-border px-2 py-1 text-xs font-semibold">
                    <Pencil size={14} className="inline" />
                  </button>
                  <button type="button" onClick={() => void excluir(c)} className="rounded-lg border border-red-200 px-2 py-1 text-xs font-semibold text-red-600">
                    <Trash2 size={14} className="inline" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
          <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-border bg-card shadow-xl sm:rounded-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-border bg-card px-4 py-3">
              <h2 className="text-base font-bold text-foreground">{editando ? 'Editar combo' : 'Novo combo'}</h2>
              <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted" aria-label="Fechar">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3 px-4 py-4">
              {erro ? <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{erro}</p> : null}
              <input value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} placeholder="Nome do combo" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm" />
              <textarea value={form.descricao} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))} placeholder="Descrição (opcional)" rows={3} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm" />
              <input type="number" min={0} step={0.01} value={form.preco} onChange={(e) => setForm((f) => ({ ...f, preco: e.target.value }))} placeholder="Preço do combo (USD)" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm" />
              <div className="max-h-64 space-y-2 overflow-y-auto rounded-xl border border-border bg-background p-2">
                {itens.map((it) => {
                  const checked = selectedSet.has(it.id)
                  const quantidade = form.itens.find((x) => x.itemId === it.id)?.quantidade ?? 1
                  return (
                    <div key={it.id} className="flex items-center gap-2 rounded-lg px-1 py-1.5 hover:bg-muted/60">
                      <input type="checkbox" checked={checked} onChange={() => toggleItem(it.id)} />
                      <span className="min-w-0 flex-1 text-sm">{it.nome}</span>
                      {checked ? (
                        <input
                          type="number"
                          min={1}
                          step={1}
                          value={quantidade}
                          onChange={(e) => setItemQuantidade(it.id, Number(e.target.value))}
                          className="w-16 rounded-md border border-border bg-card px-2 py-1 text-xs"
                        />
                      ) : null}
                    </div>
                  )
                })}
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 rounded-xl border border-border py-3 text-sm font-semibold">
                  Cancelar
                </button>
                <button type="button" disabled={saving} onClick={() => void salvar()} className="flex-1 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground disabled:opacity-60">
                  {saving ? '...' : 'Salvar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
