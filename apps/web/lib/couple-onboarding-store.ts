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
 * Screen 1 leaves its pills unselected in the mockup, but `couple.planning_stage`
 * cannot be NULL: the flow opens on the first of the three, which is also the
 * answer a couple starting the journey would give.
 */
export const DEFAULT_PLANNING_STAGE: PlanningStage = 'just_started'

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
 * The budget screen holds what the couple types as a string while it types.
 * A half-typed entry — an empty field, a lone `-`, an unfinished `1e` — is not a
 * number yet, and clamping on every keystroke rewrote the field under the cursor:
 * typing `-500` snapped to `0` mid-entry, then the following digits landed on a
 * value the couple never meant. The entry only becomes cents when the field is
 * left or the couple moves on.
 *
 * At that point an entry that is empty or nonsensical — nothing typed, a lone
 * `-`, a negative or zero amount — drops the exact amount instead of storing it,
 * so the budget falls back to the bracket chosen on screen 2 (arbitrage Denis du
 * 23/08/2026). Keeping a `0 €` wedding would qualify nothing for a vendor, and
 * inventing a floor the couple never typed would be just as wrong.
 */
export function withExactBudget(data: CoupleOnboardingData, typed: string): CoupleOnboardingData {
  const euros = Number(typed.trim())

  if (typed.trim() === '' || !Number.isFinite(euros) || euros <= 0) {
    const withoutExactBudget = { ...data }
    delete withoutExactBudget.exactBudgetCents

    return withoutExactBudget
  }

  return { ...data, exactBudgetCents: clampBudgetCents(euros * 100) }
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
    // `User.firstName` is stored as typed today, surrounding spaces included,
    // while the screen-1 guard reads it trimmed: the two must agree.
    firstName: data.firstName?.trim(),
    // `couple.planning_stage` is NOT NULL without a default, and screen 1 lets
    // the couple move on with only a first name. The opening pill is preselected
    // the way both sliders are, so the screen always carries a real value — a
    // typing default, not a column default (COUPLE-ONBOARDING-002).
    planningStage: data.planningStage ?? DEFAULT_PLANNING_STAGE,
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
    // Bounded on both ends: sessionStorage is user-writable, and an amount past
    // the slider ceiling would reach `wedding.guest_count` untouched.
    guestCount: clampGuestCount(data.guestCount),
  }
}

export function clampGuestCount(guestCount: number | undefined): number {
  if (guestCount === undefined || !Number.isFinite(guestCount)) return DEFAULT_GUEST_COUNT

  return Math.min(Math.max(Math.round(guestCount), GUEST_COUNT_MIN), GUEST_COUNT_MAX)
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
