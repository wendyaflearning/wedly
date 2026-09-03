'use client'

import { useCallback, useState } from 'react'
import { Lightbox } from '@/components/portfolio/Lightbox'
import { Toast } from '@/components/ui/Toast'
import { useToast } from '@/hooks/useToast'
import type { CoupleCtaStatuses } from '@/lib/couple-cta-status'
import {
  pinnedCountLabel,
  pinToPublicImage,
  removePin,
  type CouplePin,
} from '@/lib/couple-pins'
import { submitCtaAction, submitUnpinAction, UNPIN_SESSION_LOST } from '@/lib/wedream-cta'
import { PinnedPhotoCard } from './PinnedPhotoCard'

const SectionLabel = () => (
  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">Épinglés</p>
)

const CONTACT_CONFIRMATION =
  'Votre demande de mise en relation est partie. Le prestataire vous recontacte bientôt.'

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

type PinnedPhotosZoneProps = {
  pins: CouplePin[]
  initialCtaStatuses: CoupleCtaStatuses
}

/**
 * Zone « Épinglés » de Mon espace Wedly (WED-135, WED-197) : grille gratuite et
 * illimitée, dé-épinglage confirmé sur vignette, Lightbox et demande de contact
 * sans quitter l'espace couple.
 */
export function PinnedPhotosZone({ pins: initialPins, initialCtaStatuses }: PinnedPhotosZoneProps) {
  const [pins, setPins] = useState(initialPins)
  const [selectedPin, setSelectedPin] = useState<CouplePin | null>(null)
  const [ctaStatuses, setCtaStatuses] = useState<CoupleCtaStatuses>(initialCtaStatuses)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [pendingContact, setPendingContact] = useState(false)
  const { toast, showToast } = useToast()

  const confirmUnpin = useCallback(
    async (portfolioImageId: string) => {
      if (pendingId !== null) return

      setPendingId(portfolioImageId)
      const outcome = await submitUnpinAction(portfolioImageId)
      setPendingId(null)

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
      setSelectedPin((current) =>
        current?.portfolioImageId === portfolioImageId ? null : current
      )
    },
    [pendingId, showToast]
  )

  const runContact = useCallback(
    async (pin: CouplePin) => {
      if (pendingContact || pendingId !== null) return

      if (ctaStatuses.contacts[pin.vendorId]?.leadStatus !== undefined) return

      setPendingContact(true)
      const outcome = await submitCtaAction({
        kind: 'contact',
        portfolioImageId: pin.portfolioImageId,
      })
      setPendingContact(false)

      if (outcome.status === 'error') {
        showToast('error', outcome.message)
        return
      }

      const leadStatus = outcome.status === 'done' ? outcome.leadStatus : undefined

      setCtaStatuses((current) => ({
        ...current,
        contacts: {
          ...current.contacts,
          [pin.vendorId]: { status: outcome.status, leadStatus },
        },
      }))

      if (outcome.status === 'done' && outcome.created) {
        showToast('success', CONTACT_CONFIRMATION)
      }
    },
    [ctaStatuses.contacts, pendingContact, pendingId, showToast]
  )

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
              onOpen={() => setSelectedPin(pin)}
              onAskConfirm={() => setConfirmingId(pin.portfolioImageId)}
              onCancel={() => setConfirmingId(null)}
              onConfirm={() => void confirmUnpin(pin.portfolioImageId)}
            />
          </li>
        ))}
      </ul>

      {selectedPin && (
        <Lightbox
          photo={pinToPublicImage(selectedPin)}
          onClose={() => setSelectedPin(null)}
          onPin={() => void confirmUnpin(selectedPin.portfolioImageId)}
          onContact={() => void runContact(selectedPin)}
          pinStatus="done"
          contactStatus={ctaStatuses.contacts[selectedPin.vendorId]?.status ?? 'idle'}
          contactLeadStatus={ctaStatuses.contacts[selectedPin.vendorId]?.leadStatus}
        />
      )}

      <div className="relative z-[70]">
        <Toast toast={toast} />
      </div>
    </div>
  )
}
