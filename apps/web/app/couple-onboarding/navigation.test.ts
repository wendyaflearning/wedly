import { describe, expect, it } from 'vitest'
import { getContinueAction } from './navigation'

describe('couple onboarding navigation', () => {
  const data = {
    planningStage: 'in_progress' as const,
    weddingDate: '2027-06-18',
    location: 'Lyon',
    budgetCents: 2_500_000,
    guestCount: 120,
  }

  it('moves from screen 1 to the wedding profile screen', () => {
    expect(getContinueAction(1, data)).toEqual({ type: 'show_wedding_profile' })
  })

  it('completes Stage A from screen 2 with the collected client data', () => {
    expect(getContinueAction(2, data)).toEqual({ type: 'complete_stage_a', data })
  })
})
