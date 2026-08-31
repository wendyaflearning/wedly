import type { CtaAction, CtaKind } from './wedream-cta'

/**
 * La file des gestes posés sans compte, en attente d'une inscription (WED-160).
 *
 * Deux stockages, deux durées de vie, et surtout deux clés : le brouillon du
 * formulaire d'inscription reste en sessionStorage pour 30 minutes
 * (`couple-onboarding-store`), la file vit en localStorage pour 30 jours. Un
 * couple qui épingle une photo un soir doit retrouver son geste en revenant
 * créer son compte la semaine suivante, alors qu'un brouillon de formulaire
 * vieux d'une semaine n'a plus de sens.
 *
 * L'exception à la règle « pas de localStorage » de `AGENTS.md` est assumée et
 * documentée là-bas : rien de sensible ici, des ids de photo et un type de
 * geste, purgés à l'inscription (US8) ou à la connexion (US9).
 */
export const WEDREAM_PENDING_ACTIONS_KEY = 'wedly-wedream-pending-actions'

export const WEDREAM_PENDING_ACTIONS_TTL_MS = 30 * 24 * 60 * 60 * 1000

/**
 * Le modal ne s'ouvre qu'une fois par session, quel que soit le geste qui l'a
 * déclenché. Le drapeau est en sessionStorage et non en localStorage : refuser
 * la création de compte un jour ne doit pas priver le couple de la proposition
 * un mois plus tard.
 */
export const ACCOUNT_MODAL_SEEN_KEY = 'wedly-account-modal-seen'

/**
 * Une entrée par geste, pas un objet unique : un couple épingle plusieurs
 * photos et demande plusieurs mises en relation avant de s'inscrire, et US8 doit
 * pouvoir toutes les rejouer.
 */
export type PendingAction = {
  kind: CtaKind
  portfolioImageId: string
  /** Date d'écriture, en ms — c'est la lecture qui en déduit l'expiration. */
  timestamp: number
}

interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

/**
 * `window.localStorage` peut lever à l'accès même — Safari en navigation privée,
 * cookies tiers bloqués, quota plein. Aucun de ces cas ne doit casser le
 * parcours : on rend `null` et l'appelant continue sans file.
 */
export function browserStorage(kind: 'local' | 'session'): StorageLike | null {
  try {
    return kind === 'local' ? window.localStorage : window.sessionStorage
  } catch (error) {
    reportStorageFailure(`accès à ${kind}Storage`, error)
    return null
  }
}

/**
 * Un stockage refusé n'est jamais fatal ici, mais il reste anormal : sans trace,
 * un couple qui perd systématiquement sa file (Safari privé, quota plein, mode
 * kiosque) ne produirait aucun signal.
 *
 * TODO(observabilité front) : Sentry n'existe aujourd'hui que côté Symfony
 * (`sentry/sentry-symfony`, DSN injecté par deploy.yml) — pas de
 * `@sentry/nextjs`, pas d'`instrumentation.ts`, pas de DSN public. En attendant
 * ce câblage, la console est le seul canal disponible. Ce point de passage est
 * unique et volontairement centralisé : brancher Sentry se fera ici, en une
 * ligne, sans toucher aux appelants.
 */
function reportStorageFailure(operation: string, error: unknown): void {
  console.warn(`[wedream-pending-actions] ${operation} indisponible :`, error)
}

function isPendingAction(value: unknown): value is PendingAction {
  if (typeof value !== 'object' || value === null) return false

  const entry = value as Partial<PendingAction>

  return (
    (entry.kind === 'pin' || entry.kind === 'contact') &&
    typeof entry.portfolioImageId === 'string' &&
    entry.portfolioImageId !== '' &&
    typeof entry.timestamp === 'number' &&
    Number.isFinite(entry.timestamp)
  )
}

/**
 * La file telle qu'elle est vraiment utilisable : entrées expirées retirées,
 * entrées malformées ignorées.
 *
 * Le contenu est réécrit par l'utilisateur à volonté — c'est du localStorage —
 * donc chaque entrée est validée plutôt que castée. Une file entièrement
 * illisible est effacée : la garder ferait échouer la même lecture pendant 30
 * jours.
 */
export function loadPendingActions(
  storage: StorageLike,
  now = Date.now(),
): PendingAction[] {
  let stored: string | null = null

  try {
    stored = storage.getItem(WEDREAM_PENDING_ACTIONS_KEY)
  } catch (error) {
    reportStorageFailure('lecture de la file', error)
    return []
  }

  if (!stored) return []

  let parsed: unknown

  try {
    parsed = JSON.parse(stored)
  } catch {
    removePendingActions(storage)
    return []
  }

  if (!Array.isArray(parsed)) {
    removePendingActions(storage)
    return []
  }

  return parsed
    .filter(isPendingAction)
    .filter((entry) => now - entry.timestamp < WEDREAM_PENDING_ACTIONS_TTL_MS)
}

/**
 * Ajoute un geste à la file et rend la file telle qu'elle est désormais stockée.
 *
 * La purge se fait ici aussi, pas seulement à la lecture : sans elle, un couple
 * qui revient tous les mois verrait la file grossir indéfiniment sans que
 * personne ne la lise jamais entre deux visites.
 *
 * Deux clics « épingler » sur la même photo ne font qu'une entrée, avec le
 * timestamp rafraîchi : US8 rejouerait sinon deux POST strictement identiques,
 * idempotents côté backend mais inutiles.
 */
export function enqueuePendingAction(
  storage: StorageLike,
  action: CtaAction,
  now = Date.now(),
): PendingAction[] {
  const kept = loadPendingActions(storage, now).filter(
    (entry) => entry.kind !== action.kind || entry.portfolioImageId !== action.portfolioImageId,
  )

  const queue = [...kept, { ...action, timestamp: now }]

  try {
    storage.setItem(WEDREAM_PENDING_ACTIONS_KEY, JSON.stringify(queue))
  } catch (error) {
    // Quota plein ou stockage refusé : le geste est perdu, mais le couple garde
    // son modal et son parcours. Mieux vaut une file incomplète qu'un clic mort.
    reportStorageFailure('écriture de la file', error)
  }

  return queue
}

function removePendingActions(storage: StorageLike): void {
  try {
    storage.removeItem(WEDREAM_PENDING_ACTIONS_KEY)
  } catch (error) {
    // Rien à faire de plus : la lecture suivante retombera sur le même vide.
    reportStorageFailure('purge de la file', error)
  }
}

export function hasSeenAccountModal(storage: StorageLike): boolean {
  try {
    return storage.getItem(ACCOUNT_MODAL_SEEN_KEY) !== null
  } catch (error) {
    reportStorageFailure('lecture du drapeau modal', error)
    return false
  }
}

export function markAccountModalSeen(storage: StorageLike): void {
  try {
    storage.setItem(ACCOUNT_MODAL_SEEN_KEY, '1')
  } catch (error) {
    // Le drapeau en mémoire de l'écran prend le relais pour la page en cours.
    reportStorageFailure('écriture du drapeau modal', error)
  }
}
