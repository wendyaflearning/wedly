'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import type { PortfolioImage } from '@/lib/admin-types'

export function PortfolioGallery({ images }: { images: PortfolioImage[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  if (images.length === 0) {
    return <p className="text-sm font-semibold text-texte/50">Non renseigné</p>
  }

  const activeImage = activeIndex === null ? null : images[activeIndex]

  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {images.map((image, index) => (
          <button
            key={image.id}
            type="button"
            onClick={() => setActiveIndex(index)}
            className="relative aspect-[4/3] overflow-hidden rounded-lg border border-[#eaded2] bg-[#f7f3ee]"
          >
            <Image src={image.url} alt="" fill sizes="(min-width: 768px) 25vw, 50vw" className="object-cover" unoptimized />
            {image.isCover && (
              <span className="absolute left-2 top-2 rounded-md bg-bordeaux px-2 py-1 text-xs font-semibold text-creme">
                Couverture
              </span>
            )}
          </button>
        ))}
      </div>

      {activeImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-8">
          <button
            type="button"
            onClick={() => setActiveIndex(null)}
            className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-md bg-white text-texte"
            aria-label="Fermer"
          >
            <X size={20} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setActiveIndex((index) => (index === null ? null : (index + images.length - 1) % images.length))}
            className="absolute left-5 flex h-10 w-10 items-center justify-center rounded-md bg-white text-texte"
            aria-label="Image précédente"
          >
            <ChevronLeft size={22} aria-hidden="true" />
          </button>
          <div className="relative h-full max-h-[82vh] w-full max-w-5xl">
            <Image src={activeImage.url} alt="" fill sizes="90vw" className="rounded-lg object-contain" unoptimized />
          </div>
          <button
            type="button"
            onClick={() => setActiveIndex((index) => (index === null ? null : (index + 1) % images.length))}
            className="absolute right-5 flex h-10 w-10 items-center justify-center rounded-md bg-white text-texte"
            aria-label="Image suivante"
          >
            <ChevronRight size={22} aria-hidden="true" />
          </button>
        </div>
      )}
    </>
  )
}
