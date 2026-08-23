import { describe, expect, it } from 'vitest'
import { buildRegistrationPayload, credentialsError, MIN_PASSWORD_LENGTH } from './couple-registration'
import { DEFAULT_BUDGET_CENTS, DEFAULT_GUEST_COUNT, GUEST_COUNT_MAX, MAX_BUDGET_CENTS } from './couple-onboarding-store'

const credentials = {
  email: 'camille@exemple.fr',
  password: 'secret-password',
  passwordConfirmation: 'secret-password',
}

const onboarding = {
  firstName: 'Camille',
  planningStage: 'in_progress' as const,
  weddingDate: '2027-06-18',
  location: 'Lyon',
  budgetCents: 2_500_000,
  guestCount: 120,
}

describe('account credentials', () => {
  it('accepts a complete and coherent form', () => {
    expect(credentialsError(credentials)).toBeNull()
  })

  it('names the field that is not right yet rather than the whole form', () => {
    expect(credentialsError({ ...credentials, email: '  ' })).toContain('email')
    expect(credentialsError({ ...credentials, email: 'camille' })).toContain('email')
    expect(credentialsError({ ...credentials, password: 'court12', passwordConfirmation: 'court12' })).toContain(
      String(MIN_PASSWORD_LENGTH),
    )
    expect(credentialsError({ ...credentials, passwordConfirmation: 'autre' })).toContain('ne correspondent pas')
  })

  it('holds the same password floor as the reset-password action', () => {
    expect(MIN_PASSWORD_LENGTH).toBe(8)
  })
})

describe('registration payload', () => {
  it('carries everything collected since screen 1 in a single submission', () => {
    expect(buildRegistrationPayload(onboarding, credentials)).toEqual({
      email: 'camille@exemple.fr',
      password: 'secret-password',
      passwordConfirmation: 'secret-password',
      firstName: 'Camille',
      planningStage: 'in_progress',
      weddingDate: '2027-06-18',
      location: 'Lyon',
      budgetCents: 2_500_000,
      guestCount: 120,
      sensitiveDataConsent: false,
      confessionSlugs: [],
      cultureSlugs: [],
      vendorId: null,
    })
  })

  it('submits the exact amount when the couple typed one on screen 6', () => {
    const payload = buildRegistrationPayload({ ...onboarding, exactBudgetCents: 2_350_000 }, credentials)

    expect(payload.budgetCents).toBe(2_350_000)
  })

  it('falls back on the defaults for a state that never went through the sliders', () => {
    const payload = buildRegistrationPayload({ firstName: 'Camille' }, credentials)

    expect(payload.budgetCents).toBe(DEFAULT_BUDGET_CENTS)
    expect(payload.guestCount).toBe(DEFAULT_GUEST_COUNT)
    expect(payload.planningStage).toBe('just_started')
  })

  it('re-bounds what a rewritten sessionStorage could have carried', () => {
    const payload = buildRegistrationPayload(
      { ...onboarding, exactBudgetCents: 9e12, guestCount: 1e20 },
      credentials,
    )

    expect(payload.budgetCents).toBe(MAX_BUDGET_CENTS)
    expect(payload.guestCount).toBe(GUEST_COUNT_MAX)
  })

  it('sends no sensitive preference when the couple refused the step', () => {
    const payload = buildRegistrationPayload(
      { ...onboarding, sensitiveDataConsent: false, confessionSlugs: ['catholique'], cultureSlugs: ['europe'] },
      credentials,
    )

    expect(payload.sensitiveDataConsent).toBe(false)
    expect(payload.confessionSlugs).toEqual([])
    expect(payload.cultureSlugs).toEqual([])
  })

  it('sends the selections once the couple consented to them', () => {
    const payload = buildRegistrationPayload(
      { ...onboarding, sensitiveDataConsent: true, confessionSlugs: ['catholique'], cultureSlugs: ['europe'] },
      credentials,
    )

    expect(payload.confessionSlugs).toEqual(['catholique'])
    expect(payload.cultureSlugs).toEqual(['europe'])
  })

  it('carries the vendor of a journey started on a contact request, and only its id', () => {
    const payload = buildRegistrationPayload(
      { ...onboarding, contactRequest: { vendorId: '0198f0a1-0000-7000-8000-000000000001', serviceLabel: 'photographe' } },
      credentials,
    )

    expect(payload.vendorId).toBe('0198f0a1-0000-7000-8000-000000000001')
    expect(payload).not.toHaveProperty('serviceLabel')
  })

  it('trims what the couple typed around the first name and the town', () => {
    const payload = buildRegistrationPayload({ ...onboarding, firstName: ' Camille ', location: ' Lyon ' }, credentials)

    expect(payload.firstName).toBe('Camille')
    expect(payload.location).toBe('Lyon')
  })
})
