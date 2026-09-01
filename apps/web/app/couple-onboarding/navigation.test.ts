import { describe, expect, it } from 'vitest'
import { COUPLE_ONBOARDING_STEPS, canContinue, getContinueAction, previousScreen } from './navigation'

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

  it('leads to the account creation once the budget screen is behind', () => {
    const completed = { ...data, sensitiveDataConsent: true, exactBudgetCents: 2_350_000 }

    expect(getContinueAction(6, completed)).toEqual({ type: 'show_account_creation' })
  })

  it('hands the collected data over from the account creation screen', () => {
    const completed = { ...data, sensitiveDataConsent: true, exactBudgetCents: 2_350_000 }

    expect(getContinueAction(7, completed)).toEqual({ type: 'complete_onboarding', data: completed })
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

  it('keeps screen 2 blocked until the wedding date and the town are given', () => {
    // Both back NOT NULL columns, and screen 7 is the only write of the journey:
    // a value missing here would only fail at the very last screen.
    expect(canContinue(2, {})).toBe(false)
    expect(canContinue(2, { weddingDate: '2027-06-18' })).toBe(false)
    expect(canContinue(2, { location: 'Lyon' })).toBe(false)
    expect(canContinue(2, { weddingDate: '2027-06-18', location: '   ' })).toBe(false)
    expect(canContinue(2, { weddingDate: '2027-06-18', location: 'Lyon' })).toBe(true)
  })

  it('never blocks on the two sliders of screen 2, which always carry a value', () => {
    expect(canContinue(2, { weddingDate: '2027-06-18', location: 'Lyon' })).toBe(true)
  })

  it('leaves the sensitive-preference and budget screens unblocked', () => {
    expect(canContinue(3, {})).toBe(true)
    expect(canContinue(4, {})).toBe(true)
    expect(canContinue(5, {})).toBe(true)
    expect(canContinue(6, {})).toBe(true)
  })

  it('never walks back out of the welcome screen, whose account already exists', () => {
    expect(previousScreen(8, data)).toBe(8)
    expect(previousScreen(7, data)).toBe(6)
  })

  it('never walks back out of the already-registered screen either', () => {
    // Sans garde, l'arithmétique de previousScreen renverrait 9 sur 8 : l'écran
    // « votre compte est prêt », pour un compte qui n'a jamais été créé (WED-162).
    expect(previousScreen(9, data)).toBe(9)
  })

  it('counts the seven steps the couple fills in, both exit screens aside', () => {
    expect(COUPLE_ONBOARDING_STEPS).toBe(7)
  })
})
