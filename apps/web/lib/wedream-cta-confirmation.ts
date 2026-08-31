import type { CtaKind } from './wedream-cta'

/**
 * Où en est un bouton de la lightbox pour une photo donnée.
 *
 * `idle` est l'état de départ : le couple n'a pas encore cliqué sur ce bouton
 * pour cette photo-là. Les deux autres reprennent tels quels les `status` que
 * `submitCtaAction` sait produire hors erreur — une écriture refusée ne confirme
 * rien, elle ne laisse donc pas de trace sur le bouton (le toast d'erreur s'en
 * charge).
 */
export type CtaConfirmationStatus = 'idle' | 'done' | 'auth_required'

export type CtaConfirmation = {
  label: string
  /** Le geste a été pris en compte : fond plein plutôt que contour. */
  confirmed: boolean
  /**
   * Vrai uniquement sur `done`. Un couple sans compte n'a pas d'espace perso à
   * visiter : lui proposer le lien l'enverrait sur une page qui le renverrait
   * se connecter.
   */
  showsCoupleSpaceLink: boolean
}

const IDLE_LABELS: Record<CtaKind, string> = {
  pin: 'Épingler',
  contact: 'Je veux être mis en relation',
}

/**
 * Ce que le bouton doit dire et montrer, sans rien savoir du rendu.
 *
 * Le seul libellé qui distingue le couple connecté du couple sans compte est
 * celui du contact : « envoyée » affirmerait qu'un prestataire a reçu la
 * demande, alors que rien n'est parti tant que le compte n'existe pas (WED-158,
 * CA2). L'épingle, elle, se dit « Épinglé » dans les deux cas — le geste est
 * enregistré ou mis en file, mais il n'engage personne d'autre que le couple.
 */
export function ctaConfirmation(kind: CtaKind, status: CtaConfirmationStatus): CtaConfirmation {
  if (status === 'idle') {
    return { label: IDLE_LABELS[kind], confirmed: false, showsCoupleSpaceLink: false }
  }

  const label =
    kind === 'pin' ? 'Épinglé' : status === 'done' ? 'Demande envoyée' : 'Demande en attente'

  return { label, confirmed: true, showsCoupleSpaceLink: status === 'done' }
}
