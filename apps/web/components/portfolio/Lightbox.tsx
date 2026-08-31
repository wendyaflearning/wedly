'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Heart, MessageSquare, X } from 'lucide-react'
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
}

const noop = () => {}

const CTA_BASE =
  'flex items-center justify-center gap-2.5 rounded-full border px-4 py-3.5 text-[11px] font-semibold uppercase tracking-[0.16em] transition-colors'
/** Pas de `hover:` sur l'état confirmé : sur fond plein il ne se verrait pas. */
const CTA_CONFIRMED = 'border-bordeaux bg-bordeaux text-creme'
const CTA_IDLE = 'border-bordeaux/30 text-bordeaux hover:bg-bordeaux/5'

export function Lightbox({
  photo,
  onClose,
  onPin = noop,
  onContact = noop,
  pinStatus = 'idle',
  contactStatus = 'idle',
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

  const tagGroups = Object.entries(photo.tagsByGroup).filter(([, values]) => values.length > 0)

  const pinCta = ctaConfirmation('pin', pinStatus)
  const contactCta = ctaConfirmation('contact', contactStatus)
  const showsCoupleSpaceLink = pinCta.showsCoupleSpaceLink || contactCta.showsCoupleSpaceLink

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Photo en grand format"
      className="modal-enter bg-texte fixed inset-0 z-[60] flex flex-col md:flex-row"
    >
      {/* Volet photo — le fond noir autour de l'image fait office de backdrop.
          Sous 768px c'est une bande de hauteur fixe en haut de l'écran, au-dessus
          de laquelle remonte le volet détail. */}
      <div
        className="relative h-[262px] flex-none bg-black md:h-auto md:min-w-0 md:flex-1"
        onClick={onClose}
        role="presentation"
      >
        <Image
          src={photo.url}
          alt=""
          fill
          sizes="(min-width: 768px) 62vw, 100vw"
          className="object-cover md:object-contain"
          unoptimized
          onClick={(e) => e.stopPropagation()}
        />

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
          className="bg-texte/45 text-creme absolute top-4 right-4 flex h-[34px] w-[34px] items-center justify-center rounded-full md:hidden"
        >
          <X size={13} strokeWidth={1.8} aria-hidden="true" />
        </button>
      </div>

      {/* Volet détail : tags de la photo puis les deux actions. Panneau latéral
          sur desktop, feuille arrondie empilée sous la photo sur mobile.
          md:flex-none est indispensable : sans lui le flex-1 mobile ferait
          grossir le panneau au-delà de ses 440px sur desktop.
          `relative` l'est tout autant : le volet photo est positionné, donc sans
          ça il se peindrait par-dessus les 14px de chevauchement et masquerait
          les coins arrondis de la feuille. On le repasse en `static` au-delà de
          768px : le chevauchement n'existe plus, et le laisser positionné
          décalait d'un pixel l'anticrénelage du bord de la photo. */}
      <div className="bg-creme shadow-[0_-6px_18px_rgba(41,26,16,0.08)] relative -mt-3.5 flex min-h-0 flex-1 flex-col rounded-t-[18px] md:static md:mt-0 md:h-full md:w-[min(38vw,440px)] md:flex-none md:rounded-none md:shadow-none">
        <div className="border-bordeaux/10 hidden shrink-0 items-start justify-end border-b px-7 pt-7 pb-[18px] md:flex">
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="border-bordeaux/20 text-bordeaux hover:bg-bordeaux/5 flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full border transition-colors"
          >
            <X size={14} aria-hidden="true" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-[22px] py-5 md:gap-[22px] md:px-7 md:py-[22px]">
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
        <div className="border-bordeaux/10 flex shrink-0 flex-col gap-2.5 border-t px-[22px] pt-3.5 pb-[calc(22px_+_env(safe-area-inset-bottom))] md:px-7 md:pt-[18px] md:pb-[26px]">
          {/* Les boutons restent cliquables une fois confirmés : les deux
              écritures sont idempotentes côté backend, et griser le bouton
              ferait passer une confirmation pour une indisponibilité. */}
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
            className={`${CTA_BASE} ${contactCta.confirmed ? CTA_CONFIRMED : CTA_IDLE}`}
          >
            <MessageSquare size={15} aria-hidden="true" />
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
        </div>
      </div>
    </div>
  )
}
