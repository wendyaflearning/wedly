'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import { Heart, MessageSquare, X } from 'lucide-react'
import type { PublicPortfolioImage } from '@/lib/wedream-gallery'

interface LightboxProps {
  photo: PublicPortfolioImage
  onClose: () => void
  onPin?: () => void
  onContact?: () => void
}

const noop = () => {}

export function Lightbox({ photo, onClose, onPin = noop, onContact = noop }: LightboxProps) {
  // La touche Échap doit toujours appeler le dernier onClose reçu, sans pour
  // autant relancer l'effet de scroll-lock ci-dessous (qui restaurerait alors
  // un overflow déjà à 'hidden').
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCloseRef.current()
    }
    document.addEventListener('keydown', handleKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = prevOverflow
    }
  }, [])

  const tagGroups = Object.entries(photo.tagsByGroup).filter(([, values]) => values.length > 0)

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Photo en grand format"
      className="modal-enter bg-texte fixed inset-0 z-[60] flex"
    >
      {/* Volet photo — le fond noir autour de l'image fait office de backdrop. */}
      <div
        className="relative min-w-0 flex-1 bg-black"
        onClick={onClose}
        role="presentation"
      >
        <Image
          src={photo.url}
          alt=""
          fill
          sizes="(min-width: 768px) 62vw, 100vw"
          className="object-contain"
          unoptimized
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {/* Volet détail : tags de la photo puis les deux actions. */}
      <div className="bg-creme flex h-full w-[min(38vw,440px)] shrink-0 flex-col">
        <div className="border-bordeaux/10 flex shrink-0 items-start justify-end border-b px-7 pt-7 pb-[18px]">
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="border-bordeaux/20 text-bordeaux hover:bg-bordeaux/5 flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full border transition-colors"
          >
            <X size={14} aria-hidden="true" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-[22px] overflow-y-auto px-7 py-[22px]">
          {tagGroups.map(([group, values]) => (
            <div key={group} className="flex flex-col gap-2.5">
              <p className="text-gris m-0 text-[10px] font-semibold uppercase tracking-[0.2em]">
                {group}
              </p>
              <div className="flex flex-wrap gap-2">
                {values.map((value) => (
                  <span
                    key={value}
                    className="border-bordeaux/10 bg-bordeaux/[0.04] text-texte rounded-full border px-3.5 py-[7px] text-[12px] font-medium"
                  >
                    {value}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Deux CTA au même niveau visuel : aucune hiérarchie entre épingler et
            contacter. La logique de clic (auth gate) et la fermeture après
            action arrivent avec US5 — ici on se contente d'appeler le callback. */}
        <div className="border-bordeaux/10 flex shrink-0 flex-col gap-2.5 border-t px-7 pt-[18px] pb-[26px]">
          <button
            type="button"
            onClick={onPin}
            className="border-bordeaux/30 text-bordeaux hover:bg-bordeaux/5 flex items-center justify-center gap-2.5 rounded-full border px-4 py-3.5 text-[11px] font-semibold uppercase tracking-[0.16em] transition-colors"
          >
            <Heart size={15} aria-hidden="true" />
            Épingler
          </button>
          <button
            type="button"
            onClick={onContact}
            className="border-bordeaux/30 text-bordeaux hover:bg-bordeaux/5 flex items-center justify-center gap-2.5 rounded-full border px-4 py-3.5 text-[11px] font-semibold uppercase tracking-[0.16em] transition-colors"
          >
            <MessageSquare size={15} aria-hidden="true" />
            Je veux entrer en contact
          </button>
        </div>
      </div>
    </div>
  )
}
