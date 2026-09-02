import type { CoupleLeadStatus } from './couple-lead-status'
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
  /**
   * Le bouton ne mène plus nulle part. Vrai pour l'attente comme pour le refus :
   * les deux sont des constats, il n'y a rien à rejouer tant que le prestataire
   * n'a pas répondu, et rien du tout une fois qu'il a refusé (WED-186, CA6 — le
   * refus est définitif côté produit, laisser le bouton actif offrirait un
   * recontact qui n'existe pas). Seule `DEBLOQUEE` reste active, parce qu'elle
   * mène quelque part : l'espace perso.
   */
  disabled: boolean
  /** La sortie proposée à la place : aller voir d'autres prestataires (CA4). */
  showsDiscoveryPrompt: boolean
}

const IDLE_LABELS: Record<CtaKind, string> = {
  pin: 'Épingler',
  contact: 'Je veux être mis en relation',
}

/**
 * Ce que le couple lit quand le backend a nommé le statut réel de sa demande
 * (WED-186). « Demande envoyée » est vrai au moment de l'envoi et le devient
 * faux dès que le prestataire répond : ces trois libellés remplacent le texte
 * unique qui laissait croire à un nouvel envoi à chaque re-clic.
 */
const LEAD_STATUS_LABELS: Record<CoupleLeadStatus, string> = {
  EN_ATTENTE: 'Demande envoyée — en attente',
  DEBLOQUEE: 'Vous êtes déjà en contact',
  REFUSEE: 'Demande non retenue',
}

/**
 * Ce que le bouton doit dire et montrer, sans rien savoir du rendu.
 *
 * Le seul libellé qui distingue le couple connecté du couple sans compte est
 * celui du contact : « envoyée » affirmerait qu'un prestataire a reçu la
 * demande, alors que rien n'est parti tant que le compte n'existe pas (WED-158,
 * CA2). L'épingle, elle, se dit « Épinglé » dans les deux cas — le geste est
 * enregistré ou mis en file, mais il n'engage personne d'autre que le couple.
 *
 * `leadStatus` n'arrive qu'après un aller-retour réseau sur le contact : tant
 * qu'il est absent, rien ne change du comportement d'origine. C'est ce qui
 * permet au rendu serveur de rester générique (WED-182) et au raffinement de
 * n'apparaître qu'au clic.
 */
export function ctaConfirmation(
  kind: CtaKind,
  status: CtaConfirmationStatus,
  leadStatus?: CoupleLeadStatus
): CtaConfirmation {
  if (status === 'idle') {
    return {
      label: IDLE_LABELS[kind],
      confirmed: false,
      showsCoupleSpaceLink: false,
      disabled: false,
      showsDiscoveryPrompt: false,
    }
  }

  // Avant la branche générique : dès que le statut réel est connu, c'est lui qui
  // décide, y compris du lien espace perso — une demande refusée n'a rien à y
  // montrer, une demande débloquée si.
  //
  // Un seul des trois statuts laisse le bouton actif : `DEBLOQUEE`, parce qu'il
  // mène quelque part (l'espace perso). Les deux autres sont des constats, pas
  // des actions — la maquette les peint en fond neutre et leur retire le clic.
  // Ce n'est pas une indisponibilité déguisée : le geste a bien abouti, il n'y a
  // simplement plus rien à rejouer tant que le prestataire n'a pas répondu.
  if (kind === 'contact' && status === 'done' && leadStatus !== undefined) {
    return {
      label: LEAD_STATUS_LABELS[leadStatus],
      confirmed: leadStatus === 'DEBLOQUEE',
      showsCoupleSpaceLink: leadStatus === 'DEBLOQUEE',
      disabled: leadStatus !== 'DEBLOQUEE',
      showsDiscoveryPrompt: leadStatus === 'REFUSEE',
    }
  }

  const label =
    kind === 'pin' ? 'Épinglé' : status === 'done' ? 'Demande envoyée' : 'Demande en attente'

  return {
    label,
    confirmed: true,
    showsCoupleSpaceLink: status === 'done',
    disabled: false,
    showsDiscoveryPrompt: false,
  }
}
