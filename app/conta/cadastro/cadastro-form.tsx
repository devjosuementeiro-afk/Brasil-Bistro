'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/lib/lang-context'
import { ArrowLeft, Eye, EyeOff, Lock, Mail, Phone, User } from 'lucide-react'

export function CadastroForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextPath = searchParams.get('next') || '/checkout/dados'
  const { t } = useLang()

  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [aceitaSmsTransactional, setAceitaSmsTransactional] = useState(false)
  const [aceitaEmail, setAceitaEmail] = useState(false)
  const [prefereSalvarCartao, setPrefereSalvarCartao] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  async function handleCadastro(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)
    setInfo(null)

    if (!aceitaSmsTransactional) {
      setErro(t.registerSmsConsentRequired)
      return
    }

    setLoading(true)

    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: senha,
      options: {
        data: {
          role: 'customer',
          nome_completo: nome.trim(),
          telefone: telefone.trim(),
          aceita_sms_atualizacoes_pedido: true,
          aceita_email_atualizacoes_pedido: aceitaEmail,
          prefere_salvar_cartao_futuro: prefereSalvarCartao,
        },
      },
    })

    if (error) {
      setErro(error.message)
      setLoading(false)
      return
    }

    // cliente_perfis é criado no BD pelo trigger (script 015), porque sem sessão
    // (confirmação de e-mail) auth.uid() é null e o upsert do cliente violava RLS.

    if (data.session) {
      router.push(nextPath.startsWith('/') ? nextPath : '/checkout/dados')
      router.refresh()
    } else {
      setInfo(t.profileAuthCreatedConfirmEmail)
    }
    setLoading(false)
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border/90 bg-background/90 px-4 pb-3 backdrop-blur-md pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-border bg-card shadow-sm transition-colors active:bg-secondary"
            aria-label="Voltar"
          >
            <ArrowLeft size={18} />
          </Link>
          <h1 className="text-base font-bold text-foreground">{t.profileCreateAccount}</h1>
        </div>
      </header>

      <div className="px-4 pt-6 pb-10">
        <p className="mb-6 text-sm text-muted-foreground">{t.registerIntroBlurb}</p>

        <form onSubmit={handleCadastro} className="space-y-4">
          <div>
            <label htmlFor="nome" className="text-xs font-semibold text-foreground block mb-1">
              {t.profileFullName}
            </label>
            <div className="relative">
              <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                autoComplete="name"
                required
                minLength={2}
                className="w-full rounded-2xl border border-border bg-card py-3 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-accent/30"
              />
            </div>
          </div>

          <div>
            <label htmlFor="telefone" className="text-xs font-semibold text-foreground block mb-1">
              {t.profilePhone}
            </label>
            <div className="relative">
              <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                id="telefone"
                type="tel"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                autoComplete="tel"
                required
                className="w-full rounded-2xl border border-border bg-card py-3 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-accent/30"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="text-xs font-semibold text-foreground block mb-1">
              {t.profileEmail}
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                className="w-full rounded-2xl border border-border bg-card py-3 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-accent/30"
              />
            </div>
          </div>

          <div>
            <label htmlFor="senha" className="text-xs font-semibold text-foreground block mb-1">
              {t.profilePassword}
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                id="senha"
                type={mostrarSenha ? 'text' : 'password'}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                autoComplete="new-password"
                required
                minLength={6}
                className="w-full rounded-2xl border border-border bg-card py-3 pl-10 pr-12 text-sm outline-none focus:ring-2 focus:ring-accent/30"
              />
              <button
                type="button"
                onClick={() => setMostrarSenha(!mostrarSenha)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                aria-label={mostrarSenha ? t.profileHidePassword : t.profileShowPassword}
              >
                {mostrarSenha ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-3.5">
            <label className="flex cursor-pointer gap-3">
              <input
                type="checkbox"
                checked={aceitaSmsTransactional}
                onChange={(e) => setAceitaSmsTransactional(e.target.checked)}
                className="mt-1 h-4 w-4 shrink-0 rounded border-border text-primary focus:ring-primary/30"
              />
              <span className="space-y-2 text-[11px] leading-relaxed text-foreground">
                <span className="block">{t.registerSmsConsentLine1}</span>
                <span className="block">{t.registerSmsConsentLine2}</span>
                <span className="block">{t.registerSmsConsentLine3}</span>
              </span>
            </label>
          </div>

          <div className="space-y-3 rounded-2xl border border-border bg-card p-3">
            <p className="text-xs font-semibold text-foreground">{t.registerPreferencesTitle}</p>
            <label className="flex gap-2.5 items-start text-xs text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={aceitaEmail}
                onChange={(e) => setAceitaEmail(e.target.checked)}
                className="mt-0.5 rounded border-border"
              />
              <span>{t.registerPrefEmailLabel}</span>
            </label>
            <label className="flex gap-2.5 items-start text-xs text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={prefereSalvarCartao}
                onChange={(e) => setPrefereSalvarCartao(e.target.checked)}
                className="mt-0.5 rounded border-border"
              />
              <span>{t.registerPrefCardLabel}</span>
            </label>
          </div>

          {erro && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl" role="alert">
              {erro}
            </p>
          )}
          {info && (
            <p className="rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground">{info}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-primary py-3.5 text-sm font-bold text-primary-foreground disabled:opacity-60"
          >
            {loading ? t.profileCreating : t.profileCreateAccount}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          {t.profileAuthHasAccount}{' '}
          <Link href={`/conta/entrar?next=${encodeURIComponent(nextPath)}`} className="font-semibold text-accent">
            {t.profileSignIn}
          </Link>
        </p>
      </div>
    </main>
  )
}
