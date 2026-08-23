import { describe, expect, it } from 'vitest'
import {
  applySensitiveDataConsent,
  BUDGET_RANGES,
  clampBudgetCents,
  MAX_BUDGET_CENTS,
  weddingBudgetCents,
  withExactBudget,
  budgetIndexForCents,
  budgetRangeForCents,
  COUPLE_ONBOARDING_STORAGE_KEY,
  COUPLE_ONBOARDING_TTL_MS,
  DEFAULT_BUDGET_CENTS,
  DEFAULT_GUEST_COUNT,
  DEFAULT_PLANNING_STAGE,
  GUEST_COUNT_MAX,
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
    expect(withSliderDefaults({ planningStage: 'just_started' })).toMatchObject({
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
    expect(withSliderDefaults({ budgetCents: 4_000_000, guestCount: 120 })).toMatchObject({
      budgetCents: 4_000_000,
      guestCount: 120,
    })
  })

  it('normalizes a persisted guest count below the minimum', () => {
    expect(withSliderDefaults({ guestCount: 0 }).guestCount).toBe(GUEST_COUNT_MIN)
    expect(withSliderDefaults({ guestCount: 10 }).guestCount).toBe(GUEST_COUNT_MIN)
  })

  it('normalizes a guest count a rewritten storage pushed past the slider ceiling', () => {
    // `wedding.guest_count` is an integer column: an amount like 1e20 travelled
    // through untouched before the bound was closed on both ends.
    expect(withSliderDefaults({ guestCount: 1e20 }).guestCount).toBe(GUEST_COUNT_MAX)
    expect(withSliderDefaults({ guestCount: Number.NaN }).guestCount).toBe(DEFAULT_GUEST_COUNT)
    expect(withSliderDefaults({ guestCount: 137.4 }).guestCount).toBe(137)
  })

  it('preselects the opening planning stage, which the NOT NULL column has no default for', () => {
    expect(withSliderDefaults({}).planningStage).toBe(DEFAULT_PLANNING_STAGE)
    expect(DEFAULT_PLANNING_STAGE).toBe('just_started')
  })

  it('keeps the stage the couple actually picked', () => {
    expect(withSliderDefaults({ planningStage: 'almost_ready' }).planningStage).toBe('almost_ready')
  })

  it('stores the first name trimmed, the way the screen-1 guard reads it', () => {
    expect(withSliderDefaults({ firstName: '  Camille  ' }).firstName).toBe('Camille')
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

describe('sensitive-preference consent', () => {
  const withSelections = {
    firstName: 'Camille',
    budgetCents: DEFAULT_BUDGET_CENTS,
    guestCount: DEFAULT_GUEST_COUNT,
    confessionSlugs: ['catholique', 'mixte'],
    cultureSlugs: ['europe', 'maghreb'],
  }

  it('records the consent and keeps the selections when it is granted', () => {
    expect(applySensitiveDataConsent(withSelections, true)).toMatchObject({
      sensitiveDataConsent: true,
      confessionSlugs: ['catholique', 'mixte'],
      cultureSlugs: ['europe', 'maghreb'],
    })
  })

  it('stores nothing sensitive when the couple skips the step', () => {
    expect(applySensitiveDataConsent({ firstName: 'Camille' }, false)).toMatchObject({
      sensitiveDataConsent: false,
      confessionSlugs: [],
      cultureSlugs: [],
    })
  })

  it('erases preferences already entered when consent is refused afterwards', () => {
    expect(applySensitiveDataConsent(withSelections, false)).toMatchObject({
      sensitiveDataConsent: false,
      confessionSlugs: [],
      cultureSlugs: [],
    })
  })

  it('leaves the wedding profile untouched when the step is skipped', () => {
    const refused = applySensitiveDataConsent({ ...withSelections, location: 'Lyon' }, false)

    expect(refused).toMatchObject({ firstName: 'Camille', location: 'Lyon', guestCount: DEFAULT_GUEST_COUNT })
  })

  it('never mutates the data it is given', () => {
    const source = { ...withSelections }
    applySensitiveDataConsent(source, false)

    expect(source.confessionSlugs).toEqual(['catholique', 'mixte'])
    expect(source.cultureSlugs).toEqual(['europe', 'maghreb'])
  })
})

describe('wedding budget', () => {
  it('keeps the bracket until the couple types an exact amount', () => {
    expect(weddingBudgetCents({ budgetCents: 2_500_000 })).toBe(2_500_000)
    expect(weddingBudgetCents({ budgetCents: 2_500_000, exactBudgetCents: 2_350_000 })).toBe(2_350_000)
  })

  it('falls back to the opening bracket when nothing was ever chosen', () => {
    expect(weddingBudgetCents({})).toBe(DEFAULT_BUDGET_CENTS)
  })

  it('refuses an amount the integer column could not store', () => {
    expect(clampBudgetCents(MAX_BUDGET_CENTS + 1)).toBe(MAX_BUDGET_CENTS)
    expect(clampBudgetCents(999_999_999_900)).toBe(MAX_BUDGET_CENTS)
  })

  it('accepts any amount to the euro, without imposing a step', () => {
    expect(clampBudgetCents(2_350_100)).toBe(2_350_100)
    expect(clampBudgetCents(0)).toBe(0)
  })

  it('never returns a negative amount or NaN', () => {
    expect(clampBudgetCents(-1)).toBe(0)
    expect(clampBudgetCents(Number.NaN)).toBe(DEFAULT_BUDGET_CENTS)
  })

  it('re-bounds the exact amount restored from the storage the couple can edit', () => {
    expect(withSliderDefaults({ exactBudgetCents: 999_999_999_900 })).toMatchObject({ exactBudgetCents: MAX_BUDGET_CENTS })
    expect(withSliderDefaults({ exactBudgetCents: 2_350_000 })).toMatchObject({ exactBudgetCents: 2_350_000 })
  })

  it('leaves the exact amount unset for a couple that never opened the budget screen', () => {
    expect(withSliderDefaults({ firstName: 'Camille' }).exactBudgetCents).toBeUndefined()
  })

  it('keeps the exact amount through a consent refusal', () => {
    expect(applySensitiveDataConsent({ exactBudgetCents: 2_350_000 }, false)).toMatchObject({ exactBudgetCents: 2_350_000 })
  })
})

describe('budget typed on the last screen', () => {
  const started = { budgetCents: 2_500_000, exactBudgetCents: 2_350_000 }

  it('turns a finished entry into cents', () => {
    expect(withExactBudget(started, '18500')).toMatchObject({ exactBudgetCents: 1_850_000 })
    expect(withExactBudget(started, ' 18500 ')).toMatchObject({ exactBudgetCents: 1_850_000 })
  })

  it('falls back to the screen-2 bracket when the field is left empty or unreadable', () => {
    // Arbitrage Denis, 23/08/2026: an entry that is not an amount returns the
    // budget to the bracket the couple did choose, rather than keeping a figure
    // it just erased.
    expect(withExactBudget(started, '').exactBudgetCents).toBeUndefined()
    expect(withExactBudget(started, '   ').exactBudgetCents).toBeUndefined()
    expect(withExactBudget(started, '-').exactBudgetCents).toBeUndefined()
    expect(withExactBudget(started, '1e').exactBudgetCents).toBeUndefined()
    expect(weddingBudgetCents(withExactBudget(started, ''))).toBe(2_500_000)
  })

  it('falls back to the screen-2 bracket rather than qualifying a wedding at 0 €', () => {
    expect(weddingBudgetCents(withExactBudget(started, '0'))).toBe(2_500_000)
    expect(weddingBudgetCents(withExactBudget(started, '-500'))).toBe(2_500_000)
  })

  it('brings a finished entry back under the ceiling instead of mid-keystroke', () => {
    expect(withExactBudget(started, '99999999')).toMatchObject({ exactBudgetCents: MAX_BUDGET_CENTS })
  })

  it('rounds to the cent rather than carrying a float error', () => {
    expect(withExactBudget(started, '2350.07')).toMatchObject({ exactBudgetCents: 235_007 })
  })

  it('never mutates the data it is given', () => {
    const source = { ...started }
    withExactBudget(source, '18500')

    expect(source.exactBudgetCents).toBe(2_350_000)
  })
})
