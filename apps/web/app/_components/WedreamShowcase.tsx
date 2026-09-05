'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Heart } from 'lucide-react'
import { Lightbox } from '@/components/portfolio/Lightbox'
import { Toast } from '@/components/ui/Toast'
import { AccountCreationModal } from '@/components/wedream/AccountCreationModal'
import { useToast } from '@/hooks/useToast'
import type { CoupleCtaStatuses } from '@/lib/couple-cta-status'
import {
  submitCtaAction,
  submitUnpinAction,
  UNPIN_SESSION_LOST,
  type CtaAction,
  type CtaKind,
} from '@/lib/wedream-cta'
import {
  browserStorage,
  dequeuePendingAction,
  enqueuePendingAction,
  hasSeenAccountModal,
  markAccountModalSeen,
} from '@/lib/wedream-pending-actions'
import type { PublicPortfolioImage } from '@/lib/wedream-gallery'

type WedreamShowcaseProps = {
  items: PublicPortfolioImage[]
  initialCtaStatuses: CoupleCtaStatuses
}

const CONTACT_CONFIRMATION = 'Votre demande de mise en relation est partie. Le prestataire vous recontacte bientôt.'

/** Même délai que la galerie (WED-160) : le cœur se remplit avant que le modal ne recouvre. */
const ACCOUNT_MODAL_DELAY_MS = 550

/**
 * La vitrine teaser de la home publique : jeu fixe de photos (pas de scroll
 * infini), mais la même mécanique like + lightbox + file d'attente que la
 * vraie galerie Wedream (`PortfolioGrid.tsx`) — décision produit explicite,
 * pas une version simplifiée façon mockup.
 */
