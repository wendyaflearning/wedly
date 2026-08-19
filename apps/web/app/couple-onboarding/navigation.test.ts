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

  it('moves from the wedding profile to sensitive-data consent', () => {
    expect(getContinueAction(2, data)).toEqual({ type: 'show_sensitive_data_consent' })
  })

  it('skips sensitive preferences when consent is declined', () => {
    expect(getContinueAction(3, { ...data, sensitiveDataConsent: false })).toEqual({ type: 'show_provider_budget' })
  })

  it('continues through the sensitive preference screens after consent', () => {
    expect(getContinueAction(3, { ...data, sensitiveDataConsent: true })).toEqual({ type: 'show_confessions' })
    expect(getContinueAction(4, { ...data, sensitiveDataConsent: true })).toEqual({ type: 'show_cultures' })
    expect(getContinueAction(5, { ...data, sensitiveDataConsent: true })).toEqual({ type: 'show_provider_budget' })
    expect(getContinueAction(6, { ...data, sensitiveDataConsent: true })).toEqual({ type: 'complete_onboarding', data: { ...data, sensitiveDataConsent: true } })
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
