import { describe, expect, it } from 'vitest'
import {
  BUDGET_RANGES,
  budgetIndexForCents,
  budgetRangeForCents,
  COUPLE_ONBOARDING_STORAGE_KEY,
  COUPLE_ONBOARDING_TTL_MS,
  DEFAULT_BUDGET_CENTS,
  DEFAULT_GUEST_COUNT,
  GUEST_COUNT_MIN,
  loadCoupleOnboarding,
  saveCoupleOnboarding,
  withSliderDefaults,
} from './couple-onboarding-store'

function createStorage() {
  const values = new Map<string, string>()
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  }
}

describe('couple onboarding store', () => {
  it('persists the planning stage and wedding profile for 30 minutes', () => {
    const storage = createStorage()
    const now = 1_000
    const data = { planningStage: 'in_progress' as const, location: 'Lyon', budgetCents: 2_500_000 }

    saveCoupleOnboarding(storage, data, now)

    expect(loadCoupleOnboarding(storage, now + COUPLE_ONBOARDING_TTL_MS - 1)).toEqual(data)
    expect(JSON.parse(storage.getItem(COUPLE_ONBOARDING_STORAGE_KEY) ?? '')).toMatchObject({
      expiresAt: now + COUPLE_ONBOARDING_TTL_MS,
    })
  })

  it('clears expired data instead of restoring a stale onboarding', () => {
    const storage = createStorage()
    saveCoupleOnboarding(storage, { planningStage: 'almost_ready' }, 1_000)

    expect(loadCoupleOnboarding(storage, 1_000 + COUPLE_ONBOARDING_TTL_MS)).toEqual({})
    expect(storage.getItem(COUPLE_ONBOARDING_STORAGE_KEY)).toBeNull()
  })

  it('maps each bracket to its integer-cent median', () => {
    expect(BUDGET_RANGES[2]).toEqual({ label: '20 000 – 30 000 €', cents: 2_500_000 })
    expect(BUDGET_RANGES[3]).toEqual({ label: '30 000 – 50 000 €', cents: 4_000_000 })
    expect(BUDGET_RANGES[4]).toEqual({ label: 'Plus de 50 000 €', cents: 5_500_000 })
  })

  it('exposes the slider mount values as usable data instead of an empty state', () => {
    expect(withSliderDefaults({ planningStage: 'just_started' })).toEqual({
      planningStage: 'just_started',
      budgetCents: DEFAULT_BUDGET_CENTS,
      guestCount: DEFAULT_GUEST_COUNT,
    })
  })

  it('opens both sliders where the design source opens them', () => {
    expect(DEFAULT_GUEST_COUNT).toBe(100)
    expect(GUEST_COUNT_MIN).toBe(20)
    expect(budgetRangeForCents(DEFAULT_BUDGET_CENTS)).toBe('20 000 – 30 000 €')
  })

  it('lists the five budget brackets of the design source', () => {
    expect(BUDGET_RANGES.map((range) => range.label)).toEqual([
      'Moins de 10 000 €',
      '10 000 – 20 000 €',
      '20 000 – 30 000 €',
      '30 000 – 50 000 €',
      'Plus de 50 000 €',
    ])
  })

  it('falls back to the opening bracket when a stored amount no longer exists', () => {
    expect(withSliderDefaults({ budgetCents: 3_500_000 }).budgetCents).toBe(DEFAULT_BUDGET_CENTS)
    expect(budgetRangeForCents(3_500_000)).toBe('20 000 – 30 000 €')
    expect(budgetIndexForCents(3_500_000)).toBe(2)
  })

  it('never overwrites slider values restored from a previous session', () => {
    expect(withSliderDefaults({ budgetCents: 4_000_000, guestCount: 120 })).toEqual({
      budgetCents: 4_000_000,
      guestCount: 120,
    })
  })

  it('normalizes a persisted guest count below the minimum', () => {
    expect(withSliderDefaults({ guestCount: 0 }).guestCount).toBe(GUEST_COUNT_MIN)
    expect(withSliderDefaults({ guestCount: 10 }).guestCount).toBe(GUEST_COUNT_MIN)
  })

  it('resolves the budget slider position and label from the stored cents', () => {
    expect(budgetIndexForCents(2_500_000)).toBe(2)
    expect(budgetRangeForCents(2_500_000)).toBe('20 000 – 30 000 €')
  })

  it('keeps every bracket reachable, including the cheapest one', () => {
    expect(budgetIndexForCents(DEFAULT_BUDGET_CENTS)).toBe(2)
    expect(budgetIndexForCents(750_000)).toBe(0)
    expect(budgetRangeForCents(750_000)).toBe('Moins de 10 000 €')
  })
})
