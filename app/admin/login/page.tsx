'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Lock, Mail, ChefHat } from 'lucide-react'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErro(null)

    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha })

    if (error) {
      setErro('E-mail ou senha inválidos. Tente novamente.')
      setLoading(false)
      return
    }

    const role = data.user?.user_metadata?.role as string | undefined
    if (role === 'customer') {
      await supabase.auth.signOut()
      setErro('Esta conta é de cliente. Use o acesso pelo cardápio.')
      setLoading(false)
      return
    }

    router.push('/admin')
    router.refresh()
  }

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center px-6 max-w-lg mx-auto">
      {/* Logo */}
      <div className="flex flex-col items-center mb-10">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-accent/30">
          <ChefHat size={30} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Área Admin</h1>
        <p className="text-muted-foreground text-sm mt-1">Gerencie o cardápio do restaurante</p>
      </div>

      <form onSubmit={handleLogin} className="w-full space-y-4">
        {/* Email */}
        <div>
          <label htmlFor="email" className="text-sm font-semibold text-foreground block mb-1.5">
            E-mail
          </label>
          <div className="relative">
            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="admin@restaurante.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-2xl bg-secondary py-3.5 pl-10 pr-4 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-accent/40"
            />
          </div>
        </div>

        {/* Senha */}
        <div>
          <label htmlFor="senha" className="text-sm font-semibold text-foreground block mb-1.5">
            Senha
          </label>
          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              id="senha"
              type={mostrarSenha ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              className="w-full rounded-2xl bg-secondary py-3.5 pl-10 pr-12 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-accent/40"
            />
            <button
              type="button"
              onClick={() => setMostrarSenha(!mostrarSenha)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
              aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {mostrarSenha ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Erro */}
        {erro && (
          <p className="text-sm text-red-500 bg-red-50 px-4 py-2.5 rounded-xl" role="alert">
            {erro}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full rounded-2xl bg-primary py-4 text-sm font-bold text-primary-foreground transition-opacity active:opacity-90 disabled:opacity-60"
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

      <p className="text-xs text-muted-foreground mt-8 text-center">
        Acesso exclusivo para administradores do restaurante.
      </p>
    </main>
  )
}
