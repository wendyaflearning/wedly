import type { CoupleLeadStatus } from './couple-lead-status'

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
  | {
      status: 'done'
      /**
       * Vrai uniquement sur un 201, donc sur une ressource réellement née
       * (WED-195). Un 200 est un succès tout autant, mais un succès qui n'a rien
       * changé : recontacter un prestataire déjà en lead est absorbé côté
       * backend, et confirmer « votre demande est partie » sur ce cas-là fait
       * croire au couple qu'une seconde demande vient de partir.
       */
      created: boolean
      /**
       * Où en est la demande côté prestataire (WED-186). Absent partout ailleurs
       * que sur le POST de contact : l'épinglage n'a pas de statut à porter.
       *
       * Les deux champs répondent à deux questions différentes et se lisent
       * ensemble : `created` dit si *cette requête-ci* a fait naître quelque
       * chose, `leadStatus` dit ce que le prestataire en a fait. Un recontact
       * arrive donc en `created: false` avec un statut bien réel.
       */
      leadStatus?: CoupleLeadStatus
    }
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
 * erreurs à faire remonter à l'écran. Le corps du succès porte en plus, sur le
 * contact, le statut du lead déjà en base (WED-186) : c'est lui, et pas le code
 * HTTP, qui dit si le prestataire a répondu. Et `created` distingue quand même
 * les deux codes, pour l'appelant qui a une confirmation à afficher (WED-195).
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
 * Le seul cas où un dé-épinglage échoue sans être une panne : la session a
 * expiré depuis le chargement de la page. Le geste n'a pas eu lieu côté
 * serveur, et l'écran doit le montrer tel quel — cœur toujours rempli dans la
 * galerie, vignette toujours en place dans « Mon espace ».
 *
 * Vit ici, à côté de `submitUnpinAction`, parce que les deux écrans qui
 * dé-épinglent doivent dire la même chose : un libellé recopié divergerait à la
 * première reformulation.
 *
 * TODO(WED-183, à valider par UX-Wedly) : libellé écrit faute d'être couvert par
 * le prompt reçu. À reprendre si UX tranche autrement.
 */
export const UNPIN_SESSION_LOST =
  'Votre session a expiré. Reconnectez-vous pour retirer ce coup de cœur.'

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

  if (response.ok) {
    // Seul le POST de contact renvoie un statut de lead (WED-186) ; l'épinglage
    // et le 204 du dé-épinglage n'en ont pas, et `leadStatus` reste alors
    // absent — c'est ce qui fait que ces boutons gardent leur libellé générique.
    // L'optionnel sur `.json` court-circuite toute la chaîne : une réponse
    // simulée sans cette méthode ne doit pas transformer un succès en erreur.
    const body = await response.json?.().catch(() => null)

    // Le 204 du dé-épinglage passe ici comme les autres succès : rien n'y naît,
    // il est donc `created: false`, et aucun appelant ne lui demande de
    // confirmation.
    return { status: 'done', created: response.status === 201, leadStatus: body?.status }
  }

  if (response.status === 401 || response.status === 403) return { status: 'auth_required' }

  const data: { error?: string } | null = await response.json().catch(() => null)

  return { status: 'error', message: data?.error ?? FALLBACK_ERROR }
}
