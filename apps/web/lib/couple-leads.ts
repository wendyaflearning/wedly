/**
 * Zone « Demandes de contact » de Mon espace Wedly (US-6.5 / WED-134).
 *
 * Types + helpers d'affichage, sans dépendance serveur : ce module est importé
 * aussi bien par les Server Components que par les Client Components. Le fetch
 * authentifié vit dans `couple-leads.server.ts`.
 *
 * Le front consomme le DTO tel que US-6.1 (WED-131) le renvoie et ne fait
 * AUCUN masquage : il se contente de discriminer sur `status`. Le DTO masqué
 * n'expose structurellement pas le nom ni les coordonnées du prestataire —
 * seule la forme `UnlockedLead` les porte (PROVIDER-LEAD-005).
 */

export type CoupleLeadStatus = 'EN_ATTENTE' | 'REFUSEE' | 'DEBLOQUEE'

export type VendorContact = {
  email: string | null
  phone: string | null
  address: string | null
  zipcode: string | null
  city: string | null
}

export type UnlockedVendor = {
  id: string
  brandName: string
  bio: string | null
  description: string | null
  vendorType: string
  services: string[]
  styles: string[]
  priceType: string
  priceMinCents: number | null
  priceMaxCents: number | null
  portfolio: string[]
  contact: VendorContact
}

type BaseLead = {
  id: string
  status: CoupleLeadStatus
  requestedAt: string
  category: string | null
  zones: string[]
  photoUrl: string | null
}

/** Demande `EN_ATTENTE` ou `REFUSEE` : jamais d'identité prestataire. */
export type MaskedLead = BaseLead & { status: 'EN_ATTENTE' | 'REFUSEE' }

/** Demande `DEBLOQUEE` : le prestataire a accepté, sa fiche est lisible. */
export type UnlockedLead = BaseLead & { status: 'DEBLOQUEE'; vendor: UnlockedVendor }

export type CoupleLead = MaskedLead | UnlockedLead

/**
 * On distingue « pas de demande » (liste vide, cas nominal) de « lecture
 * impossible » (réseau/API en échec) pour afficher l'état vide ou l'état
 * erreur sans les confondre.
 */
export type CoupleLeadsResult =
  | { ok: true; items: CoupleLead[] }
  | { ok: false }

export function isUnlockedLead(lead: CoupleLead): lead is UnlockedLead {
  return lead.status === 'DEBLOQUEE'
}

// --- Libellés d'affichage -------------------------------------------------

export const STATUS_LABELS: Record<CoupleLeadStatus, string> = {
  EN_ATTENTE: 'En attente',
  REFUSEE: 'Refusée',
  DEBLOQUEE: 'Débloquée',
}

/** Filtres de la barre : « Toutes » + un onglet par statut, dans cet ordre. */
export const STATUS_FILTER_ORDER: CoupleLeadStatus[] = ['EN_ATTENTE', 'DEBLOQUEE', 'REFUSEE']

const VENDOR_TYPE_LABELS: Record<string, string> = {
  freelance: 'Prestataire',
  lieu: 'Lieu de réception',
  traiteur: 'Traiteur',
  createurs: 'Créateur·rice',
}

const PRICE_TYPE_LABELS: Record<string, string> = {
  per_service: 'par prestation',
  per_person: 'par personne',
  per_hour: 'par heure',
}

export function vendorTypeLabel(slug: string): string {
  return VENDOR_TYPE_LABELS[slug] ?? slug
}

export function priceTypeLabel(slug: string): string {
  return PRICE_TYPE_LABELS[slug] ?? ''
}

export function formatSlug(slug: string): string {
  return slug.replace(/-/g, ' ').replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase())
}

/** « 12 août » — la date nue, pour les libellés qui portent déjà leur préfixe. */
export function formatLeadDate(iso: string): string | null {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long' }).format(date)
}

/** « Demandé le 12 août ». Retourne `null` si la date est illisible. */
export function formatRequestedAt(iso: string): string | null {
  const day = formatLeadDate(iso)
  return day === null ? null : `Demandé le ${day}`
}

function formatEuros(cents: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(cents / 100)
}

/** « À partir de 1 200 € » — `null` quand aucun prix plancher n'est renseigné. */
export function formatFromPrice(cents: number | null | undefined): string | null {
  if (typeof cents !== 'number' || cents <= 0) return null
  return `À partir de ${formatEuros(cents)}`
}

