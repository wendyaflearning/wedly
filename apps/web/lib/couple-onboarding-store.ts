export const COUPLE_ONBOARDING_STORAGE_KEY = 'wedly-couple-onboarding'
export const COUPLE_ONBOARDING_TTL_MS = 30 * 60 * 1000

export type PlanningStage = 'just_started' | 'in_progress' | 'almost_ready'

/**
 * WED-49 stores this context when the journey started on “Je veux entrer en
 * contact” rather than on a pin. It travels with the onboarding state up to the
 * final atomic submission, which is the only place a `ProviderLead` is created
 * (Stage D / WED-109). A pin never stores it, so it never creates a lead — but
 * it does not change the screens: the budget question is asked either way.
 */
export interface ProviderContactRequest {
  vendorId: string
  serviceLabel: string
}

export interface CoupleOnboardingData {
  firstName?: string
  planningStage?: PlanningStage
  weddingDate?: string
  location?: string
  budgetCents?: number
  guestCount?: number
  sensitiveDataConsent?: boolean
  confessionSlugs?: string[]
  cultureSlugs?: string[]
  contactRequest?: ProviderContactRequest
  exactBudgetCents?: number
}

interface PersistedOnboardingData {
  expiresAt: number
  data: CoupleOnboardingData
}

interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

/**
 * Brackets and their order come from the Claude Design source, which is the
 * reference for this flow. Each one is stored as its integer-cent median, and
 * the two open-ended brackets keep the established 5 000 € offset.
 */
export const BUDGET_RANGES = [
  { label: 'Moins de 10 000 €', cents: 750_000 },
  { label: '10 000 – 20 000 €', cents: 1_500_000 },
  { label: '20 000 – 30 000 €', cents: 2_500_000 },
  { label: '30 000 – 50 000 €', cents: 4_000_000 },
  { label: 'Plus de 50 000 €', cents: 5_500_000 },
] as const

/**
 * A range input always sits on a real graduation from its first render, so the
 * screen exposes that graduation as the current value instead of an empty state
 * the control cannot actually represent. Both starting points are the ones the
 * design source opens on.
 */
/**
 * The last screen refines the bracket into an exact amount, so the two live side
 * by side: `budgetCents` is the bracket the slider can represent, and
 * `exactBudgetCents` the figure the couple actually typed. Writing the exact
 * figure back into `budgetCents` would send the slider back to its default the
 * moment the couple walks back to screen 2, since a free amount is never one of
 * the five graduations.
 */
export const DEFAULT_BUDGET_INDEX = 2
export const DEFAULT_BUDGET_CENTS = BUDGET_RANGES[DEFAULT_BUDGET_INDEX].cents
export const GUEST_COUNT_MIN = 20
export const GUEST_COUNT_MAX = 300
export const GUEST_COUNT_STEP = 10
export const DEFAULT_GUEST_COUNT = 100

/**
 * `budget_cents` is a PostgreSQL `integer` on both `wedding` and `provider_lead`,
 * so an amount past its ceiling would fail at insert instead of being refused.
 * The bound mirrors `ProviderLead::MAX_BUDGET_CENTS`; the backend re-applies it,
 * because this value is held in user-writable sessionStorage until submission.
 */
export const MAX_BUDGET_CENTS = 100_000_000

export function clampBudgetCents(budgetCents: number): number {
  if (!Number.isFinite(budgetCents)) return DEFAULT_BUDGET_CENTS

  return Math.min(Math.max(Math.round(budgetCents), 0), MAX_BUDGET_CENTS)
}

/**
 * The single budget carried to `Wedding.budgetCents` and to the lead: the exact
 * amount when the couple typed one, the bracket median otherwise.
 */
export function weddingBudgetCents(data: CoupleOnboardingData): number {
  return data.exactBudgetCents ?? data.budgetCents ?? DEFAULT_BUDGET_CENTS
}

export function budgetRangeForCents(budgetCents: number): string {
  return BUDGET_RANGES.find((range) => range.cents === budgetCents)?.label ?? BUDGET_RANGES[DEFAULT_BUDGET_INDEX].label
}

export function budgetIndexForCents(budgetCents: number): number {
  const index = BUDGET_RANGES.findIndex((range) => range.cents === budgetCents)

  return index === -1 ? DEFAULT_BUDGET_INDEX : index
}

/**
 * Both sliders must carry a usable value even when the couple never drags them,
 * while restoring older values only when they remain valid for the control.
 */
export function withSliderDefaults(data: CoupleOnboardingData): CoupleOnboardingData {
  const restoredBudget = data.budgetCents
  const restoredExactBudget = data.exactBudgetCents

  return {
    ...data,
    // Restored from storage the couple can edit, so it is re-bounded here rather
    // than trusted from the value that was written when the screen was left.
    exactBudgetCents: restoredExactBudget === undefined
      ? undefined
      : clampBudgetCents(restoredExactBudget),
    // A bracket removed since the session started must not silently land on the
    // cheapest one, so an unknown amount falls back to the opening bracket.
    budgetCents: restoredBudget !== undefined && isKnownBudget(restoredBudget)
      ? restoredBudget
      : DEFAULT_BUDGET_CENTS,
    guestCount: Math.max(data.guestCount ?? DEFAULT_GUEST_COUNT, GUEST_COUNT_MIN),
  }
}

function isKnownBudget(budgetCents: number): boolean {
  return BUDGET_RANGES.some((range) => range.cents === budgetCents)
}

/**
 * Refusing the sensitive-preference step must leave nothing behind: a couple can
 * pick confessions or cultures, walk back to the consent screen and change its
 * mind, and the selections made before that refusal have to go with it (WED-107).
 */
export function applySensitiveDataConsent(
  data: CoupleOnboardingData,
  granted: boolean,
): CoupleOnboardingData {
  const next = withSliderDefaults(data)

  return granted
    ? { ...next, sensitiveDataConsent: true }
    : { ...next, sensitiveDataConsent: false, confessionSlugs: [], cultureSlugs: [] }
}

export function loadCoupleOnboarding(
  storage: StorageLike,
  now = Date.now(),
): CoupleOnboardingData {
  const stored = storage.getItem(COUPLE_ONBOARDING_STORAGE_KEY)
  if (!stored) return {}

  try {
    const parsed = JSON.parse(stored) as PersistedOnboardingData
    if (!parsed.data || typeof parsed.expiresAt !== 'number' || parsed.expiresAt <= now) {
      storage.removeItem(COUPLE_ONBOARDING_STORAGE_KEY)
      return {}
    }

    return parsed.data
  } catch {
    storage.removeItem(COUPLE_ONBOARDING_STORAGE_KEY)
    return {}
  }
}

export function saveCoupleOnboarding(
  storage: StorageLike,
  data: CoupleOnboardingData,
  now = Date.now(),
): void {
  storage.setItem(
    COUPLE_ONBOARDING_STORAGE_KEY,
    JSON.stringify({ data, expiresAt: now + COUPLE_ONBOARDING_TTL_MS }),
  )
}
