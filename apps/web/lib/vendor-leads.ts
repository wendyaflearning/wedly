import type {
  UnlockedVendorProviderLead,
  VendorProviderLead,
  VendorProviderLeadStatus,
} from './vendor'

/**
 * Libellés et formatage des demandes de mise en relation côté prestataire
 * (WED-52). Sans dépendance serveur : ce module est importé par les Client
 * Components, là où `lib/vendor.ts` lit les cookies et reste server-only —
 * même découpage que `couple-leads.ts` / `couple-leads.server.ts`.
 */

/**
 * Le cycle de vie affiché : Nouveau → Accepté / Refusé → Clos.
 *
 * TODO(WED-52) : « Clos » n'est écrit par rien. `DecideVendorProviderLeadService`
 * ne pose que `accepted`/`refused`, et `closed`/`unavailable` ne survivent dans
 * l'enum backend que pour les lignes antérieures. Le libellé existe donc pour
 * ne pas afficher un statut brut sur une vieille ligne, pas parce qu'un parcours
 * y mène (décision du récap Notion du 03/09). À retirer si ces deux valeurs
 * disparaissent de la base.
 */
const STATUS_LABELS: Record<VendorProviderLeadStatus, string> = {
  pending: 'Nouveau',
  accepted: 'Accepté',
  confirmed: 'Accepté',
  contacted: 'Accepté',
  refused: 'Refusé',
  closed: 'Clos',
  unavailable: 'Clos',
}

/**
 * On discrimine sur la forme reçue, pas sur le statut. Le backend débloque via
 * `CoupleLeadStatus::revealsVendorIdentity()`, qui couvre aussi les statuts
 * historiques `confirmed`/`contacted` : rejouer ce `match` ici le ferait
 * diverger un jour, alors que la présence du champ ne peut pas mentir.
 */
export function isUnlockedVendorLead(
  lead: VendorProviderLead
): lead is UnlockedVendorProviderLead {
  return 'email' in lead
}

export function leadStatusLabel(status: VendorProviderLeadStatus): string {
  return STATUS_LABELS[status] ?? 'Clos'
}

/** Seul `pending` laisse encore une décision ouverte. */
export function isLeadDecidable(status: VendorProviderLeadStatus): boolean {
  return status === 'pending'
}

/** « 14 juin 2027 » — `null` si la date est illisible. */
export function formatWeddingDate(iso: string): string | null {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

/**
 * « Aujourd'hui » / « Hier » / « 28 août 2026 » — le bandeau de la maquette
 * annonce quand la demande est arrivée, pas l'horodatage brut.
 */
export function formatRequestedAt(iso: string): string | null {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null

  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const days = Math.round((startOfDay(new Date()) - startOfDay(date)) / 86_400_000)

  if (days === 0) return "Aujourd'hui"
  if (days === 1) return 'Hier'
  return formatWeddingDate(iso)
}

/** « 28 000 € » — le budget global du mariage, figé à la création du lead. */
export function formatBudget(cents: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(cents / 100)
}

/** « 120 invités ». */
export function formatGuestCount(count: number): string {
  return `${new Intl.NumberFormat('fr-FR').format(count)} ${count > 1 ? 'invités' : 'invité'}`
}
