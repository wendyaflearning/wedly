'use client'

import { useEffect, useRef } from 'react'
import { Heart } from 'lucide-react'
import { formatPinnedAt, type CouplePin } from '@/lib/couple-pins'

type PinnedPhotoCardProps = {
  pin: CouplePin
  /** Cette vignette-ci demande confirmation (une seule à la fois dans la grille). */
  isConfirming: boolean
  /** Le DELETE est parti : plus aucun geste tant qu'on ne sait pas s'il a abouti. */
  isPending: boolean
  onOpen: () => void
  onAskConfirm: () => void
  onCancel: () => void
  onConfirm: () => void
}

/**
 * Une photo épinglée : ouverture en Lightbox (WED-197) et retrait via le cœur
 * (WED-135). Le cœur et l'image sont frères, jamais imbriqués — un bouton dans
 * un bouton est un HTML invalide et le navigateur remonterait le clic.
 */
export function PinnedPhotoCard({
  pin,
  isConfirming,
  isPending,
  onOpen,
  onAskConfirm,
  onCancel,
  onConfirm,
}: PinnedPhotoCardProps) {
  const pinnedAt = formatPinnedAt(pin.pinnedAt)
  const questionId = `unpin-question-${pin.id}`

  const heartRef = useRef<HTMLButtonElement>(null)
  const confirmRef = useRef<HTMLButtonElement>(null)
  const wasConfirming = useRef(false)

  useEffect(() => {
    if (isConfirming && !wasConfirming.current) confirmRef.current?.focus()
    if (!isConfirming && wasConfirming.current) heartRef.current?.focus()
    wasConfirming.current = isConfirming
  }, [isConfirming])

  return (
    <figure className="relative aspect-square overflow-hidden rounded-2xl border border-bordeaux/10 bg-bordeaux/5">
      <button
        type="button"
        onClick={onOpen}
        disabled={isPending}
        aria-label="Ouvrir la photo épinglée"
        className="block h-full w-full disabled:cursor-not-allowed disabled:opacity-45"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- ratio inconnu, next/image imposerait des dimensions absentes ici (cf. galerie WedDream). */}
        <img src={pin.photoUrl} alt="" className="h-full w-full object-cover" />
      </button>

      {pinnedAt && (
        <>
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-texte/80 to-transparent"
            aria-hidden="true"
          />
          <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 p-3 text-[11px] text-white/80">
            {pinnedAt}
          </figcaption>
        </>
      )}

      {isConfirming ? (
        <div
          className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-texte/85 p-3 text-center"
          onKeyDown={(event) => {
            if (event.key === 'Escape') onCancel()
          }}
        >
          <p id={questionId} className="text-[12px] leading-snug text-creme">
            Retirer ce coup de cœur ?
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              ref={confirmRef}
              type="button"
              onClick={onConfirm}
              disabled={isPending}
              aria-describedby={questionId}
              className="rounded-full bg-accent px-3 py-1.5 text-[11px] font-semibold text-creme transition-colors hover:bg-highlight disabled:cursor-not-allowed disabled:opacity-45"
            >
              {isPending ? 'Retrait…' : 'Retirer'}
            </button>

            <button
              type="button"
              onClick={onCancel}
              disabled={isPending}
              aria-describedby={questionId}
              className="rounded-full border border-creme/40 px-3 py-1.5 text-[11px] font-semibold text-creme transition-colors hover:bg-creme/10 disabled:cursor-not-allowed disabled:opacity-45"
            >
              Annuler
            </button>
          </div>
        </div>
      ) : (
        <button
          ref={heartRef}
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onAskConfirm()
          }}
          disabled={isPending}
          aria-label="Dé-épingler cette photo"
          className="absolute top-2 right-2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-creme/85 text-bordeaux shadow-[0_1px_4px_rgba(41,26,16,0.18)] transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-45"
        >
          <Heart size={16} strokeWidth={1.8} className="fill-current" aria-hidden="true" />
        </button>
      )}
    </figure>
  )
}
