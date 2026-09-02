'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Heart } from 'lucide-react'
import { Lightbox } from '@/components/portfolio/Lightbox'
import { Toast } from '@/components/ui/Toast'
import { AccountCreationModal } from '@/components/wedream/AccountCreationModal'
import { useToast } from '@/hooks/useToast'
import type { CtaStatusesByImage } from '@/lib/couple-cta-status'
import {
  submitCtaAction,
  submitUnpinAction,
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
import type { PortfolioImagesPage, PublicPortfolioImage } from '@/lib/wedream-gallery'

type PortfolioGridProps = {
  tagValueId: string
  label: string
  initialItems: PublicPortfolioImage[]
  initialNextCursor: string | null
  initialTotal: number
  /** Les gestes déjà posés, lus au rendu serveur (WED-182). */
  initialCtaStatuses: CtaStatusesByImage
}

/** On déclenche le chargement avant que la sentinelle soit visible : le scroll reste continu. */
const PRELOAD_MARGIN = '400px'

const CONTACT_CONFIRMATION = 'Votre demande de mise en relation est partie. Le prestataire vous recontacte bientôt.'

/**
 * Le seul cas où un dé-épinglage échoue sans être une panne : la session a
 * expiré depuis le chargement de la page. Le cœur reste rempli — il l'est
 * toujours côté serveur — et le couple sait quoi faire.
 *
 * TODO(WED-183, à valider par UX-Wedly) : libellé écrit ici faute d'être couvert
 * par le prompt reçu. À reprendre si UX tranche autrement.
 */
const UNPIN_SESSION_LOST = 'Votre session a expiré. Reconnectez-vous pour retirer ce coup de cœur.'

/**
 * Le temps que la confirmation du geste se peigne avant que le modal ne la
 * recouvre : le couple doit voir son cœur se remplir, sinon le modal a l'air de
 * répondre à côté. Valeur reprise de la maquette Claude Design.
 */
const ACCOUNT_MODAL_DELAY_MS = 550

export default function PortfolioGrid({
  tagValueId,
  label,
  initialItems,
  initialNextCursor,
  initialTotal,
  initialCtaStatuses,
}: PortfolioGridProps) {
  const [items, setItems] = useState(initialItems)
  const [nextCursor, setNextCursor] = useState(initialNextCursor)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedImage, setSelectedImage] = useState<PublicPortfolioImage | null>(null)
  const [pendingCta, setPendingCta] = useState<CtaKind | null>(null)
  /**
   * Le state vit ici plutôt que dans la lightbox, qui se démonte à chaque
   * fermeture — rouvrir la même photo retrouve donc sa confirmation, sans aucun
   * appel réseau au montage. Il démarre sur ce que le serveur a lu, et non à
   * vide : un cœur qui se remplirait après le premier rendu serait un
   * clignotement, et le refresh perdrait les gestes des sessions précédentes.
   */
  const [ctaStatuses, setCtaStatuses] = useState<CtaStatusesByImage>(initialCtaStatuses)
  const { toast, showToast } = useToast()

  const [accountModalOpen, setAccountModalOpen] = useState(false)

  const sentinelRef = useRef<HTMLDivElement>(null)
  const inFlightRef = useRef(false)
  // Le drapeau de session vit en sessionStorage, mais un navigateur peut refuser
  // tout stockage : cette copie en mémoire garantit qu'au pire le modal ne
  // s'ouvre qu'une fois par page, jamais à chaque clic.
  const accountModalShownRef = useRef(false)
  const accountModalTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (accountModalTimerRef.current !== null) clearTimeout(accountModalTimerRef.current)
  }, [])

  /**
   * Le backend a refusé l'écriture faute de session (US5) : le geste part en file
   * d'attente, et le modal de création de compte n'est proposé qu'une fois par
   * session (WED-160).
   *
   * La mise en file d'abord, la décision d'affichage ensuite, et jamais l'inverse :
   * toute action 401/403 doit être retrouvée à l'inscription, que le couple ait vu
   * le modal ou qu'il l'ait déjà écarté. `enqueuePendingAction` avale ses propres
   * échecs de stockage — un localStorage refusé fait perdre la file, pas le clic.
   *
   * Le drapeau est posé à l'ouverture et non à la fermeture : deux gestes
   * enchaînés pendant que le modal s'affiche ne peuvent pas le rouvrir derrière.
   */
  const requestAccountCreation = useCallback((action: CtaAction) => {
    const queueStorage = browserStorage('local')
    if (queueStorage) enqueuePendingAction(queueStorage, action)

    const sessionFlag = browserStorage('session')
    if (accountModalShownRef.current || (sessionFlag && hasSeenAccountModal(sessionFlag))) return

    accountModalShownRef.current = true
    if (sessionFlag) markAccountModalSeen(sessionFlag)

    accountModalTimerRef.current = setTimeout(() => {
      accountModalTimerRef.current = null
      // La lightbox laisse la place au modal plutôt que de rester dessous : c'est
      // ce que fait la maquette, et deux verrous de scroll superposés se
      // marcheraient dessus à la fermeture.
      setSelectedImage(null)
      setAccountModalOpen(true)
    }, ACCOUNT_MODAL_DELAY_MS)
  }, [])

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
   * Le cœur redevient vide en **retirant** la clé `pin`, jamais en la passant à
   * `'idle'` : `isPinned` teste `!== undefined`, donc une clé présente à `'idle'`
   * laisserait le cœur rempli. L'entrée de la photo survit avec son éventuel
   * `contact` — dé-épingler ne retire pas une demande de mise en relation.
   */
  const clearPinStatus = useCallback((portfolioImageId: string) => {
    setCtaStatuses((current) => {
      const entry = current[portfolioImageId]
      if (entry?.pin === undefined) return current

      const next = { ...entry }
      delete next.pin

      return { ...current, [portfolioImageId]: next }
    })
  }, [])

  /**
   * Le retour en arrière sur un épinglé (WED-183), par l'un ou l'autre chemin
   * selon d'où vient l'état.
   *
   * `auth_required` veut dire que le geste n'est jamais parti au backend : il
   * dort dans la file en attendant l'inscription (WED-160). Le retirer de la
   * file est donc la seule écriture qui existe, et surtout il ne faut pas
   * l'appeler en réseau — un DELETE sans session répondrait 401 et laisserait
   * l'entrée en file, rejouée à l'inscription alors que le couple s'est
   * rétracté.
   *
   * `done` est l'autre chemin : la ligne existe côté backend, seul un DELETE la
   * désactive.
   */
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

      // Seul un succès vide le cœur. Une session expirée le viderait à l'écran
      // alors que l'épinglé est toujours en base : le couple croirait s'être
      // rétracté sans l'avoir fait.
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

      // Le cœur est un interrupteur : sur une photo déjà épinglée, le même clic
      // retire l'épinglé au lieu d'en reposer un (WED-183). Le contact, lui,
      // reste irréversible — un prestataire prévenu ne se dé-prévient pas.
      const pinStatus = ctaStatuses[portfolioImageId]?.pin

      if (kind === 'pin' && pinStatus !== undefined) {
        await runUnpin(portfolioImageId, pinStatus === 'auth_required')
        return
      }

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
    [ctaStatuses, pendingCta, requestAccountCreation, runUnpin, showToast]
  )

  return (
    <div>
      <div className="columns-2 gap-4 md:columns-3 lg:columns-4" aria-label={`${initialTotal} photos ${label}`}>
        {items.map((item) => {
          // `auth_required` compte comme épinglé au même titre que `done` : le
          // geste est enregistré ou mis en file, dans les deux cas le couple l'a
          // bien posé (cf. `ctaConfirmation`, qui les confirme tous les deux).
          // Dé-épingler retire la clé, ce qui repasse bien ce test à faux.
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
                aria-label={isPinned ? 'Dé-épingler cette photo' : 'Épingler cette photo'}
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

      {accountModalOpen && <AccountCreationModal onClose={() => setAccountModalOpen(false)} />}

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
