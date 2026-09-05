/**
 * Zone « Épinglés » de Mon espace Wedly (US-6.6 / WED-135, WED-197).
 *
 * Types + helpers d'affichage, sans dépendance serveur — le fetch authentifié
 * vit dans `couple-pins.server.ts`, comme pour la zone « Demandes de contact ».
 */

import type { PublicPortfolioImage } from './wedream-gallery'

export type CouplePin = {
  id: string
  /** Déjà public dans la galerie WedDream ; sert à marquer les photos épinglées. */
  portfolioImageId: string
  photoUrl: string
  pinnedAt: string
  /** Identifiant opaque de corrélation — jamais un nom prestataire (WED-197). */
  vendorId: string
  /** Clé = label du TagType, valeurs = labels des TagValue de la photo. */
  tagsByGroup: Record<string, string[]>
}

/**
 * On distingue « aucun épinglé » (liste vide, cas nominal) de « lecture
 * impossible » (réseau/API en échec) pour ne pas afficher l'état vide à la
 * place de l'état erreur.
 */
export type CouplePinsResult =
  | { ok: true; items: CouplePin[] }
  | { ok: false }

// --- Libellés d'affichage -------------------------------------------------

/**
 * « Épinglée le 12 août ». `null` si la date est illisible — la photo reste
 * affichée, seule la légende disparaît.
 *
 * Le formatage est local à la zone plutôt que partagé avec `couple-leads` :
 * les deux zones ont leur propre grammaire de libellés et rien ne garantit
 * qu'elles évoluent ensemble.
 */
export function formatPinnedAt(iso: string): string | null {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  const day = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long' }).format(date)
  return `Épinglée le ${day}`
}

/** « 12 photos épinglées » — `null` quand la grille est vide (l'état vide parle déjà). */
export function pinnedCountLabel(count: number): string | null {
  if (!Number.isFinite(count) || count <= 0) return null
  return count === 1 ? '1 photo épinglée' : `${count} photos épinglées`
}

// --- Écriture ---------------------------------------------------------------

/**
 * Retire une photo de la liste affichée, sans toucher au tableau reçu.
 *
 * Le filtre porte sur `portfolioImageId` et non sur `id` : c'est la photo que le
 * backend identifie au dé-épinglage (`DELETE /couples/me/pins/{portfolioImageId}`),
 * et raisonner sur deux clés différentes selon l'étape est le meilleur moyen de
 * retirer la mauvaise vignette.
 *
 * Un identifiant inconnu ne fait rien — le dé-épinglage est idempotent côté
 * backend (COUPLE-PIN-005), l'écran l'est aussi.
 */
export function removePin(pins: CouplePin[], portfolioImageId: string): CouplePin[] {
  return pins.filter((pin) => pin.portfolioImageId !== portfolioImageId)
}

/** Shape attendue par `Lightbox` — même contrat que la galerie WedDream. */
export function pinToPublicImage(pin: CouplePin): PublicPortfolioImage {
  return {
    id: pin.portfolioImageId,
    url: pin.photoUrl,
    tagsByGroup: pin.tagsByGroup,
    vendorId: pin.vendorId,
  }
}
