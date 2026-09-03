'use client'

import { useState } from 'react'
import { Toast } from '@/components/ui/Toast'
import { useToast } from '@/hooks/useToast'
import { pinnedCountLabel, removePin, type CouplePin } from '@/lib/couple-pins'
import { submitUnpinAction, UNPIN_SESSION_LOST } from '@/lib/wedream-cta'
import { PinnedPhotoCard } from './PinnedPhotoCard'

const SectionLabel = () => (
  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">Épinglés</p>
)

function EmptyZone() {
  return (
    <section className="rounded-2xl border border-bordeaux/10 bg-white px-6 py-12 text-center md:px-10 md:py-16">
      <h2 className="font-cormorant text-2xl font-medium text-bordeaux md:text-[30px]">
        Aucune photo épinglée pour l’instant
      </h2>
      <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-gris">
        Dès que vous épinglez une photo coup de cœur depuis la galerie WedDream, elle vous attend
        ici. C’est gratuit et sans limite de nombre.
      </p>
    </section>
  )
}

/**
 * Zone « Épinglés » de Mon espace Wedly (US-6.6 / WED-135) : la grille des
 * photos épinglées depuis la galerie WedDream, gratuite et illimitée, et le
 * retrait d'un coup de cœur sans quitter la page.
 *
 * La liste arrive triée « plus récent d'abord » par l'API (COUPLE-PIN-003) ;
 * elle passe en état local parce qu'elle rétrécit sous le doigt du couple. Ni
 * `router.refresh()` ni revalidation : rien d'autre dans l'espace couple ne
 * compte ces photos, et un aller-retour serveur ferait clignoter la grille pour
 * un résultat qu'on connaît déjà.
 */
export function PinnedPhotosZone({ pins: initialPins }: { pins: CouplePin[] }) {
  const [pins, setPins] = useState(initialPins)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const { toast, showToast } = useToast()

  async function confirmUnpin(portfolioImageId: string) {
    if (pendingId !== null) return

    setPendingId(portfolioImageId)
    const outcome = await submitUnpinAction(portfolioImageId)
    setPendingId(null)

    // La vignette ne part de l'écran que sur un retrait réellement acquis
    // (COUPLE-PIN-005). Une session expirée ou une panne laissent la photo en
    // place : elle est toujours épinglée en base, la faire disparaître ferait
    // croire au couple qu'il s'est rétracté. La confirmation reste ouverte,
    // le geste est donc rejouable d'un clic.
    if (outcome.status === 'error') {
      showToast('error', outcome.message)
      return
    }

    if (outcome.status === 'auth_required') {
      showToast('error', UNPIN_SESSION_LOST)
      return
    }

    setPins((current) => removePin(current, portfolioImageId))
    setConfirmingId(null)
  }

  if (pins.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <SectionLabel />
        <EmptyZone />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <SectionLabel />
        <p className="text-[12px] text-gris">{pinnedCountLabel(pins.length)}</p>
      </div>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {pins.map((pin) => (
          <li key={pin.id}>
            <PinnedPhotoCard
              pin={pin}
              isConfirming={confirmingId === pin.portfolioImageId}
              isPending={pendingId === pin.portfolioImageId}
              onAskConfirm={() => setConfirmingId(pin.portfolioImageId)}
              onCancel={() => setConfirmingId(null)}
              onConfirm={() => void confirmUnpin(pin.portfolioImageId)}
            />
          </li>
        ))}
      </ul>

      <Toast toast={toast} />
    </div>
  )
}
