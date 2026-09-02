import { cache } from 'react'
import { cookies } from 'next/headers'
import type { CoupleLeadStatus } from './couple-lead-status'
import type { CtaKind } from './wedream-cta'
import type { CtaConfirmationStatus } from './wedream-cta-confirmation'

const API_URL = process.env.NEXT_PUBLIC_API_URL

/**
 * Les gestes déjà posés par le couple, photo par photo. La clé est l'id de la
 * photo et non un état global : le couple qui a épinglé une image ne doit pas
 * retrouver la suivante déjà marquée.
 *
 * Le type vit ici plutôt que dans PortfolioGrid parce que le serveur le
 * construit et le client le consomme (WED-182).
 */
export type CtaStatusesByImage = Record<
  string,
  Partial<Record<CtaKind, CtaConfirmationStatus>> & { contactLeadStatus?: CoupleLeadStatus }
>

/** Ce que la galerie retient d'un épinglé : la photo, rien d'autre. */
type CouplePin = { portfolioImageId: string }

/** Une demande partie hors galerie n'a pas de photo — d'où le null. */
type CoupleProviderLead = { portfolioImageId: string | null; status: string }

/**
 * Un endpoint muet ou en erreur rend une liste vide plutôt que de remonter
 * l'échec : la galerie doit s'afficher même si l'espace couple est indisponible,
 * quitte à repartir des boutons à l'état idle. C'est aussi ce qui absorbe le 403
 * d'un compte prestataire connecté, qui n'a par définition ni épingle ni demande
 * de couple.
 */
async function fetchItems<T>(path: string, token: string): Promise<T[]> {
  if (!API_URL) return []

  const response = await fetch(`${API_URL}${path}`, {
    headers: { Cookie: `jwt_token=${token}` },
    cache: 'no-store',
  }).catch(() => null)

  if (!response?.ok) return []

  const body: { items?: T[] } | null = await response.json().catch(() => null)

  return body?.items ?? []
}

/**
 * L'état de départ des boutons de la galerie, lu au rendu serveur (WED-182).
 *
 * Appel direct à Symfony, sans Route Handler : c'est l'exception documentée à la
 * règle générale du repo. Elle tient parce que l'appel est serveur à serveur
 * (Next vers Symfony) — le navigateur du couple n'y participe jamais, il n'y a
 * donc ni CORS à traverser ni URL d'API à cacher. La règle reste entière pour
 * tout fetch parti d'un Client Component, y compris les écritures de ces mêmes
 * gestes (`lib/wedream-cta.ts`).
 *
 * Sans cookie, aucun des deux appels n'est tenté : un couple non connecté n'a
 * rien à retrouver, et le trafic public de la galerie ne doit pas taper des
 * endpoints qui lui répondraient 401 (CA4).
 *
 * Les deux appels partent ensemble et échouent séparément : l'un qui tombe ne
 * doit pas emporter les résultats de l'autre.
 *
 * `cache()` pour la même raison que `fetchCoupleSession` : si un layout partagé
 * en vient à rappeler cette lecture dans le même arbre de rendu, elle ne repart
 * pas sur le réseau.
 */
export const fetchInitialCtaStatuses = cache(async (): Promise<CtaStatusesByImage> => {
  const cookieStore = await cookies()
  const token = cookieStore.get('jwt_token')
  if (!token) return {}

  const [pins, leads] = await Promise.all([
    fetchItems<CouplePin>('/api/v1/couples/me/pins', token.value),
    fetchItems<CoupleProviderLead>('/api/v1/couples/me/provider-leads', token.value),
  ])

  const statuses: CtaStatusesByImage = {}

  for (const pin of pins) {
    statuses[pin.portfolioImageId] = { ...statuses[pin.portfolioImageId], pin: 'done' }
  }

  /**
   * Le statut métier de la demande est retenu en plus du simple « une demande
   * existe » : la lightbox en a besoin dès le premier rendu (WED-186), pas
   * seulement au clic. Sans lui, un couple qui rouvre la galerie relit
   * « Demande envoyée » sur un prestataire qui vient de refuser, jusqu'à ce
   * qu'il reclique — c'est-à-dire le bug que WED-186 corrige, réintroduit par
   * le chemin du rendu serveur.
   *
   * Le cast est volontairement nu : `status` vient de notre propre backend, où
   * il est sérialisé depuis `CoupleLeadStatus` et ne peut donc valoir que l'une
   * des trois valeurs. Valider ici dupliquerait ce contrat, et une valeur
   * inconnue ne trouverait de toute façon pas de libellé à afficher.
   */
  for (const lead of leads) {
    if (!lead.portfolioImageId) continue
    statuses[lead.portfolioImageId] = {
      ...statuses[lead.portfolioImageId],
      contact: 'done',
      contactLeadStatus: lead.status as CoupleLeadStatus,
    }
  }

  return statuses
})
