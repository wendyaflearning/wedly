'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Heart } from 'lucide-react'
import { Lightbox } from '@/components/portfolio/Lightbox'
import { Toast } from '@/components/ui/Toast'
import { useToast } from '@/hooks/useToast'
import { submitCtaAction, type CtaAction, type CtaKind } from '@/lib/wedream-cta'
import type { CtaConfirmationStatus } from '@/lib/wedream-cta-confirmation'
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

const CONTACT_CONFIRMATION = 'Votre demande de mise en relation est partie. Le prestataire vous recontacte bientôt.'

/**
 * Les gestes confirmés, photo par photo. La clé est l'id de la photo et non un
 * état global : le couple qui a épinglé une image ne doit pas retrouver la
 * suivante déjà marquée.
 *
 * Le state vit ici plutôt que dans la lightbox, qui se démonte à chaque
 * fermeture — rouvrir la même photo dans la session retrouve donc sa
 * confirmation, sans aucun appel réseau au montage.
 */
type CtaStatusesByImage = Record<string, Partial<Record<CtaKind, CtaConfirmationStatus>>>

/**
 * Point d'accroche de US6 (WED-160) : le backend a refusé l'écriture faute de
 * session, le geste doit être mis en file d'attente puis le modal de création de
 * compte affiché.
 *
 * Il reste vide ici volontairement. Le format de la file et la règle
 * d'affichage du modal sont ce que US6 doit trancher ; les décider depuis US5
 * reviendrait à écrire la conception d'un autre ticket. Le contrat, lui, est
 * stable : quoi que US6 choisisse, il consomme cette `action` sans que US5 bouge.
 */
function requestAccountCreation(action: CtaAction): void {
  // TODO(WED-160) : mettre l'action en file d'attente localStorage + ouvrir le
  // modal. Tant que US6 n'a pas atterri, un couple non connecté clique sans
  // effet visible — c'est la dette assumée de l'ordre des tickets, pas un oubli.
  void action
}

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
  const [pendingCta, setPendingCta] = useState<CtaKind | null>(null)
  const [ctaStatuses, setCtaStatuses] = useState<CtaStatusesByImage>({})
  const { toast, showToast } = useToast()

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

  /**
   * Le clic part sans vérifier la session : c'est la réponse du backend qui dit
   * si le couple était connecté (décision verrouillée #2 de WED-49).
   *
   * En cas de succès la lightbox reste ouverte et rien ne redirige — manifester
   * son intérêt ne doit pas éjecter le couple de la photo qu'il regardait.
   */
  const runCta = useCallback(
    async (kind: CtaKind, portfolioImageId: string) => {
      // Un second clic pendant que le premier est en vol n'apporte rien : les
      // deux écritures sont idempotentes côté backend, autant ne pas les lancer.
      if (pendingCta !== null) return

      setPendingCta(kind)
      const outcome = await submitCtaAction({ kind, portfolioImageId })
      setPendingCta(null)

      // Une écriture refusée ne confirme rien : seuls le succès et le manque de
      // session laissent une trace sur le bouton.
      if (outcome.status === 'error') {
        showToast('error', outcome.message)
        return
      }

      setCtaStatuses((current) => ({
        ...current,
        [portfolioImageId]: { ...current[portfolioImageId], [kind]: outcome.status },
      }))

      if (outcome.status === 'auth_required') {
        requestAccountCreation({ kind, portfolioImageId })
        return
      }

      // Pas de toast sur l'épingle : la trace visuelle suffit — le cœur de la
      // grille et le bouton de la lightbox se remplissent tous deux depuis
      // `ctaStatuses`, sur place et pour toute la session.
      if (kind === 'contact') showToast('success', CONTACT_CONFIRMATION)
    },
    [pendingCta, showToast]
  )

  return (
    <div>
      <div className="columns-2 gap-4 md:columns-3 lg:columns-4" aria-label={`${initialTotal} photos ${label}`}>
        {items.map((item) => {
          // `auth_required` compte comme épinglé au même titre que `done` : le
          // geste est enregistré ou mis en file, dans les deux cas le couple l'a
          // bien posé (cf. `ctaConfirmation`, qui les confirme tous les deux).
          const isPinned = ctaStatuses[item.id]?.pin !== undefined

          return (
            /* Le cœur est frère du bouton d'ouverture, jamais son enfant : un
               bouton dans un bouton est un HTML invalide, et le navigateur
               remonterait le clic vers la lightbox. */
            <div key={item.id} className="relative mb-4 break-inside-avoid">
              <button
                type="button"
                onClick={() => setSelectedImage(item)}
                aria-label={`Ouvrir la photo ${label}`}
                className="block w-full overflow-hidden rounded-[5px]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- ratio inconnu à l'avance : next/image imposerait des dimensions qu'on n'a pas. */}
                <img
                  src={item.url}
                  alt={`Photo ${label}`}
                  loading="lazy"
                  className="w-full transition-transform duration-[450ms] ease-out hover:scale-[1.03]"
                />
              </button>

              {/* Toujours visible, à toutes les tailles : sans survol sur mobile,
                  un cœur en `group-hover` serait tout simplement inatteignable.
                  La pastille crème n'est pas décorative — un contour bordeaux nu
                  disparaîtrait sur une photo sombre. */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  void runCta('pin', item.id)
                }}
                aria-label={isPinned ? 'Photo épinglée' : 'Épingler cette photo'}
                className="bg-creme/85 text-bordeaux absolute top-2 right-2 z-10 flex h-9 w-9 items-center justify-center rounded-full shadow-[0_1px_4px_rgba(41,26,16,0.18)] transition-transform hover:scale-105"
              >
                <Heart
                  size={16}
                  strokeWidth={1.8}
                  className={isPinned ? 'fill-current' : 'fill-none'}
                  aria-hidden="true"
                />
              </button>
            </div>
          )
        })}
      </div>

      <div ref={sentinelRef} className="flex justify-center py-6" aria-hidden={!isLoading}>
        {isLoading && (
          <span className="text-gris text-[10px] font-medium uppercase tracking-[0.16em]">
            Chargement…
          </span>
        )}
      </div>

      {selectedImage && (
        <Lightbox
          photo={selectedImage}
          onClose={() => setSelectedImage(null)}
          onPin={() => void runCta('pin', selectedImage.id)}
          onContact={() => void runCta('contact', selectedImage.id)}
          pinStatus={ctaStatuses[selectedImage.id]?.pin ?? 'idle'}
          contactStatus={ctaStatuses[selectedImage.id]?.contact ?? 'idle'}
        />
      )}

      {/* Le toast est en z-50 et la lightbox en z-[60] : sans ce conteneur la
          confirmation de contact se peindrait derrière la lightbox, qui reste
          justement ouverte après l'action. Le wrapper ouvre un contexte
          d'empilement au-dessus d'elle ; `relative` ne crée pas de bloc
          conteneur pour un enfant `fixed`, le toast reste donc ancré au viewport. */}
      <div className="relative z-[70]">
        <Toast toast={toast} />
      </div>
    </div>
  )
}
