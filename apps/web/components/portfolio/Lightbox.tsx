'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Clock, Heart, MessageSquare, X } from 'lucide-react'
import type { CoupleLeadStatus } from '@/lib/couple-lead-status'
import { COUPLE_SPACE_PATH } from '@/lib/couple-space'
import { ctaConfirmation, type CtaConfirmationStatus } from '@/lib/wedream-cta-confirmation'
import type { PublicPortfolioImage } from '@/lib/wedream-gallery'

interface LightboxProps {
  photo: PublicPortfolioImage
  onClose: () => void
  onPin?: () => void
  onContact?: () => void
  /** État du geste pour CETTE photo, tenu par l'appelant (WED-158). */
  pinStatus?: CtaConfirmationStatus
  contactStatus?: CtaConfirmationStatus
  /**
   * Le statut réel de la demande (WED-186). Il arrive soit dès le rendu serveur
   * quand le couple avait déjà contacté ce prestataire (WED-182), soit au retour
   * du clic qui vient de créer ou de retrouver le lead.
   *
   * Absent tant qu'aucune demande n'existe pour cette photo : le bouton garde
   * alors son libellé générique.
   */
  contactLeadStatus?: CoupleLeadStatus
  /**
   * Hide the "Voir mes coups de cœur et demandes" link. Used from Mon espace
   * itself (WED-197): the couple is already there, and `pinStatus="done"`
   * would otherwise always show that link.
   */
  hideCoupleSpaceLink?: boolean
}

const noop = () => {}

/** Distance de tirage (px) au-delà de laquelle le relâchement ferme la lightbox. */
const SWIPE_DISMISS_THRESHOLD = 100

const CTA_BASE =
  'flex items-center justify-center gap-2.5 rounded-full border px-4 py-3.5 text-[11px] font-semibold uppercase tracking-[0.16em] transition-colors'
/** Pas de `hover:` sur l'état confirmé : sur fond plein il ne se verrait pas. */
const CTA_CONFIRMED = 'border-bordeaux bg-bordeaux text-creme'
const CTA_IDLE = 'border-bordeaux/30 text-bordeaux hover:bg-bordeaux/5'
/**
 * Un constat, pas une action : fond neutre, pas de bordure, pas de curseur
 * cliquable. La maquette peint ainsi la demande en attente comme la demande
 * refusée — c'est le même « il n'y a rien à faire ici ».
 */
const CTA_MUTED = 'border-transparent bg-muted text-texte cursor-default'
/**
 * Le refus va un cran plus loin et éteint tout le bouton, icône comprise
 * (opacity 0.55 dans la maquette) : c'est la seule fin de parcours du lot, et
 * elle ne doit pas peser autant à l'œil qu'une attente encore vivante.
 */
const CTA_REFUSED = `${CTA_MUTED} opacity-55`

