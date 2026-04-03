import { Suspense } from 'react'
import { EntrarForm } from './entrar-form'

export default function ContaEntrarPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto min-h-screen max-w-lg bg-background px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </main>
      }
    >
      <EntrarForm />
    </Suspense>
  )
}
