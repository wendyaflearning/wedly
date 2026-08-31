import type { PendingAction } from './wedream-pending-actions'

/**
 * Ce qu'un écran a besoin de savoir de la file : deux compteurs, jamais un total.
 *
 * Épingler une photo et demander une mise en relation ne sont pas le même geste
 * et n'appellent pas la même suite — les fusionner en un chiffre unique ferait
 * croire à un couple qui a épinglé deux photos qu'il a contacté deux prestataires
 * (WED-161, CA2).
 */
export type PendingActionCounts = {
  pinCount: number
  contactCount: number
}

/**
 * Référence stable, partagée : `useSyncExternalStore` compare les snapshots par
 * identité, et une file vide doit toujours rendre le même objet.
 */
export const EMPTY_PENDING_ACTION_COUNTS: PendingActionCounts = Object.freeze({
  pinCount: 0,
  contactCount: 0,
})

export function countPendingActions(actions: PendingAction[]): PendingActionCounts {
  let pinCount = 0
  let contactCount = 0

  for (const action of actions) {
    if (action.kind === 'pin') pinCount += 1
    else contactCount += 1
  }

  return { pinCount, contactCount }
}

export function hasPendingActions(counts: PendingActionCounts): boolean {
  return counts.pinCount > 0 || counts.contactCount > 0
}

/**
 * Le pluriel français se déclenche à partir de deux : « 0 coup de cœur »,
 * « 1 coup de cœur », « 2 coups de cœur ». Le cœur porte l'accord, pas « coup »
 * seul — d'où le libellé écrit en entier plutôt qu'un `s` ajouté à la volée.
 */
export function pinCountLabel(count: number): string {
  return `${count} ${count > 1 ? 'coups de cœur' : 'coup de cœur'}`
}

/**
 * Toujours « en attente », jamais « envoyée » : tant que le couple n'a pas de
 * compte, la demande n'est partie nulle part — elle attend l'inscription (US8).
 */
export function contactCountLabel(count: number): string {
  return `${count} ${count > 1 ? 'demandes en attente' : 'demande en attente'}`
}
