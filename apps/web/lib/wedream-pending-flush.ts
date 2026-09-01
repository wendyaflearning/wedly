import { submitCtaAction } from './wedream-cta'
import {
  loadPendingActions,
  removePendingActions,
  type StorageLike,
} from './wedream-pending-actions'

/**
 * Rejeu de la file des gestes posés sans compte (WED-160), une fois que le
 * couple en a un.
 *
 * Deux appelants, un seul mécanisme : l'inscription qui vient d'aboutir (US8) et
 * la connexion depuis l'écran « vous avez déjà un compte » (US9). Les deux
 * arrivent ici avec une session déjà posée, donc `submitCtaAction` s'authentifie
 * comme n'importe quel geste fait depuis la galerie.
 */

/**
 * Le stockage est accepté nullable parce que `browserStorage()` rend `null` dès
 * qu'il est refusé — Safari en navigation privée, quota plein, cookies bloqués.
 * Centraliser ce cas ici évite de le redemander à chaque appelant, et il n'a
 * qu'une seule réponse sensée : il n'y a pas de file, donc rien à rejouer.
 */
export async function flushPendingActions(
  storage: StorageLike | null,
): Promise<{ done: number }> {
  if (storage === null) return { done: 0 }

  const queue = loadPendingActions(storage)

  if (queue.length === 0) return { done: 0 }

  let done = 0

  // Séquentiel et non `Promise.all` : un couple peut avoir demandé le même
  // prestataire depuis deux photos, ce qui fait deux entrées ici (la file
  // dédoublonne sur le geste et la photo) mais un seul `ProviderLead` côté
  // backend, qui garde la photo de la *première* demande arrivée — celle que le
  // prestataire verra. En parallèle, laquelle des deux gagne deviendrait
  // arbitraire. L'ordre de la file est celui des gestes du couple, on le
  // respecte.
  for (const action of queue) {
    const outcome = await submitCtaAction(action)

    if (outcome.status === 'done') done += 1
  }

  // Purgée quoi qu'il arrive, succès partiel inclus. Garder les entrées en échec
  // pour un retry silencieux à la prochaine connexion ne rendrait rien : une
  // photo masquée ou un prestataire désactivé échouera exactement pareil, et la
  // file resterait pleine d'items morts pendant trente jours. Même arbitrage que
  // le reste du module — mieux vaut une file incomplète qu'un clic mort.
  removePendingActions(storage)

  return { done }
}
