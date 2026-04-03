'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Mail, Lock, User, Phone, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/lib/lang-context'

type Mode = 'login' | 'register'

type ProfileAuthModalProps = {
  open: boolean
  onClose: () => void
  initialMode?: Mode
  onSuccess: () => void
}

export function ProfileAuthModal({
  open,
  onClose,
  initialMode = 'login',
  onSuccess,
}: ProfileAuthModalProps) {
  const { t } = useLang()
  const [mounted, setMounted] = useState(false)
  const [mode, setMode] = useState<Mode>(initialMode)
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [aceitaSmsTransactional, setAceitaSmsTransactional] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (open) {
      setMode(initialMode)
      setErro(null)
      setInfo(null)
      setAceitaSmsTransactional(false)
    }
  }, [open, initialMode])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErro(null)
    setInfo(null)

    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: senha,
    })

    if (error) {
      setErro(t.profileAuthInvalid)
      setLoading(false)
      return
    }

    const role = data.user?.user_metadata?.role as string | undefined
    if (role === 'admin') {
      await supabase.auth.signOut()
      setErro(t.profileAuthAdminBlocked)
      setLoading(false)
      return
    }

    setLoading(false)
    onSuccess()
    onClose()
  }

  async function handleRegister(e: React.FormEvent) {
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
          aceita_email_atualizacoes_pedido: false,
          prefere_salvar_cartao_futuro: false,
        },
      },
    })

    if (error) {
      setErro(error.message)
      setLoading(false)
      return
    }

    if (data.session) {
      setLoading(false)
      onSuccess()
      onClose()
      return
    }

    setInfo(t.profileAuthCreatedConfirmEmail)
    setLoading(false)
  }

  if (!mounted || !open) return null

  const content = (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-auth-title"
        className="flex max-h-[min(92vh,720px)] w-full max-w-lg flex-col rounded-t-2xl border border-border/80 bg-card shadow-[var(--shadow-luxury)] sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border/60 px-4 py-3">
          <h2 id="profile-auth-title" className="font-serif text-lg font-semibold tracking-tight text-foreground">
            {mode === 'login' ? t.profileSignIn : t.profileCreateAccount}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            <X size={22} strokeWidth={1.75} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 pt-4">
          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="modal-email" className="mb-1 block text-xs font-semibold text-foreground">
                  {t.profileEmail}
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="modal-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                    className="w-full rounded-xl border border-border/80 bg-background py-3 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="modal-senha" className="mb-1 block text-xs font-semibold text-foreground">
                  {t.profilePassword}
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="modal-senha"
                    type={mostrarSenha ? 'text' : 'password'}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    autoComplete="current-password"
                    required
                    className="w-full rounded-xl border border-border/80 bg-background py-3 pl-10 pr-12 text-sm outline-none focus:ring-2 focus:ring-primary/20"
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
              {erro && (
                <p className="rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive" role="alert">
                  {erro}
                </p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-md disabled:opacity-60"
              >
                {loading ? t.profileSigningIn : t.profileSignIn}
              </button>
              <p className="text-center text-sm text-muted-foreground">
                {t.profileAuthNoAccount}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('register')
                    setErro(null)
                    setInfo(null)
                    setAceitaSmsTransactional(false)
                  }}
                  className="font-semibold text-primary"
                >
                  {t.profileCreateAccount}
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label htmlFor="modal-nome" className="mb-1 block text-xs font-semibold text-foreground">
                  {t.profileFullName}
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="modal-nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    autoComplete="name"
                    required
                    minLength={2}
                    className="w-full rounded-xl border border-border/80 bg-background py-3 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="modal-tel" className="mb-1 block text-xs font-semibold text-foreground">
                  {t.profilePhone}
                </label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="modal-tel"
                    type="tel"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    autoComplete="tel"
                    required
                    className="w-full rounded-xl border border-border/80 bg-background py-3 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="modal-reg-email" className="mb-1 block text-xs font-semibold text-foreground">
                  {t.profileEmail}
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="modal-reg-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                    className="w-full rounded-xl border border-border/80 bg-background py-3 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="modal-reg-senha" className="mb-1 block text-xs font-semibold text-foreground">
                  {t.profilePassword}
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="modal-reg-senha"
                    type={mostrarSenha ? 'text' : 'password'}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    autoComplete="new-password"
                    required
                    minLength={6}
                    className="w-full rounded-xl border border-border/80 bg-background py-3 pl-10 pr-12 text-sm outline-none focus:ring-2 focus:ring-primary/20"
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

              <div className="rounded-xl border border-border/80 bg-muted/30 p-3.5">
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

              {erro && (
                <p className="rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive" role="alert">
                  {erro}
                </p>
              )}
              {info && (
                <p className="rounded-xl border border-border bg-muted/50 px-3 py-2 text-sm text-foreground">{info}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-md disabled:opacity-60"
              >
                {loading ? t.profileCreating : t.profileCreateAccount}
              </button>
              <p className="text-center text-sm text-muted-foreground">
                {t.profileAuthHasAccount}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login')
                    setErro(null)
                    setInfo(null)
                    setAceitaSmsTransactional(false)
                  }}
                  className="font-semibold text-primary"
                >
                  {t.profileSignIn}
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )

  return createPortal(content, document.body)
}
