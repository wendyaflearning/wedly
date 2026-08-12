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

export function budgetRangeForCents(budgetCents?: number): string | undefined {
  if (!budgetCents) return undefined

  return BUDGET_RANGES.find((range) => range.cents === budgetCents)?.label
}

export const BUDGET_RANGES = [
  { label: 'Moins de 10 000 €', cents: 750_000 },
  { label: '10 000 – 20 000 €', cents: 1_500_000 },
  { label: '20 000 – 30 000 €', cents: 2_500_000 },
  { label: '30 000 – 40 000 €', cents: 3_500_000 },
  { label: 'Plus de 40 000 €', cents: 4_500_000 },
] as const

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
