'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { AdminCombosPanel } from '@/components/admin-combos-panel'

export default function AdminCombosPage() {
  return (
    <main className="min-h-screen bg-[#F6F7FA]">
      <header className="sticky top-0 z-40 border-b border-border bg-white px-4 pb-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="mx-auto flex max-w-4xl items-center gap-3">
          <Link href="/admin" className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary" aria-label="Voltar">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <p className="text-xs text-muted-foreground">Painel</p>
            <h1 className="text-lg font-bold text-foreground">Combos</h1>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-4xl px-4 py-6">
        <AdminCombosPanel />
      </div>
    </main>
  )
}