export function fullPriceRange(vendor: UnlockedVendor): string | null {
  const { priceMinCents, priceMaxCents, priceType } = vendor
  if (typeof priceMinCents !== 'number' || priceMinCents <= 0) return null

  const suffix = priceTypeLabel(priceType)
  const min = formatEuros(priceMinCents)
  if (typeof priceMaxCents === 'number' && priceMaxCents > priceMinCents) {
    return `${min} – ${formatEuros(priceMaxCents)}${suffix ? ` ${suffix}` : ''}`
  }
  return `À partir de ${min}${suffix ? ` ${suffix}` : ''}`
}

/**
 * « 2 200 € – 4 200 € » — le montant seul, sans le type de prestation. La ligne
 * Tarifs de l'Écran 4 affiche le libellé à gauche et le montant à droite, là où
 * `fullPriceRange` colle les deux dans une même phrase.
 */
export function priceAmountRange(vendor: UnlockedVendor): string | null {
  const { priceMinCents, priceMaxCents } = vendor
  if (typeof priceMinCents !== 'number' || priceMinCents <= 0) return null

  const min = formatEuros(priceMinCents)
  if (typeof priceMaxCents === 'number' && priceMaxCents > priceMinCents) {
    return `${min} – ${formatEuros(priceMaxCents)}`
  }
  return `À partir de ${min}`
}

/** « Voir les 24 photos » — `null` quand le portfolio est vide. */
export function portfolioLinkLabel(count: number): string | null {
  if (!Number.isFinite(count) || count <= 0) return null
  return count === 1 ? 'Voir la photo' : `Voir les ${count} photos`
}

/**
 * « 2 sur 4 débloqués » — où en est le couple dans ses demandes. Dérivé de la
 * liste déjà chargée : aucun appel réseau supplémentaire.
 */
export function unlockedProgressLabel(counts: StatusCounts): string | null {
  if (counts.ALL <= 0) return null
  const accord = counts.DEBLOQUEE > 1 ? 'débloqués' : 'débloqué'
  return `${counts.DEBLOQUEE} sur ${counts.ALL} ${accord}`
}

/**
 * Résumé prestataire du tooltip de survol (carte `DEBLOQUEE`, desktop). Aucun
 * appel réseau : tout vient déjà du bloc `vendor` de la carte.
 */
export function leadTooltipLines(lead: UnlockedLead): string[] {
  const { vendor } = lead
  const lines: string[] = [vendor.brandName]

  const role = lead.category ?? vendorTypeLabel(vendor.vendorType)
  if (role) lines.push(role)

  // Téléphone en priorité, e-mail à défaut.
  const contact = vendor.contact.phone ?? vendor.contact.email
  if (contact) lines.push(contact)

  const price = formatFromPrice(vendor.priceMinCents)
  if (price) lines.push(price)

  return lines
}

export type StatusCounts = Record<'ALL' | CoupleLeadStatus, number>

export function countByStatus(items: CoupleLead[]): StatusCounts {
  const counts: StatusCounts = { ALL: items.length, EN_ATTENTE: 0, DEBLOQUEE: 0, REFUSEE: 0 }
  for (const lead of items) counts[lead.status] += 1
  return counts
}

/**
 * Message affiché quand l'Écran 4 renvoie le couple vers sa liste. Deux causes
 * distinctes, deux messages — le retour silencieux ne disait rien de ce qui
 * venait de se passer.
 *
 * Aucune énumération possible : la lecture est déjà scopée au couple du JWT
 * (`/couples/me/provider-leads`), donc le lead d'un autre couple tombe dans
 * `introuvable`, indiscernable d'un identifiant qui n'a jamais existé.
 */
const LEAD_NOTICE_MESSAGES: Record<string, string> = {
  introuvable: "Cette demande n'existe plus.",
  verrouillee: "Cette demande n'est pas encore débloquée : le prestataire n'a pas encore répondu.",
}

export function leadNoticeMessage(code?: string): string | null {
  // `??` seul ne suffit pas : `'' ?? null` vaut `''`, pas `null`.
  return code ? (LEAD_NOTICE_MESSAGES[code] ?? null) : null
}
