'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, ShoppingBag, User } from 'lucide-react'
import { useCart } from '@/lib/cart-context'
import { useLang } from '@/lib/lang-context'
import { cn } from '@/lib/utils'

export function BottomNav() {
  const pathname = usePathname()
  const { totalItems } = useCart()
  const { lang, t, toggleLang } = useLang()

  if (pathname.startsWith('/admin') || pathname.startsWith('/produto/')) return null

  const navItems = [
    { href: '/', icon: Home, label: t.home },
    { href: '/busca', icon: Search, label: t.search },
    { href: '/carrinho', icon: ShoppingBag, label: t.cart },
    { href: '/perfil', icon: User, label: t.profile },
  ]

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/60 bg-card/85 backdrop-blur-xl shadow-[0_-4px_24px_rgba(0,0,0,0.06)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Main navigation"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-1 py-2.5">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
          const isCart = href === '/carrinho'

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-lg px-2 py-1 transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className="relative">
                <Icon size={22} strokeWidth={isActive ? 2.25 : 1.75} />
                {isCart && totalItems > 0 && (
                  <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-foreground px-0.5 text-[9px] font-bold text-background">
                    {totalItems > 9 ? '9+' : totalItems}
                  </span>
                )}
              </span>
              <span className={cn('text-[10px] font-medium tracking-tight', isActive && 'font-semibold')}>
                {label}
              </span>
            </Link>
          )
        })}

        <button
          type="button"
          onClick={toggleLang}
          className="flex min-w-[52px] flex-col items-center justify-center gap-0.5 rounded-lg px-2 py-1 text-muted-foreground transition-colors hover:text-foreground"
          aria-label={lang === 'en' ? 'Switch to Portuguese' : 'Mudar para inglês'}
        >
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em]">
            {lang === 'en' ? 'PT' : 'EN'}
          </span>
          <span className="text-[9px] font-medium text-muted-foreground/80">
            {lang === 'en' ? 'Português' : 'English'}
          </span>
        </button>
      </div>
    </nav>
  )
}
