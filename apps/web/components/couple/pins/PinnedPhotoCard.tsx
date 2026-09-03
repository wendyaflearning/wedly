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
  onAskConfirm: () => void
  onCancel: () => void
  onConfirm: () => void
}

/**
 * Une photo épinglée, et le seul geste que la zone autorise : la retirer.
 *
 * La vignette n'est toujours pas un lien — rien ici ne mène à une fiche
 * prestataire (COUPLE-PIN-006). Le bouton cœur ne dévoile rien : il retire un
 * épinglé du couple, sur ses propres données.
 *
 * Le retrait passe par une confirmation posée sur la vignette elle-même plutôt
 * que par une modale : la photo qu'on s'apprête à retirer reste sous les yeux,
 * et le reste de la grille ne bouge pas.
 */
export function PinnedPhotoCard({
  pin,
  isConfirming,
  isPending,
  onAskConfirm,
  onCancel,
  onConfirm,
}: PinnedPhotoCardProps) {
  const pinnedAt = formatPinnedAt(pin.pinnedAt)
  const questionId = `unpin-question-${pin.id}`

  const heartRef = useRef<HTMLButtonElement>(null)
  const confirmRef = useRef<HTMLButtonElement>(null)
  const wasConfirming = useRef(false)

  // Le focus suit le geste : il entre dans la confirmation à l'ouverture, et
  // revient au cœur si le couple renonce. Sans ça, un renoncement au clavier
  // laisserait le focus sur un bouton qui vient de disparaître, donc sur le
  // `body`, et la navigation repartirait du haut de la page.
  useEffect(() => {
    if (isConfirming && !wasConfirming.current) confirmRef.current?.focus()
    if (!isConfirming && wasConfirming.current) heartRef.current?.focus()
    wasConfirming.current = isConfirming
  }, [isConfirming])

  return (
    <figure className="relative aspect-square overflow-hidden rounded-2xl border border-bordeaux/10 bg-bordeaux/5">
      {/* eslint-disable-next-line @next/next/no-img-element -- ratio inconnu, next/image imposerait des dimensions absentes ici (cf. galerie WedDream). */}
      <img src={pin.photoUrl} alt="Photo épinglée" className="h-full w-full object-cover" />

      {pinnedAt && (
        <>
          <div
            className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-texte/80 to-transparent"
            aria-hidden="true"
          />
          <figcaption className="absolute inset-x-0 bottom-0 p-3 text-[11px] text-white/80">
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
        // Toujours visible, à toutes les tailles : sans survol sur mobile, un
        // cœur en `group-hover` serait inatteignable. Même pastille crème que la
        // galerie — un contour bordeaux nu disparaîtrait sur une photo sombre.
        <button
          ref={heartRef}
          type="button"
          onClick={onAskConfirm}
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
