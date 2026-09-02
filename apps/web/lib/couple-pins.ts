/**
 * Zone « Épinglés » de Mon espace Wedly (US-6.6 / WED-135).
 *
 * Types + helpers d'affichage, sans dépendance serveur — le fetch authentifié
 * vit dans `couple-pins.server.ts`, comme pour la zone « Demandes de contact ».
 *
 * Le DTO renvoyé par `GET /api/v1/couples/me/pins` (US-6.2 / WED-132) est
 * volontairement minimal : il n'a aucun champ capable de porter l'identité du
 * prestataire (COUPLE-PIN-002). Le front n'a donc rien à masquer, et la grille
 * n'ouvre aucune fiche : c'est le critère « aucun clic ne dévoile un profil
 * prestataire ».
 */

export type CouplePin = {
  id: string
  /** Déjà public dans la galerie WedDream ; sert à marquer les photos épinglées. */
  portfolioImageId: string
  photoUrl: string
  pinnedAt: string
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