export function Lightbox({
  photo,
  onClose,
  onPin = noop,
  onContact = noop,
  pinStatus = 'idle',
  contactStatus = 'idle',
  contactLeadStatus,
  hideCoupleSpaceLink = false,
}: LightboxProps) {
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

  // Tirer la photo vers le bas pour fermer, réflexe Instagram sur mobile —
  // le tactile ne se déclenche jamais depuis une souris, donc rien à
  // conditionner explicitement au viewport pour laisser le desktop intact.
  const [dragY, setDragY] = useState(0)
  // Un ref ne se lit jamais pendant le rendu (react-hooks/refs) : l'état
  // "en cours de tirage" vit donc dans ce booléen, pas dans une lecture de
  // touchStartY.current au rendu.
  const [isDragging, setIsDragging] = useState(false)
  const touchStartY = useRef<number | null>(null)

  function handleTouchStart(e: React.TouchEvent) {
    if (e.touches.length !== 1) return
    touchStartY.current = e.touches[0].clientY
    setIsDragging(true)
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (touchStartY.current === null) return
    const delta = e.touches[0].clientY - touchStartY.current
    // Seulement vers le bas : un tirage vers le haut n'a aucun sens à fermer,
    // et casserait le scroll naturel du volet détail en dessous.
    if (delta > 0) setDragY(delta)
  }

  function handleTouchEnd() {
    touchStartY.current = null
    setIsDragging(false)
    if (dragY > SWIPE_DISMISS_THRESHOLD) {
      onClose()
    } else {
      setDragY(0)
    }
  }

  const tagGroups = Object.entries(photo.tagsByGroup).filter(([, values]) => values.length > 0)

  const pinCta = ctaConfirmation('pin', pinStatus)
  const contactCta = ctaConfirmation('contact', contactStatus, contactLeadStatus)
  // Le refus est le seul statut qui change à la fois le fond et l'icône : il
  // pilote les deux depuis la même variable, plutôt que de déduire l'un du
  // drapeau qui sert à l'autre.
  const isContactRefused = contactLeadStatus === 'REFUSEE'
  // L'icône suit le statut plutôt que le geste : une horloge pour l'attente, et
  // rien du tout sur un refus — l'enveloppe « demande envoyée » y raconterait un
  // envoi qui vient d'être clos.
  const ContactIcon = isContactRefused
    ? null
    : contactLeadStatus === 'EN_ATTENTE'
      ? Clock
      : MessageSquare
  const showsCoupleSpaceLink =
    !hideCoupleSpaceLink && (pinCta.showsCoupleSpaceLink || contactCta.showsCoupleSpaceLink)

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Photo en grand format"
      className="modal-enter bg-texte fixed inset-0 z-[60] flex flex-col lg:flex-row"
      style={{
        transform: dragY ? `translateY(${dragY}px)` : undefined,
        transition: isDragging ? 'none' : 'transform 0.25s ease-out',
        opacity: dragY ? Math.max(1 - dragY / 400, 0.4) : 1,
      }}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Volet photo — le fond noir autour de l'image fait office de backdrop.
          Sous 768px c'est une bande de hauteur fixe en haut de l'écran, au-dessus
          de laquelle remonte le volet détail. Le tirage vers le bas ne démarre
          que depuis cette zone (réflexe Instagram) : le volet détail garde son
          propre scroll tactile sans déclencher la fermeture. */}
      <div
        className="relative h-[262px] flex-none bg-black lg:h-auto lg:min-w-0 lg:flex-1"
        onClick={onClose}
        onTouchStart={handleTouchStart}
        role="presentation"
      >
        <Image
          src={photo.url}
          alt=""
          fill
          sizes="(min-width: 1024px) 62vw, 100vw"
          className="object-contain"
          unoptimized
          onClick={(e) => e.stopPropagation()}
        />

        {/* Même bande que le bouton fermer, côté opposé : la catégorie vit à
            l'entête sur les deux mises en page, jamais dans le volet détail
            qui défile (WED-220). */}
        {photo.category && (
          <span
            className="bg-texte/45 text-creme absolute top-4 left-4 flex h-[34px] items-center rounded-full px-3.5 text-[11px] font-semibold uppercase tracking-[0.14em] lg:hidden"
          >
            {photo.category}
          </span>
        )}

        {/* Sur mobile le bouton fermer passe en overlay sur la photo : le volet
            détail n'a plus d'en-tête à cette taille. Un seul des deux boutons
            est rendu à la fois (display:none), pas de doublon d'accessibilité. */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onClose()
          }}
          aria-label="Fermer"
          className="bg-texte/45 text-creme absolute top-4 right-4 flex h-[34px] w-[34px] items-center justify-center rounded-full lg:hidden"
        >
          <X size={13} strokeWidth={1.8} aria-hidden="true" />
        </button>
      </div>

      {/* Volet détail : tags de la photo puis les deux actions. Panneau latéral
          à partir de 1024px, feuille arrondie empilée sous la photo en dessous
          (mobile et tablette gardent la mise en page pleine largeur : à 768px
          le panneau à 38vw écrasait les deux CTA). lg:flex-none est
          indispensable : sans lui le flex-1 mobile ferait grossir le panneau
          au-delà de ses 440px sur desktop.
          `relative` l'est tout autant : le volet photo est positionné, donc sans
          ça il se peindrait par-dessus les 14px de chevauchement et masquerait
          les coins arrondis de la feuille. On le repasse en `static` au-delà de
          1024px : le chevauchement n'existe plus, et le laisser positionné
          décalait d'un pixel l'anticrénelage du bord de la photo. */}
      <div className="bg-creme shadow-[0_-6px_18px_rgba(41,26,16,0.08)] relative -mt-3.5 flex min-h-0 flex-1 flex-col rounded-t-[18px] lg:static lg:mt-0 lg:h-full lg:w-[min(38vw,440px)] lg:flex-none lg:rounded-none lg:shadow-none">
        {/* Même entête que le mobile, juste un bouton bordé plutôt qu'un
            overlay sur photo : la catégorie prend la place laissée par
            l'ancien `justify-end`, jamais dans le volet qui défile plus bas
            (WED-220). `justify-between` a besoin de deux enfants pour pousser
            le bouton à droite — d'où le `span` vide quand il n'y a pas de
            catégorie, plutôt qu'un retour silencieux à `justify-end`. */}
        <div className="border-bordeaux/10 hidden shrink-0 items-start justify-between border-b px-7 pt-7 pb-[18px] lg:flex">
          {photo.category ? (
            <p className="text-accent m-0 self-center text-[11px] font-semibold uppercase tracking-[0.18em]">
              {photo.category}
            </p>
          ) : (
            <span aria-hidden="true" />
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="border-bordeaux/20 text-bordeaux hover:bg-bordeaux/5 flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full border transition-colors"
          >
            <X size={14} aria-hidden="true" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-[22px] py-5 lg:gap-[22px] lg:px-7 lg:py-[22px]">
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
            contacter. La lightbox ne sait rien de l'authentification : elle
            appelle son callback, et c'est l'appelant qui tranche (US5, WED-157).
            Elle ne se ferme pas après l'action — la confirmation reste sur
            l'écran d'origine, aucune redirection forcée.
            TODO(WED-154) : le terme env(safe-area-inset-bottom) vaut 0 tant que
            `viewport` n'expose pas viewportFit:'cover' (app/layout.tsx). Sans
            cover, iOS pose déjà le contenu dans la zone sûre, donc rien ne passe
            sous la barre d'accueil ; on le garde pour ne pas casser le jour où
            quelqu'un activera cover. À revoir avec ce changement-là. */}
        <div className="border-bordeaux/10 flex shrink-0 flex-col gap-2.5 border-t px-[22px] pt-3.5 pb-[calc(22px_+_env(safe-area-inset-bottom))] lg:px-7 lg:pt-[18px] lg:pb-[26px]">
          {/* Le bouton reste cliquable une fois confirmé : les deux écritures
              sont idempotentes côté backend, et griser une confirmation la
              ferait passer pour une indisponibilité. Le contact fait exception
              dès que le statut réel du lead est connu (WED-186) — attente et
              refus sont des constats, il n'y a plus rien à rejouer. */}
          <button
            type="button"
            onClick={onPin}
            className={`${CTA_BASE} ${pinCta.confirmed ? CTA_CONFIRMED : CTA_IDLE}`}
          >
            <Heart size={15} aria-hidden="true" />
            {pinCta.label}
          </button>
          <button
            type="button"
            onClick={onContact}
            disabled={contactCta.disabled}
            className={`${CTA_BASE} ${
              isContactRefused
                ? CTA_REFUSED
                : contactCta.disabled
                  ? CTA_MUTED
                  : contactCta.confirmed
                    ? CTA_CONFIRMED
                    : CTA_IDLE
            }`}
          >
            {ContactIcon && <ContactIcon size={15} aria-hidden="true" />}
            {contactCta.label}
          </button>

          {/* Seule une écriture réellement passée mène quelque part : sans
              compte, l'espace perso renverrait le couple vers une connexion. */}
          {showsCoupleSpaceLink && (
            <Link
              href={COUPLE_SPACE_PATH}
              className="text-bordeaux mt-1 text-center text-[11px] font-medium underline underline-offset-4"
            >
              Voir mes coups de cœur et demandes
            </Link>
          )}

          {/* L'alternative au refus, jamais en même temps que le lien ci-dessus :
              `showsDiscoveryPrompt` et `showsCoupleSpaceLink` du contact sont
              exclusifs par construction (REFUSEE contre DEBLOQUEE). Fermer la
              lightbox suffit — la galerie est déjà derrière. */}
          {contactCta.showsDiscoveryPrompt && (
            <button
              type="button"
              onClick={onClose}
              className="text-accent mt-0.5 text-center text-[12px] font-semibold underline underline-offset-4"
            >
              Découvrir d&apos;autres profils
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