export default function WedreamShowcase({ items, initialCtaStatuses }: WedreamShowcaseProps) {
  const [selectedImage, setSelectedImage] = useState<PublicPortfolioImage | null>(null)
  const [pendingCta, setPendingCta] = useState<CtaKind | null>(null)
  const [ctaStatuses, setCtaStatuses] = useState<CoupleCtaStatuses>(initialCtaStatuses)
  const { toast, showToast } = useToast()

  const [accountModalOpen, setAccountModalOpen] = useState(false)

  const accountModalShownRef = useRef(false)
  const accountModalTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (accountModalTimerRef.current !== null) clearTimeout(accountModalTimerRef.current)
  }, [])

  const requestAccountCreation = useCallback((action: CtaAction) => {
    const queueStorage = browserStorage('local')
    if (queueStorage) enqueuePendingAction(queueStorage, action)

    const sessionFlag = browserStorage('session')
    if (accountModalShownRef.current || (sessionFlag && hasSeenAccountModal(sessionFlag))) return

    accountModalShownRef.current = true
    if (sessionFlag) markAccountModalSeen(sessionFlag)

    accountModalTimerRef.current = setTimeout(() => {
      accountModalTimerRef.current = null
      setSelectedImage(null)
      setAccountModalOpen(true)
    }, ACCOUNT_MODAL_DELAY_MS)
  }, [])

  const clearPinStatus = useCallback((portfolioImageId: string) => {
    setCtaStatuses((current) => {
      if (current.pins[portfolioImageId] === undefined) return current

      const pins = { ...current.pins }
      delete pins[portfolioImageId]

      return { ...current, pins }
    })
  }, [])

  const runUnpin = useCallback(
    async (portfolioImageId: string, isQueuedOnly: boolean) => {
      if (isQueuedOnly) {
        const queueStorage = browserStorage('local')
        if (queueStorage) dequeuePendingAction(queueStorage, 'pin', portfolioImageId)
        clearPinStatus(portfolioImageId)
        return
      }

      setPendingCta('pin')
      const outcome = await submitUnpinAction(portfolioImageId)
      setPendingCta(null)

      if (outcome.status === 'error') {
        showToast('error', outcome.message)
        return
      }

      if (outcome.status === 'auth_required') {
        showToast('error', UNPIN_SESSION_LOST)
        return
      }

      clearPinStatus(portfolioImageId)
    },
    [clearPinStatus, showToast]
  )

  const runCta = useCallback(
    async (kind: CtaKind, photo: PublicPortfolioImage) => {
      const portfolioImageId = photo.id

      if (pendingCta !== null) return

      const pinStatus = ctaStatuses.pins[portfolioImageId]

      if (kind === 'pin' && pinStatus !== undefined) {
        await runUnpin(portfolioImageId, pinStatus === 'auth_required')
        return
      }

      if (kind === 'contact' && ctaStatuses.contacts[photo.vendorId]?.leadStatus !== undefined) {
        return
      }

      setPendingCta(kind)
      const outcome = await submitCtaAction({ kind, portfolioImageId })
      setPendingCta(null)

      if (outcome.status === 'error') {
        showToast('error', outcome.message)
        return
      }

      const leadStatus = outcome.status === 'done' ? outcome.leadStatus : undefined

      setCtaStatuses((current) =>
        kind === 'pin'
          ? { ...current, pins: { ...current.pins, [portfolioImageId]: outcome.status } }
          : {
              ...current,
              contacts: {
                ...current.contacts,
                [photo.vendorId]: { status: outcome.status, leadStatus },
              },
            }
      )

      if (outcome.status === 'auth_required') {
        requestAccountCreation({ kind, portfolioImageId })
        return
      }

      if (kind === 'contact' && outcome.created) showToast('success', CONTACT_CONFIRMATION)
    },
    [ctaStatuses, pendingCta, requestAccountCreation, runUnpin, showToast]
  )

  if (items.length === 0) return null

  // Moins de colonnes quand il y a peu de photos : des vignettes plus
  // grandes et une grille moins trouée qu'à colonnes fixes, sans renoncer à
  // l'effet masonry (chaque photo garde son ratio d'origine).
  const columnsClass =
    items.length <= 4
      ? "columns-2"
      : items.length <= 8
        ? "columns-2 md:columns-3"
        : "columns-2 md:columns-3 lg:columns-4"

  return (
    <section id="wedream" className="w-full bg-creme px-6 md:px-[100px] pb-16 md:pb-24">
      <div className="w-16 h-px mb-4 mx-auto md:mx-0" style={{ background: "rgba(78,26,50,0.28)" }} />
      <p
        className="mb-9"
        style={{
          fontFamily: "var(--font-manrope-var)",
          fontSize: "11px",
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: "#9D4F1E",
        }}
      >
        Wedream · Quelques créations
      </p>

      <div className={`${columnsClass} gap-4`} aria-label={`${items.length} photos Wedream`}>
        {items.map((item) => {
          const isPinned = ctaStatuses.pins[item.id] !== undefined

          return (
            <div key={item.id} className="relative mb-4 break-inside-avoid">
              <button
                type="button"
                onClick={() => setSelectedImage(item)}
                aria-label="Ouvrir la photo"
                className="block w-full overflow-hidden rounded-[5px]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- ratio inconnu à l'avance */}
                <img
                  src={item.url}
                  alt="Photo Wedream"
                  loading="lazy"
                  className="w-full transition-transform duration-[450ms] ease-out hover:scale-[1.03]"
                />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  void runCta('pin', item)
                }}
                aria-label={isPinned ? 'Dé-épingler cette photo' : 'Épingler cette photo'}
                className="bg-creme/85 text-bordeaux absolute top-2 right-2 z-10 flex h-9 w-9 items-center justify-center rounded-full shadow-[0_1px_4px_rgba(41,26,16,0.18)] transition-transform hover:scale-105"
              >
                <Heart size={16} strokeWidth={1.8} className={isPinned ? 'fill-current' : 'fill-none'} aria-hidden="true" />
              </button>
            </div>
          )
        })}
      </div>

      <div className="flex justify-center mt-9">
        <Link
          href="/wedream-vendors"
          className="no-underline"
          style={{
            fontFamily: "var(--font-dm-sans-var)",
            fontWeight: 500,
            fontSize: "13px",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--color-bordeaux)",
            padding: "15px 32px",
            border: "1px solid rgba(78,26,50,0.28)",
            borderRadius: "13px",
          }}
        >
          Voir toute la galerie →
        </Link>
      </div>

      {accountModalOpen && <AccountCreationModal onClose={() => setAccountModalOpen(false)} />}

      {selectedImage && (
        <Lightbox
          photo={selectedImage}
          onClose={() => setSelectedImage(null)}
          onPin={() => void runCta('pin', selectedImage)}
          onContact={() => void runCta('contact', selectedImage)}
          pinStatus={ctaStatuses.pins[selectedImage.id] ?? 'idle'}
          contactStatus={ctaStatuses.contacts[selectedImage.vendorId]?.status ?? 'idle'}
          contactLeadStatus={ctaStatuses.contacts[selectedImage.vendorId]?.leadStatus}
        />
      )}

      <div className="relative z-[70]">
        <Toast toast={toast} />
      </div>
    </section>
  )
}
