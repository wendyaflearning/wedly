'use client'

import Link from 'next/link'
import { Heart, MessageSquare } from 'lucide-react'
import { COUPLE_ONBOARDING_PATH } from './AccountCreationModal'
import { usePendingActionCounts } from './PendingActionsProvider'
import {
  contactCountLabel,
  hasPendingActions,
  pinCountLabel,
  type PendingActionCounts,
} from '@/lib/wedream-pending-summary'

/**
 * Même traitement de panneau que le modal de US6, repris de la maquette Claude
 * Design « Wedream Galerie Inspirationnelle » : le badge et le modal parlent du
 * même sujet à quelques secondes d'intervalle, ils ne peuvent pas avoir deux
 * identités visuelles. Aucun token du @theme n'est assez sombre pour porter du
 * texte crème à ce contraste.
 */
const PANEL_BG = 'rgba(46,18,32,0.94)'
const PANEL_SHADOW = '0 18px 44px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,246,237,0.14)'

type Counter = {
  key: 'pin' | 'contact'
  count: number
  label: string
  icon: typeof Heart
  /** Le cœur est plein comme dans la grille : le geste est posé, pas proposé. */
  filled: boolean
}

/**
 * La partie visible du badge, sans contexte : elle ne sait rien du stockage, on
 * lui donne deux chiffres. C'est ce qui la rend testable sans navigateur.
 */
export function PendingActionsBadgeView({ pinCount, contactCount }: PendingActionCounts) {
  // Rien en attente, rien à l'écran : le badge n'existe pas tant que le couple
  // n'a rien posé (WED-161, CA1).
  if (!hasPendingActions({ pinCount, contactCount })) return null

  const allCounters: Counter[] = [
    { key: 'pin', count: pinCount, label: pinCountLabel(pinCount), icon: Heart, filled: true },
    {
      key: 'contact',
      count: contactCount,
      label: contactCountLabel(contactCount),
      icon: MessageSquare,
      filled: false,
    },
  ]

  // Un compteur à zéro disparaît entièrement, séparateur compris : « 0 demande
  // en attente » serait du bruit sur un rappel qui doit se lire d'un coup d'œil.
  const counters = allCounters.filter((counter) => counter.count > 0)

  return (
    /* Centré à toutes les largeurs, jamais collé à un bord : c'est un rappel du
       parcours en cours, pas une notification qu'on repousse dans un coin.

       z-50 : au-dessus de la galerie, mais sous la lightbox (z-60), le toast
       (z-70) et le modal (z-80) — un rappel permanent ne doit jamais recouvrir
       ce que le couple vient d'ouvrir. */
    <aside
      aria-label="Vos gestes en attente"
      style={{ background: PANEL_BG, boxShadow: PANEL_SHADOW }}
      className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full py-2.5 pr-2.5 pl-5 md:bottom-6 md:gap-4 md:pl-6"
    >
      <div className="font-manrope text-creme flex items-center gap-2.5 text-[13px] md:gap-3">
        {counters.map((counter, index) => {
          const Icon = counter.icon

          return (
            <span key={counter.key} className="flex items-center gap-2">
              {/* Le séparateur est décoratif : les deux compteurs sont déjà deux
                  éléments distincts pour un lecteur d'écran. */}
              {index > 0 && (
                <span aria-hidden="true" className="text-creme/35 mr-0.5">
                  ·
                </span>
              )}

              <Icon
                size={14}
                strokeWidth={1.8}
                aria-hidden="true"
                className={counter.filled ? 'fill-current' : 'fill-none'}
              />

              {/* Le libellé complet est toujours annoncé, quelle que soit la
                  largeur : c'est l'affichage qui se compacte, pas l'information. */}
              <span className="sr-only">{counter.label}</span>

              {/* Mobile : icône + chiffre, un par compteur, jamais de total. */}
              <span aria-hidden="true" className="md:hidden">
                {counter.count}
              </span>

              <span aria-hidden="true" className="hidden whitespace-nowrap md:inline">
                {counter.label}
              </span>
            </span>
          )
        })}
      </div>

      {/* Une navigation, pas une proposition : ce lien va droit à l'écran 1 de
          l'onboarding et ne rouvre jamais le modal de US6, ni son drapeau. */}
      <Link
        href={COUPLE_ONBOARDING_PATH}
        className="bg-accent text-creme font-manrope rounded-full px-4 py-2 text-[10px] font-semibold tracking-[0.14em] whitespace-nowrap uppercase transition-transform hover:-translate-y-px hover:brightness-105 md:px-5 md:text-[11px] md:tracking-[0.16em]"
      >
        Créer mon compte
      </Link>
    </aside>
  )
}

export function PendingActionsBadge() {
  const { pinCount, contactCount } = usePendingActionCounts()

  return <PendingActionsBadgeView pinCount={pinCount} contactCount={contactCount} />
}
