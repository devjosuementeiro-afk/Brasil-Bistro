'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { User, ChevronRight, ShoppingBag, LogOut } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/lib/lang-context'
import { ProfileAuthModal } from '@/components/profile-auth-modal'
import { LogoLoadingScreen } from '@/components/logo-loading-screen'

export default function PerfilPage() {
  const { t } = useLang()
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')

  const loadSession = useCallback(async () => {
    setLoading(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setUserId(null)
      setEmail(null)
      setDisplayName('')
      setLoading(false)
      return
    }

    setUserId(user.id)
    setEmail(user.email ?? null)

    const meta = user.user_metadata as { nome_completo?: string }
    const { data: perfil } = await supabase
      .from('cliente_perfis')
      .select('nome_completo')
      .eq('user_id', user.id)
      .maybeSingle()

    setDisplayName(perfil?.nome_completo?.trim() || meta.nome_completo?.trim() || user.email?.split('@')[0] || '')
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    void loadSession()
  }, [loadSession])

  async function handleSignOut() {
    await supabase.auth.signOut()
    setUserId(null)
    setEmail(null)
    setDisplayName('')
    router.refresh()
  }

  if (loading) {
    return <LogoLoadingScreen message={t.loadingProfile} />
  }

  return (
    <main className="mx-auto min-h-screen max-w-lg bg-background pb-28">
      <header className="border-b border-border/80 bg-card/85 px-4 pb-6 pt-[max(0.875rem,env(safe-area-inset-top))] backdrop-blur-xl">
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-foreground">{t.profileTitle}</h1>
      </header>

      <div className="mb-6 px-4 pt-6">
        {userId ? (
          <div className="rounded-xl border border-border/80 bg-card p-5 shadow-[var(--shadow-card)]">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/5">
                <User size={26} strokeWidth={1.5} className="text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-semibold text-foreground">{displayName || t.profileTitle}</h2>
                {email && <p className="mt-1 truncate text-sm text-muted-foreground">{email}</p>}
                <p className="mt-2 text-xs text-muted-foreground">{t.profileSignedInHint}</p>
                <button
                  type="button"
                  onClick={() => void handleSignOut()}
                  className="mt-4 flex items-center gap-2 rounded-xl border border-border/80 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                  <LogOut size={18} strokeWidth={1.75} />
                  {t.logout}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-4 rounded-xl border border-border/80 bg-card p-5 shadow-[var(--shadow-card)]">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/5">
                <User size={26} strokeWidth={1.5} className="text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-semibold text-foreground">{t.visitor}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{t.welcomeMsg}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setAuthMode('login')
                setAuthOpen(true)
              }}
              className="w-full rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-md transition-opacity active:opacity-90"
            >
              {t.profileSignIn}
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('register')
                setAuthOpen(true)
              }}
              className="w-full rounded-xl border border-border/80 bg-card py-3.5 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-muted"
            >
              {t.profileCreateAccount}
            </button>
          </div>
        )}
      </div>

      <div className="space-y-3 px-4">
        <Link
          href="/carrinho"
          className="flex items-center gap-3 rounded-xl border border-border/80 bg-card px-4 py-4 shadow-sm transition-shadow hover:shadow-[var(--shadow-card)]"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
            <ShoppingBag size={17} strokeWidth={1.75} className="text-primary" />
          </div>
          <span className="flex-1 text-sm font-medium text-foreground">{t.myCartLink}</span>
          <ChevronRight size={16} className="text-muted-foreground" />
        </Link>
      </div>

      <p className="mt-10 text-center text-xs text-muted-foreground">{t.appVersion}</p>

      <ProfileAuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        initialMode={authMode}
        onSuccess={() => void loadSession()}
      />
    </main>
  )
}
