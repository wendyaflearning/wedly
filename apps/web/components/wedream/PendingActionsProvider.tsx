'use client'

import { createContext, useContext, useSyncExternalStore } from 'react'
import {
  browserStorage,
  loadPendingActions,
  subscribeToPendingActions,
} from '@/lib/wedream-pending-actions'
import {
  countPendingActions,
  EMPTY_PENDING_ACTION_COUNTS,
  type PendingActionCounts,
} from '@/lib/wedream-pending-summary'

/**
 * Le seul point de lecture de la file dans Wedream (WED-161).
 *
 * Monté au niveau du layout `/wedream-vendors`, il n'est jamais démonté d'une
 * page à l'autre : les compteurs survivent au passage de la liste des métiers à
 * une galerie, ce que le CA « persiste en naviguant » demande explicitement.
 *
 * Il ne fait que lire. Vider la file appartient à l'inscription (US8) et à la
 * connexion (US9), pas à un composant d'affichage.
 */

/**
 * `useSyncExternalStore` compare les snapshots par identité et re-rend tant
 * qu'ils diffèrent : rendre un objet neuf à chaque lecture boucle à l'infini.
 * Le dernier snapshot est donc gardé ici, et sa référence n'est remplacée que
 * si un compteur a réellement bougé.
 */
let lastSnapshot: PendingActionCounts = EMPTY_PENDING_ACTION_COUNTS

function getSnapshot(): PendingActionCounts {
  const storage = browserStorage('local')
  const counts = storage
    ? countPendingActions(loadPendingActions(storage))
    : EMPTY_PENDING_ACTION_COUNTS

  if (counts.pinCount !== lastSnapshot.pinCount || counts.contactCount !== lastSnapshot.contactCount) {
    lastSnapshot = counts
  }

  return lastSnapshot
}

/**
 * Le serveur ne voit aucun localStorage : il rend une file vide, donc pas de
 * badge, et l'hydratation pose les vrais compteurs au premier rendu client.
 * C'est le seul moyen d'éviter un mismatch sur une donnée qui n'existe que dans
 * le navigateur.
 */
function getServerSnapshot(): PendingActionCounts {
  return EMPTY_PENDING_ACTION_COUNTS
}

const PendingActionsContext = createContext<PendingActionCounts | null>(null)

export function PendingActionsProvider({ children }: { children: React.ReactNode }) {
  const counts = useSyncExternalStore(subscribeToPendingActions, getSnapshot, getServerSnapshot)

  return <PendingActionsContext.Provider value={counts}>{children}</PendingActionsContext.Provider>
}

export function usePendingActionCounts(): PendingActionCounts {
  const counts = useContext(PendingActionsContext)

  if (counts === null) {
    throw new Error('usePendingActionCounts doit être appelé sous <PendingActionsProvider>.')
  }

  return counts
}
