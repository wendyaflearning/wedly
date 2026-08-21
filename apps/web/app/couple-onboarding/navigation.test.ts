import { describe, expect, it } from 'vitest'
import { canContinue, getContinueAction, previousScreen } from './navigation'

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

  it('skips the sensitive screens but still asks the budget when consent is declined', () => {
    const declined = { ...data, sensitiveDataConsent: false }

    expect(getContinueAction(3, declined)).toEqual({ type: 'show_budget' })
  })

  it('continues through the sensitive preference screens after consent', () => {
    expect(getContinueAction(3, { ...data, sensitiveDataConsent: true })).toEqual({ type: 'show_confessions' })
    expect(getContinueAction(4, { ...data, sensitiveDataConsent: true })).toEqual({ type: 'show_cultures' })
    expect(getContinueAction(5, { ...data, sensitiveDataConsent: true })).toEqual({ type: 'show_budget' })
  })

  it('asks the budget on both paths, whatever brought the couple in', () => {
    const pinned = { ...data, sensitiveDataConsent: false }
    const fromContactRequest = { ...data, sensitiveDataConsent: false, contactRequest: { vendorId: '0196', serviceLabel: 'photographe' } }

    expect(getContinueAction(3, pinned)).toEqual({ type: 'show_budget' })
    expect(getContinueAction(3, fromContactRequest)).toEqual({ type: 'show_budget' })
  })

  it('hands the collected data over once the budget screen is behind', () => {
    const completed = { ...data, sensitiveDataConsent: true, exactBudgetCents: 2_350_000 }

    expect(getContinueAction(6, completed)).toEqual({ type: 'complete_onboarding', data: completed })
  })

  it('walks back from the budget screen to the screen the couple really came from', () => {
    expect(previousScreen(6, { ...data, sensitiveDataConsent: true })).toBe(5)
    expect(previousScreen(6, { ...data, sensitiveDataConsent: false })).toBe(3)
    expect(previousScreen(2, data)).toBe(1)
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
