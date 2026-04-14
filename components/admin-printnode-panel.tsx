'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type PrinterOption = {
  id: number
  name: string
  computerName: string | null
}

export function AdminPrintNodePanel() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [loadingPrinters, setLoadingPrinters] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [rowId, setRowId] = useState<string | null>(null)
  const [enabled, setEnabled] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [printerId, setPrinterId] = useState('')
  const [printers, setPrinters] = useState<PrinterOption[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: queryError } = await supabase
      .from('configuracoes_loja')
      .select('id, printnode_ativo, printnode_api_key, printnode_printer_id')
      .order('atualizado_em', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (queryError) {
      setError(queryError.message)
      setLoading(false)
      return
    }
    setRowId(data?.id ?? null)
    setEnabled(Boolean(data?.printnode_ativo))
    setApiKey(String(data?.printnode_api_key ?? ''))
    setPrinterId(data?.printnode_printer_id != null ? String(data.printnode_printer_id) : '')
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    void load()
  }, [load])

  async function handleSave() {
    setSaving(true)
    setError(null)
    setMessage(null)
    try {
      const payload = {
        printnode_ativo: enabled,
        printnode_api_key: apiKey.trim() || null,
        printnode_printer_id: printerId.trim() ? Number(printerId) : null,
      }
      if (payload.printnode_printer_id != null && (!Number.isFinite(payload.printnode_printer_id) || payload.printnode_printer_id <= 0)) {
        throw new Error('Printer ID invalido.')
      }

      if (rowId) {
        const { error: updateError } = await supabase
          .from('configuracoes_loja')
          .update(payload)
          .eq('id', rowId)
        if (updateError) throw updateError
      } else {
        const { data: inserted, error: insertError } = await supabase
          .from('configuracoes_loja')
          .insert(payload)
          .select('id')
          .single()
        if (insertError) throw insertError
        setRowId(inserted.id)
      }
      setMessage('Configuracao do PrintNode salva.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao salvar configuracao.')
    } finally {
      setSaving(false)
    }
  }

  async function handleLoadPrinters() {
    setLoadingPrinters(true)
    setError(null)
    setMessage(null)
    try {
      const response = await fetch('/api/admin/printnode/printers', { cache: 'no-store' })
      const data = (await response.json()) as { error?: string; printers?: PrinterOption[] }
      if (!response.ok) throw new Error(data.error ?? 'Falha ao carregar impressoras.')
      setPrinters(data.printers ?? [])
      setMessage('Impressoras carregadas.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao carregar impressoras.')
    } finally {
      setLoadingPrinters(false)
    }
  }

  async function handleTestPrint() {
    setTesting(true)
    setError(null)
    setMessage(null)
    try {
      const response = await fetch('/api/admin/printnode/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ printerId: printerId.trim() ? Number(printerId) : undefined }),
      })
      const data = (await response.json()) as { error?: string; printJobId?: number }
      if (!response.ok) throw new Error(data.error ?? 'Falha no teste de impressao.')
      setMessage(`Teste enviado. Print Job ID: ${data.printJobId ?? '-'}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha no teste de impressao.')
    } finally {
      setTesting(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Carregando configuracoes do PrintNode...</p>
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <h3 className="text-sm font-bold text-foreground">PrintNode</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Configure para imprimir automaticamente os pedidos confirmados.
        </p>

        <div className="mt-4 space-y-3">
          <label className="flex items-center gap-2 text-sm font-medium text-foreground">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="rounded border-border"
            />
            Ativar impressao automatica de pedidos pagos
          </label>

          <div>
            <label className="mb-1 block text-xs font-semibold text-foreground">API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Cole a API key do PrintNode"
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-foreground">Printer ID</label>
            <input
              type="number"
              min={1}
              step={1}
              value={printerId}
              onChange={(e) => setPrinterId(e.target.value)}
              placeholder="Ex: 34"
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
          <button
            type="button"
            onClick={() => void handleLoadPrinters()}
            disabled={loadingPrinters}
            className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground disabled:opacity-60"
          >
            {loadingPrinters ? 'Carregando...' : 'Carregar impressoras'}
          </button>
          <button
            type="button"
            onClick={() => void handleTestPrint()}
            disabled={testing}
            className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground disabled:opacity-60"
          >
            {testing ? 'Enviando teste...' : 'Teste de impressao'}
          </button>
        </div>

        {error ? (
          <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
        ) : null}
        {message ? (
          <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">{message}</p>
        ) : null}
      </div>

      {printers.length > 0 ? (
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Impressoras detectadas
          </p>
          <div className="space-y-2">
            {printers.map((printer) => (
              <button
                key={printer.id}
                type="button"
                onClick={() => setPrinterId(String(printer.id))}
                className={`w-full rounded-xl border px-3 py-2 text-left text-sm ${
                  printerId === String(printer.id)
                    ? 'border-primary bg-primary/5 text-foreground'
                    : 'border-border bg-background text-foreground'
                }`}
              >
                <p className="font-semibold">{printer.name}</p>
                <p className="text-xs text-muted-foreground">
                  ID {printer.id}
                  {printer.computerName ? ` · ${printer.computerName}` : ''}
                </p>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
