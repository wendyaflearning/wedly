/**
 * Contenu 100 % statique de la zone « Accompagnement » de Mon espace Wedly
 * (WED-136 / US-6.7 — US-6.3 n'a pas de backend, tout est couvert ici).
 *
 * Trois teasers « Bientôt disponible » pour le futur copilote payant. Aucun CTA,
 * aucun lien, aucune logique de paiement : la phase pilote est gratuite jusqu'à
 * la création de la société en octobre. Ne pas ajouter d'URL ni d'action ici —
 * ce module ne décrit que du texte affiché.
 */

export type CopilotIconKey = 'plan' | 'wallet' | 'match'

export type CopilotTeaser = {
  key: 'wedplan' | 'wedwallet' | 'wedmatch'
  name: string
  description: string
  icon: CopilotIconKey
}

/** Ordre repris de la maquette `espace_couple_accompagnement`. */
export const COPILOT_TEASERS: readonly CopilotTeaser[] = [
  {
    key: 'wedplan',
    name: 'WedPlan',
    description: 'Checklist et calendrier de préparation.',
    icon: 'plan',
  },
  {
    key: 'wedwallet',
    name: 'WedWallet',
    description: 'Budget et suivi des devis prestataires.',
    icon: 'wallet',
  },
  {
    key: 'wedmatch',
    name: 'WedMatch',
    description: 'Matching et mise en relation.',
    icon: 'match',
  },
] as const

export const ACCOMPAGNEMENT_EYEBROW = 'Votre accompagnement'

export const ACCOMPAGNEMENT_TITLE_LEAD = 'Votre accompagnement'

export const ACCOMPAGNEMENT_TITLE_EMPHASIS = 'Wedding Planning'

export const COPILOT_AVAILABILITY_BADGE = 'Bientôt disponible'

export const COPILOT_PLAN_BADGE = 'Formule payante'
