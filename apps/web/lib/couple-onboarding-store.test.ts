import { describe, expect, it } from 'vitest'
import {
  BUDGET_RANGES,
  COUPLE_ONBOARDING_STORAGE_KEY,
  COUPLE_ONBOARDING_TTL_MS,
  loadCoupleOnboarding,
  saveCoupleOnboarding,
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

  it('maps the 20 000–30 000 € range to its integer-cent median', () => {
    expect(BUDGET_RANGES[2]).toEqual({ label: '20 000 – 30 000 €', cents: 2_500_000 })
  })
})
