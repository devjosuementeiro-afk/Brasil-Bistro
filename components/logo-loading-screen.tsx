'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'
import logoPrincipal from '@/logo/logo-principal-preto.png'

export type LogoLoadingScreenProps = {
  /** Só para leitores de ecrã / aria-label (sem texto visível) */
  message?: string
  variant?: 'fullscreen' | 'contained'
  className?: string
}

export function LogoLoadingScreen({
  message,
  variant = 'fullscreen',
  className,
}: LogoLoadingScreenProps) {
  const aria = message?.trim() || 'Carregando'

  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      aria-label={aria}
      className={cn(
        'flex flex-col items-center justify-center bg-background px-6',
        variant === 'fullscreen' &&
          'min-h-screen w-full pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]',
        variant === 'contained' && 'min-h-[min(380px,65vh)] w-full py-10',
        className
      )}
    >
      <div className="flex flex-col items-center gap-6">
        <div className="animate-logo-loading will-change-transform">
          <Image
            src={logoPrincipal}
            alt=""
            className="h-auto w-[min(136px,44vw)] drop-shadow-sm dark:invert dark:opacity-95"
            priority
          />
        </div>
        <p className="flex h-7 items-end text-2xl font-semibold leading-none tracking-tight text-primary" aria-hidden>
          <span className="loading-ellipsis-dot">.</span>
          <span className="loading-ellipsis-dot">.</span>
          <span className="loading-ellipsis-dot">.</span>
        </p>
      </div>
    </div>
  )
}
