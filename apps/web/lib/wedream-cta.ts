/** Les deux gestes d'intérêt d'un couple sur une photo Wedream. */
export type CtaKind = 'pin' | 'contact'

export type CtaAction = {
  kind: CtaKind
  portfolioImageId: string
}

/**
 * Ce que le clic a produit, du point de vue de l'écran.
 *
 * `auth_required` ne dit pas *pourquoi* la session manque : pas de cookie,
 * jeton expiré, ou compte connecté qui n'est pas un couple sont un seul et même
 * résultat pour le couple qui clique — il doit se connecter, et l'action est à
 * rejouer ensuite (WED-157, CA3). Distinguer les cas ici ferait entrer une
 * logique de rôle dans un écran public qui n'a pas à en avoir.
 */
export type CtaOutcome =
  | { status: 'done' }
  | { status: 'auth_required' }
  | { status: 'error'; message: string }

const ENDPOINTS: Record<CtaKind, string> = {
  pin: '/api/couples/me/pins',
  contact: '/api/couples/me/provider-leads',
}

const FALLBACK_ERROR = 'Une erreur est survenue. Réessayez.'

/**
 * Envoie le geste au Route Handler et traduit la réponse en décision d'écran.
 *
 * Aucun contrôle de session avant l'appel : c'est la tentative d'écriture qui
 * tranche (décision verrouillée #2 de WED-49). Le couple clique, l'action part,
 * et le status de la réponse dit s'il fallait être connecté.
 *
 * 200 et 201 sont deux succès — réépingler une photo déjà épinglée ou
 * recontacter un prestataire déjà contacté sont des no-op côté backend, pas des
 * erreurs à faire remonter à l'écran.
 *
 * Tout ce qui n'est ni un succès ni un 401/403 est une erreur métier : une photo
 * masquée dans Wedream ou un prestataire inactif remontent en 422, et se
 * connecter n'y changerait rien. Les mettre en file d'attente les ferait échouer
 * une seconde fois après connexion, pour rien.
 */
export async function submitCtaAction(action: CtaAction): Promise<CtaOutcome> {
  const response = await fetch(ENDPOINTS[action.kind], {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ portfolioImageId: action.portfolioImageId }),
  }).catch(() => null)

  return toOutcome(response)
}

/**
 * Retire un épinglé déjà enregistré côté backend (WED-183).
 *
 * L'identifiant de la photo est dans le chemin et non dans un corps : le DELETE
 * n'en a pas, et le couple reste celui du cookie, jamais un paramètre.
 *
 * Le 204 du backend passe par `response.ok` comme n'importe quel succès — même
 * lecture de la réponse que l'épinglage, jusqu'au 401/403 qui renvoie le couple
 * vers une connexion plutôt que vers un message d'erreur. Un dé-épinglage
 * idempotent (photo jamais épinglée, ou déjà retirée) répond 204 lui aussi :
 * l'écran n'a aucun cas particulier à traiter.
 */
export async function submitUnpinAction(portfolioImageId: string): Promise<CtaOutcome> {
  const response = await fetch(
    `${ENDPOINTS.pin}/${encodeURIComponent(portfolioImageId)}`,
    { method: 'DELETE' },
  ).catch(() => null)

  return toOutcome(response)
}

/**
 * La lecture de la réponse est identique pour les deux sens du geste : c'est le
 * même contrat de statuts côté Route Handler, et les faire diverger ferait
 * qu'un 403 signifierait « connecte-toi » en épinglant et « erreur » en
 * dé-épinglant.
 */
async function toOutcome(response: Response | null): Promise<CtaOutcome> {
  if (!response) return { status: 'error', message: FALLBACK_ERROR }
  if (response.ok) return { status: 'done' }
  if (response.status === 401 || response.status === 403) return { status: 'auth_required' }

  const data: { error?: string } | null = await response.json().catch(() => null)

  return { status: 'error', message: data?.error ?? FALLBACK_ERROR }
}
