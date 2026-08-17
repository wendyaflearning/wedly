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

export const BUDGET_RANGES = [
  { label: 'Moins de 10 000 €', cents: 750_000 },
  { label: '10 000 – 20 000 €', cents: 1_500_000 },
  { label: '20 000 – 30 000 €', cents: 2_500_000 },
  { label: '30 000 – 40 000 €', cents: 3_500_000 },
  { label: 'Plus de 40 000 €', cents: 4_500_000 },
] as const

/**
 * A range input always sits on a real graduation from its first render, so the
 * screen exposes that graduation as the current value instead of an empty state
 * the control cannot actually represent.
 */
export const DEFAULT_BUDGET_CENTS = BUDGET_RANGES[0].cents
export const GUEST_COUNT_MIN = 0
export const GUEST_COUNT_MAX = 300
export const GUEST_COUNT_STEP = 10
export const DEFAULT_GUEST_COUNT = 10

export function budgetRangeForCents(budgetCents: number): string {
  return BUDGET_RANGES.find((range) => range.cents === budgetCents)?.label ?? BUDGET_RANGES[0].label
}

export function budgetIndexForCents(budgetCents: number): number {
  const index = BUDGET_RANGES.findIndex((range) => range.cents === budgetCents)

  return index === -1 ? 0 : index
}

/**
 * Both sliders must carry a usable value even when the couple never drags them,
 * without overwriting a value restored from a previous session.
 */
export function withSliderDefaults(data: CoupleOnboardingData): CoupleOnboardingData {
  return {
    ...data,
    budgetCents: data.budgetCents ?? DEFAULT_BUDGET_CENTS,
    guestCount: data.guestCount ?? DEFAULT_GUEST_COUNT,
  }
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
