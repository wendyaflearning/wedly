'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { X } from 'lucide-react'

/** Le wordmark clair des fonds sombres, celui du header d'onboarding et des écrans auth. */
const LOGO_ON_DARK = 'https://res.cloudinary.com/dadvrspox/image/upload/v1781796191/logo_light_kcub6h.svg'

export const COUPLE_ONBOARDING_PATH = '/couple-onboarding'

/**
 * Bordeaux assombri du panneau, repris tel quel de la maquette Claude Design
 * « Wedream Galerie Inspirationnelle ». Aucun token équivalent n'existe dans le
 * @theme de globals.css : `bordeaux` (#4E1A32) est trop clair pour porter le
 * texte crème du modal avec le même contraste.
 */
const PANEL_BG = 'rgba(46,18,32,0.94)'
const PANEL_SHADOW = '0 40px 90px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,246,237,0.14)'
/** `modalPop` est déjà déclaré dans globals.css (utilisé par `.modal-enter`). */
const PANEL_ANIMATION = 'modalPop 0.3s cubic-bezier(0.22,1,0.36,1) both'

interface AccountCreationModalProps {
  onClose: () => void
}

/**
 * La proposition de créer un compte, après un geste qu'un couple non connecté ne
 * pouvait pas enregistrer (WED-160).
 *
 * Le modal ne sait rien de la file d'attente : le geste y est déjà rangé quand
 * il s'ouvre, et « Plus tard » ne le retire pas. Les deux sorties sont
 * équivalentes pour la suite du parcours — le drapeau « déjà vu » est posé à
 * l'ouverture, pas à la fermeture.
 *
 * « Créer mon compte » est un lien et non un bouton : c'est une navigation, elle
 * doit s'ouvrir dans un nouvel onglet au clic milieu comme n'importe quelle
 * autre.
 */
export function AccountCreationModal({ onClose }: AccountCreationModalProps) {
  // Échap doit appeler le dernier `onClose` reçu sans relancer le verrou de
  // scroll, qui restaurerait alors un overflow déjà à 'hidden'.
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

  return (
    /* z-[80] : au-dessus de la lightbox (z-60) et du toast (z-70) — le modal est
       la dernière chose posée à l'écran, rien ne doit passer devant. */
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="account-modal-title"
      onClick={onClose}
      className="bg-texte/60 fixed inset-0 z-[80] flex items-center justify-center p-5 backdrop-blur-[6px]"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: PANEL_BG, boxShadow: PANEL_SHADOW, animation: PANEL_ANIMATION }}
        className="relative flex w-[min(420px,86vw)] flex-col items-center gap-4 rounded-[26px] px-9 py-11 text-center"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="text-creme hover:bg-creme/8 absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full transition-colors"
        >
          <X size={14} strokeWidth={1.4} aria-hidden="true" />
        </button>

        <Image
          src={LOGO_ON_DARK}
          alt="Wedly"
          width={0}
          height={0}
          sizes="120px"
          style={{ height: '28px', width: 'auto' }}
        />

        <h2
          id="account-modal-title"
          className="font-cormorant text-creme m-0 text-[30px] tracking-[-0.01em]"
        >
          Créez votre compte
        </h2>

        <p className="font-manrope text-dore m-0 text-sm leading-relaxed">
          Pour épingler vos coups de cœur et être mis en relation avec les prestataires.
        </p>

        <Link
          href={COUPLE_ONBOARDING_PATH}
          className="bg-accent text-creme font-manrope mt-2 rounded-full px-[30px] py-3.5 text-[11px] font-semibold tracking-[0.18em] uppercase shadow-[0_12px_28px_rgba(227,87,4,0.3)] transition-transform hover:-translate-y-px hover:brightness-105"
        >
          Créer mon compte
        </Link>

        <button
          type="button"
          onClick={onClose}
          className="font-manrope text-creme/55 decoration-creme/30 hover:text-creme text-[11px] underline transition-colors"
        >
          Plus tard
        </button>
      </div>
    </div>
  )
}
