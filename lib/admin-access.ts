import type { User } from '@supabase/supabase-js'

/** Staff do painel /admin. Clientes com role `customer` ficam bloqueados. */
export function isAdminAppUser(user: User | null): boolean {
  if (!user?.email) return false
  const md = user.user_metadata as { role?: string } | undefined
  const am = user.app_metadata as { role?: string } | undefined
  const role = am?.role ?? md?.role
  if (role === 'customer') return false

  const allow =
    process.env.ADMIN_EMAIL_ALLOWLIST?.split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean) ?? []
  if (allow.length > 0 && allow.includes(user.email.toLowerCase())) return true
  if (role === 'admin') return true

  // Equipe antiga: sem role no metadata continua com acesso ao painel.
  if (role == null || role === '') return true
  return false
}
