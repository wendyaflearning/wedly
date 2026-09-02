'use client'

import { useSearchParams } from 'next/navigation'
import { QUEUE_FLUSH_COUNT_PARAM } from '@/lib/couple-space'

/**
 * La confirmation de la bascule inscription → connexion (WED-162 / US9).
 *
 * Un couple qui avait épinglé des photos sans compte, puis découvert qu'il en
 * avait déjà un, arrive ici juste après que sa file a été rejouée. Sans un mot,
 * il n'aurait aucun moyen de savoir que ses coups de cœur l'ont suivi.
 *
 * Le compte passe par l'URL et non par un store : le rejeu a lieu sur l'écran de
 * connexion, et la bascule vers l'espace est une navigation pleine page — rien
 * en mémoire ne lui survit. C'est aussi ce qui rend la bannière naturellement
 * éphémère : elle disparaît au premier changement d'onglet.
 */
export default function QueueFlushBanner() {
  const searchParams = useSearchParams()
  const raw = searchParams.get(QUEUE_FLUSH_COUNT_PARAM)
  const count = raw === null ? 0 : Number.parseInt(raw, 10)

  // Le paramètre est réécrivable à la main : tout ce qui n'est pas un entier
  // positif ne dit rien et n'affiche rien.
  if (!Number.isInteger(count) || count <= 0) return null

  return (
    <div
      role="status"
      className="mt-8 rounded-2xl border border-accent/20 bg-accent/8 px-5 py-4 text-sm text-texte md:mt-10 md:px-6"
    >
      <span className="font-semibold text-accent">
        {count} coup{count > 1 ? 's' : ''} de cœur
      </span>{' '}
      ajouté{count > 1 ? 's' : ''} à votre espace.
    </div>
  )
}
