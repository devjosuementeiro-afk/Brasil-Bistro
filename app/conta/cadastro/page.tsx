import { Suspense } from 'react'
import { CadastroForm } from './cadastro-form'

export default function ContaCadastroPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto min-h-screen max-w-lg bg-background px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </main>
      }
    >
      <CadastroForm />
    </Suspense>
  )
}
