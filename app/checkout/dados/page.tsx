'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/lib/lang-context'
import { ArrowLeft, Phone, User, Mail, LogOut } from 'lucide-react'
import {
  isValidCheckoutCustomer,
  loadCheckoutCustomer,
  normalizePhone,
  saveCheckoutCustomer,
  type CheckoutCustomer,
} from '@/lib/checkout-customer'

export default function CheckoutDadosPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const { t } = useLang()

  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [email, setEmail] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [aceitaSms, setAceitaSms] = useState(false)
  const [aceitaEmail, setAceitaEmail] = useState(false)
  const [prefereSalvarCartao, setPrefereSalvarCartao] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const loadSession = useCallback(async () => {
    setLoading(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setUserId(null)
      const saved = loadCheckoutCustomer()
      if (saved) {
        setNome(saved.nome)
        setEmail(saved.email)
        setTelefone(saved.telefone)
        setAceitaSms(saved.aceitaSmsAtualizacoes)
        setAceitaEmail(saved.aceitaEmailAtualizacoes)
        setPrefereSalvarCartao(saved.prefereSalvarCartao)
      } else {
        setAceitaSms(false)
      }
      setLoading(false)
      return
    }

    setUserId(user.id)
    setEmail(user.email ?? '')

    const meta = user.user_metadata as { nome_completo?: string; telefone?: string }
    const { data: perfil } = await supabase
      .from('cliente_perfis')
      .select(
        'nome_completo, telefone, aceita_sms_atualizacoes_pedido, aceita_email_atualizacoes_pedido, prefere_salvar_cartao_futuro'
      )
      .eq('user_id', user.id)
      .maybeSingle()

    setNome(perfil?.nome_completo ?? meta.nome_completo ?? '')
    setTelefone(perfil?.telefone ?? meta.telefone ?? '')
    setAceitaSms(!!perfil?.aceita_sms_atualizacoes_pedido)
    setAceitaEmail(!!perfil?.aceita_email_atualizacoes_pedido)
    setPrefereSalvarCartao(!!perfil?.prefere_salvar_cartao_futuro)
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    void loadSession()
  }, [loadSession])

  async function handleSair() {
    await supabase.auth.signOut()
    setUserId(null)
    setEmail('')
    setNome('')
    setTelefone('')
    setAceitaSms(false)
    setAceitaEmail(false)
    setPrefereSalvarCartao(false)
  }

  async function handleContinuar(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)

    const n = nome.trim()
    const em = email.trim()
    const telRaw = telefone.trim()
    const telDigits = normalizePhone(telRaw)

    if (n.length < 2) {
      setErro(t.checkoutErrNome)
      return
    }
    if (telDigits.length < 8) {
      setErro(t.checkoutErrPhone)
      return
    }
    if (!em.includes('@') || em.length < 5) {
      setErro(t.checkoutErrEmail)
      return
    }

    const c: CheckoutCustomer = {
      nome: n,
      email: em,
      telefone: telRaw,
      userId,
      aceitaSmsAtualizacoes: aceitaSms,
      aceitaEmailAtualizacoes: aceitaEmail,
      prefereSalvarCartao,
    }

    if (!isValidCheckoutCustomer(c)) {
      setErro(t.checkoutErrNome)
      return
    }

    setSaving(true)

    if (userId) {
      const { error: upErr } = await supabase.from('cliente_perfis').upsert(
        {
          user_id: userId,
          nome_completo: c.nome,
          telefone: c.telefone,
          aceita_sms_atualizacoes_pedido: aceitaSms,
          aceita_email_atualizacoes_pedido: aceitaEmail,
          prefere_salvar_cartao_futuro: prefereSalvarCartao,
        },
        { onConflict: 'user_id' }
      )
      if (upErr) {
        setErro(upErr.message)
        setSaving(false)
        return
      }
    }

    saveCheckoutCustomer(c)
    setSaving(false)
    router.push('/pagamento')
  }

  if (loading) {
    return (
      <main className="mx-auto min-h-screen max-w-lg bg-background px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <p className="text-sm text-muted-foreground">{t.checkoutLoading}</p>
      </main>
    )
  }

  const isGuest = !userId

  return (
    <main className="mx-auto min-h-screen max-w-lg bg-background pb-28">
      <header className="sticky top-0 z-40 border-b border-border/90 bg-background/90 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link
            href="/carrinho"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-border bg-card shadow-sm transition-colors active:bg-secondary"
            aria-label={t.checkoutBackAria}
          >
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-base font-bold text-foreground">{t.checkoutTitle}</h1>
        </div>
      </header>

      <section className="space-y-4 px-4 pt-5">
        <p className="text-sm text-muted-foreground">{t.checkoutIntro}</p>

        {userId ? (
          <div className="flex items-center justify-between rounded-2xl border border-border bg-card px-3 py-2">
            <p className="text-xs text-muted-foreground">{t.checkoutConnected}</p>
            <button
              type="button"
              onClick={() => void handleSair()}
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary"
            >
              <LogOut size={14} />
              {t.logout}
            </button>
          </div>
        ) : (
          <div className="space-y-2 rounded-2xl border border-border bg-card p-3 text-sm">
            <p className="text-xs text-muted-foreground">{t.checkoutGuestSavePrompt}</p>
            <div className="flex gap-2">
              <Link
                href="/conta/cadastro?next=%2Fcheckout%2Fdados"
                className="flex-1 rounded-xl bg-primary py-2.5 text-center text-xs font-semibold text-primary-foreground"
              >
                {t.checkoutCreateAccount}
              </Link>
              <Link
                href="/conta/entrar?next=%2Fcheckout%2Fdados"
                className="flex-1 rounded-xl border border-border py-2.5 text-center text-xs font-semibold"
              >
                {t.checkoutAlreadyHaveAccount}
              </Link>
            </div>
          </div>
        )}

        <form onSubmit={handleContinuar} className="space-y-4">
          {isGuest && (
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {t.checkoutGuestContactTitle}
            </p>
          )}

          <div>
            <label htmlFor="nome" className="mb-1 block text-xs font-semibold">
              {t.profileFullName}
            </label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-3 text-muted-foreground" />
              <input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                minLength={2}
                autoComplete="name"
                className="w-full rounded-2xl border border-border bg-card py-3 pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div>
            <label htmlFor="telefone" className="mb-1 block text-xs font-semibold">
              {t.profilePhone}
            </label>
            <div className="relative">
              <Phone size={16} className="absolute left-3 top-3 text-muted-foreground" />
              <input
                id="telefone"
                type="tel"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                required
                autoComplete="tel"
                className="w-full rounded-2xl border border-border bg-card py-3 pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="mb-1 block text-xs font-semibold">
              {t.profileEmail}
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-3 text-muted-foreground" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={!!userId}
                autoComplete="email"
                className="w-full rounded-2xl border border-border bg-card py-3 pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-70"
              />
            </div>
            <p className="mt-1 text-[10px] text-muted-foreground">{t.checkoutEmailHelp}</p>
          </div>

          {isGuest ? (
            <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold text-foreground">{t.checkoutOrderPrefsTitle}</p>
                <button
                  type="button"
                  onClick={() => {
                    setAceitaSms(true)
                    setAceitaEmail(true)
                    setPrefereSalvarCartao(true)
                  }}
                  className="shrink-0 rounded-lg border border-primary/35 bg-primary/5 px-3 py-1.5 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/10"
                >
                  {t.checkoutSelectAll}
                </button>
              </div>
              <p className="text-[11px] leading-snug text-muted-foreground">{t.checkoutPrefsAllOptional}</p>

              <div className="space-y-3 pt-1">
                <label className="flex cursor-pointer items-start gap-2.5 text-[11px] leading-snug text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={aceitaSms}
                    onChange={(e) => setAceitaSms(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-border text-primary focus:ring-primary/30"
                  />
                  <span className="space-y-1.5 text-foreground">
                    <span className="block">{t.registerSmsConsentLine1}</span>
                    <span className="block text-muted-foreground">{t.registerSmsConsentLine2}</span>
                    <span className="block text-muted-foreground">{t.registerSmsConsentLine3}</span>
                  </span>
                </label>
                <label className="flex cursor-pointer items-start gap-2.5 text-[11px] leading-snug text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={aceitaEmail}
                    onChange={(e) => setAceitaEmail(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-border text-primary focus:ring-primary/30"
                  />
                  <span className="text-foreground">{t.registerPrefEmailLabel}</span>
                </label>
                <label className="flex cursor-pointer items-start gap-2.5 text-[11px] leading-snug text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={prefereSalvarCartao}
                    onChange={(e) => setPrefereSalvarCartao(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-border text-primary focus:ring-primary/30"
                  />
                  <span className="text-foreground">{t.registerPrefCardLabel}</span>
                </label>
              </div>
            </div>
          ) : (
            <div className="space-y-3 rounded-2xl border border-border bg-card p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold text-foreground">{t.checkoutCommPrefs}</p>
                <button
                  type="button"
                  onClick={() => {
                    setAceitaSms(true)
                    setAceitaEmail(true)
                    setPrefereSalvarCartao(true)
                  }}
                  className="shrink-0 rounded-lg border border-primary/35 bg-primary/5 px-3 py-1.5 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/10"
                >
                  {t.checkoutSelectAll}
                </button>
              </div>
              <p className="text-[11px] leading-snug text-muted-foreground">{t.checkoutPrefsAllOptional}</p>
              <div className="space-y-3 pt-0.5">
                <label className="flex cursor-pointer items-start gap-2.5 text-[11px] leading-snug text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={aceitaSms}
                    onChange={(e) => setAceitaSms(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-border text-primary focus:ring-primary/30"
                  />
                  <span className="text-foreground">{t.checkoutPrefSms}</span>
                </label>
                <label className="flex cursor-pointer items-start gap-2.5 text-[11px] leading-snug text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={aceitaEmail}
                    onChange={(e) => setAceitaEmail(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-border text-primary focus:ring-primary/30"
                  />
                  <span className="text-foreground">{t.registerPrefEmailLabel}</span>
                </label>
                <label className="flex cursor-pointer items-start gap-2.5 text-[11px] leading-snug text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={prefereSalvarCartao}
                    onChange={(e) => setPrefereSalvarCartao(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-border text-primary focus:ring-primary/30"
                  />
                  <span className="text-foreground">{t.registerPrefCardLabel}</span>
                </label>
              </div>
            </div>
          )}

          {erro && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600" role="alert">
              {erro}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-2xl bg-primary py-3.5 text-sm font-bold text-primary-foreground disabled:opacity-60"
          >
            {saving ? t.checkoutSaving : t.checkoutContinue}
          </button>
        </form>
      </section>
    </main>
  )
}
