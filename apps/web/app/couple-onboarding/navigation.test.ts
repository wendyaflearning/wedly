import { describe, expect, it } from 'vitest'
import { canContinue, getContinueAction } from './navigation'

describe('couple onboarding navigation', () => {
  const data = {
    firstName: 'Camille',
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

  it('keeps screen 1 blocked until a first name is typed', () => {
    expect(canContinue(1, {})).toBe(false)
    expect(canContinue(1, { firstName: '   ' })).toBe(false)
    expect(canContinue(1, { firstName: 'Camille' })).toBe(true)
  })

  it('never blocks screen 2, whose fields must all stay optional', () => {
    expect(canContinue(2, {})).toBe(true)
  })
})
