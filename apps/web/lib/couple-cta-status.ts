import { cache } from 'react'
import { cookies } from 'next/headers'
import type { CoupleLeadStatus } from './couple-lead-status'
import type { CtaConfirmationStatus } from './wedream-cta-confirmation'

const API_URL = process.env.NEXT_PUBLIC_API_URL

/**
 * Les gestes déjà posés par le couple, tels que la galerie doit les relire.
 *
 * Deux clés différentes, parce que les deux gestes ne portent pas sur la même
 * chose (WED-195) :
 *
 * - un coup de cœur porte sur **une photo** — épingler une image ne dit rien de
 *   la suivante, du même prestataire ou non ;
 * - une demande de mise en relation porte sur **un prestataire** — c'est ce que
 *   garantit `UNIQ_provider_lead_couple_vendor` côté backend : un seul lead par
 *   couple et par prestataire, quelle que soit la photo d'où part le clic.
 *
 * Les indexer pareil était le bug : une demande retenue par sa photo de départ
 * laissait la deuxième photo du même prestataire à l'état neuf, et le couple
 * relançait un geste déjà fait pour recevoir « votre demande est partie » sur un
 * no-op silencieux.
 *
 * Le type vit ici plutôt que dans PortfolioGrid parce que le serveur le
 * construit et le client le consomme (WED-182).
 */
/**
 * Ce qu'une demande de mise en relation laisse sur les boutons : qu'elle existe,
 * et où elle en est.
 *
 * Les deux ne se déduisent pas l'un de l'autre. `status` dit si le couple a posé
 * le geste — il vaut `auth_required` tant qu'il n'a pas de compte, et la demande
 * n'est alors jamais partie. `leadStatus` n'existe que quand elle est réellement
 * en base, et dit ce que le prestataire en a fait (WED-186).
 */
export type ContactCtaState = {
  status: CtaConfirmationStatus
  leadStatus?: CoupleLeadStatus
}

export type CoupleCtaStatuses = {
  /** Clé = id de la photo. */
  pins: Record<string, CtaConfirmationStatus>
  /** Clé = `vendorId`, l'identifiant de corrélation opaque porté par les photos. */
  contacts: Record<string, ContactCtaState>
}

/**
 * Un objet neuf à chaque appel, jamais une constante partagée : la valeur part
 * dans un `useState` côté client, et deux rendus ne doivent pas se retrouver à
 * pointer sur la même référence.
 */
function emptyStatuses(): CoupleCtaStatuses {
  return { pins: {}, contacts: {} }
}

/** Ce que la galerie retient d'un épinglé : la photo, rien d'autre. */
type CouplePin = { portfolioImageId: string }

/**
 * Ce que la galerie retient d'une demande : le prestataire, et où elle en est.
 *
 * `portfolioImageId` est toujours dans la réponse et n'est plus lu ici — la
 * photo de départ appartient à « Mes demandes », qui la montre au couple. La
 * galerie, elle, n'a besoin que de savoir *qui* a déjà été contacté. Au passage,
 * une demande partie hors galerie (photo nulle) marque désormais les photos de
 * son prestataire, alors qu'elle était simplement ignorée avant.
 */
type CoupleProviderLead = { vendorId?: string; status: string }

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
export const fetchInitialCtaStatuses = cache(async (): Promise<CoupleCtaStatuses> => {
  const cookieStore = await cookies()
  const token = cookieStore.get('jwt_token')
  if (!token) return emptyStatuses()

  const [pinItems, leadItems] = await Promise.all([
    fetchItems<CouplePin>('/api/v1/couples/me/pins', token.value),
    fetchItems<CoupleProviderLead>('/api/v1/couples/me/provider-leads', token.value),
  ])

  const pins: CoupleCtaStatuses['pins'] = {}
  const contacts: CoupleCtaStatuses['contacts'] = {}

  for (const pin of pinItems) {
    if (pin.portfolioImageId) pins[pin.portfolioImageId] = 'done'
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
   *
   * L'entrée est posée sous le prestataire et non sous la photo de départ
   * (WED-195) : c'est ce qui fait que toutes ses photos s'ouvrent sur le même
   * statut, celle d'où la demande est partie comme les autres.
   *
   * Une demande sans `vendorId` est ignorée plutôt que devinée : sur un backend
   * antérieur à WED-195, une clé `undefined` marquerait sinon toutes les photos.
   */
  for (const lead of leadItems) {
    if (!lead.vendorId) continue
    contacts[lead.vendorId] = { status: 'done', leadStatus: lead.status as CoupleLeadStatus }
  }

  return { pins, contacts }
})
