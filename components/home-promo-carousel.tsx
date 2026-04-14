'use client'

import { useCallback, useEffect, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import Image from 'next/image'
import { useLang } from '@/lib/lang-context'
import { cn } from '@/lib/utils'

type Slide = { id: string; title: string; imageUrl: string }

export function HomePromoCarousel() {
  const [slides, setSlides] = useState<Slide[]>([])

  useEffect(() => {
    let cancelled = false
    fetch('/api/promotions/banners')
      .then((r) => r.json())
      .then((data: { slides?: Slide[] }) => {
        if (!cancelled && Array.isArray(data.slides)) setSlides(data.slides)
      })
      .catch(() => {
        if (!cancelled) setSlides([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (slides.length === 0) return null

  return <HomePromoCarouselInner slides={slides} />
}

function HomePromoCarouselInner({ slides }: { slides: Slide[] }) {
  const { t } = useLang()
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: slides.length > 1,
    align: 'start',
  })
  const [selected, setSelected] = useState(0)

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelected(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on('select', onSelect)
    emblaApi.on('reInit', onSelect)
    return () => {
      emblaApi.off('select', onSelect)
      emblaApi.off('reInit', onSelect)
    }
  }, [emblaApi, onSelect])

  useEffect(() => {
    if (!emblaApi || slides.length < 2) return
    const id = window.setInterval(() => emblaApi.scrollNext(), 5500)
    return () => window.clearInterval(id)
  }, [emblaApi, slides.length])

  return (
    <section
      className="border-b border-border/60 bg-card/40 px-4 pb-5 pt-4 md:px-0 md:pt-5"
      aria-label={t.homePromoCarouselAria}
    >
      <div className="mx-auto max-w-[1040px] overflow-hidden rounded-2xl border border-border/80 bg-muted/30 shadow-[var(--shadow-card)]">
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex touch-pan-y">
            {slides.map((s, i) => (
              <div key={s.id} className="min-w-0 shrink-0 grow-0 basis-full">
                <div className="relative aspect-[21/9] min-h-[120px] w-full sm:aspect-[2.4/1] sm:min-h-[160px] md:aspect-[3/1] md:min-h-[220px]">
                  <Image
                    src={s.imageUrl}
                    alt={s.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1040px"
                    priority={i === 0}
                  />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent px-3 pb-2.5 pt-10">
                    <p className="line-clamp-2 text-center text-xs font-semibold text-white drop-shadow-sm sm:text-sm">
                      {s.title}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        {slides.length > 1 && (
          <div className="flex justify-center gap-1.5 py-2.5" role="tablist" aria-label={t.homePromoDotsAria}>
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={i === selected}
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  i === selected ? 'w-5 bg-primary' : 'w-1.5 bg-muted-foreground/35'
                )}
                onClick={() => emblaApi?.scrollTo(i)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
