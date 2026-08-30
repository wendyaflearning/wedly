'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Lightbox } from '@/components/portfolio/Lightbox'
import type { PortfolioImagesPage, PublicPortfolioImage } from '@/lib/wedream-gallery'

type PortfolioGridProps = {
  tagValueId: string
  label: string
  initialItems: PublicPortfolioImage[]
  initialNextCursor: string | null
  initialTotal: number
}

/** On déclenche le chargement avant que la sentinelle soit visible : le scroll reste continu. */
const PRELOAD_MARGIN = '400px'

export default function PortfolioGrid({
  tagValueId,
  label,
  initialItems,
  initialNextCursor,
  initialTotal,
}: PortfolioGridProps) {
  const [items, setItems] = useState(initialItems)
  const [nextCursor, setNextCursor] = useState(initialNextCursor)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedImage, setSelectedImage] = useState<PublicPortfolioImage | null>(null)

  const sentinelRef = useRef<HTMLDivElement>(null)
  const inFlightRef = useRef(false)

  const loadMore = useCallback(async () => {
    if (inFlightRef.current || !nextCursor) return

    inFlightRef.current = true
    setIsLoading(true)

    const response = await fetch(
      `/api/tag-values/${tagValueId}/portfolio-images?cursor=${encodeURIComponent(nextCursor)}`
    ).catch(() => null)

    const page: PortfolioImagesPage | null = response?.ok
      ? await response.json().catch(() => null)
      : null

    if (page?.items) {
      // Dédoublonnage par id : une même page rejouée (StrictMode, double
      // déclenchement de l'observer) ne doit jamais dupliquer une tuile.
      setItems((current) => {
        const seen = new Set(current.map((item) => item.id))
        return [...current, ...page.items.filter((item) => !seen.has(item.id))]
      })
      setNextCursor(page.nextCursor)
    } else {
      // Sur échec on arrête l'observation plutôt que de boucler sur un curseur mort.
      setNextCursor(null)
    }

    inFlightRef.current = false
    setIsLoading(false)
  }, [nextCursor, tagValueId])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !nextCursor) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void loadMore()
      },
      { rootMargin: PRELOAD_MARGIN }
    )

    observer.observe(sentinel)

    return () => observer.disconnect()
  }, [loadMore, nextCursor])

  return (
    <div>
      <div className="columns-2 gap-4 md:columns-3 lg:columns-4" aria-label={`${initialTotal} photos ${label}`}>
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setSelectedImage(item)}
            aria-label={`Ouvrir la photo ${label}`}
            className="mb-4 block w-full overflow-hidden rounded-[5px] break-inside-avoid"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- ratio inconnu à l'avance : next/image imposerait des dimensions qu'on n'a pas. */}
            <img
              src={item.url}
              alt={`Photo ${label}`}
              loading="lazy"
              className="w-full transition-transform duration-[450ms] ease-out hover:scale-[1.03]"
            />
          </button>
        ))}
      </div>

      <div ref={sentinelRef} className="flex justify-center py-6" aria-hidden={!isLoading}>
        {isLoading && (
          <span className="text-gris text-[10px] font-medium uppercase tracking-[0.16em]">
            Chargement…
          </span>
        )}
      </div>

      {selectedImage && (
        <Lightbox photo={selectedImage} onClose={() => setSelectedImage(null)} />
      )}
    </div>
  )
}
