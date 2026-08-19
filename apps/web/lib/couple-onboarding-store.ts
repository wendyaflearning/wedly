export const COUPLE_ONBOARDING_STORAGE_KEY = 'wedly-couple-onboarding'
export const COUPLE_ONBOARDING_TTL_MS = 30 * 60 * 1000

export type PlanningStage = 'just_started' | 'in_progress' | 'almost_ready'

export interface CoupleOnboardingData {
  firstName?: string
  planningStage?: PlanningStage
  weddingDate?: string
  location?: string
  budgetCents?: number
  guestCount?: number
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
export const DEFAULT_BUDGET_INDEX = 2
export const DEFAULT_BUDGET_CENTS = BUDGET_RANGES[DEFAULT_BUDGET_INDEX].cents
export const GUEST_COUNT_MIN = 20
export const GUEST_COUNT_MAX = 300
export const GUEST_COUNT_STEP = 10
export const DEFAULT_GUEST_COUNT = 100

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

  return {
    ...data,
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
