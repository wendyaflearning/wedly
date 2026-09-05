import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  buildRegistrationPayload,
  credentialsError,
  EMAIL_ALREADY_USED,
  MIN_PASSWORD_LENGTH,
  registerCouple,
} from './couple-registration'
import { DEFAULT_BUDGET_CENTS, DEFAULT_GUEST_COUNT, GUEST_COUNT_MAX, MAX_BUDGET_CENTS } from './couple-onboarding-store'

const credentials = {
  email: 'camille@exemple.fr',
  password: 'secret-password',
  passwordConfirmation: 'secret-password',
  phone: '',
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

describe('phone number', () => {
  it('lets the couple through without one — the field is offered, never required', () => {
    expect(credentialsError({ ...credentials, phone: '' })).toBeNull()
    expect(buildRegistrationPayload(onboarding, { ...credentials, phone: '' }).phone).toBeNull()
  })

  it('accepts the way a French number is actually written', () => {
    for (const typed of ['0612345678', '06 12 34 56 78', '06.12.34.56.78', '+33612345678']) {
      expect(credentialsError({ ...credentials, phone: typed })).toBeNull()
    }
  })

  /** Le backend ne connaît pas les séparateurs : « 06 12 34 56 78 » sortirait en 422. */
  it('strips the separators before sending, without normalising to +33', () => {
    expect(buildRegistrationPayload(onboarding, { ...credentials, phone: '06 12 34 56 78' }).phone).toBe(
      '0612345678',
    )
    expect(buildRegistrationPayload(onboarding, { ...credentials, phone: '+33 6 12 34 56 78' }).phone).toBe(
      '+33612345678',
    )
  })

  it('names the phone rather than the whole form when the number is wrong', () => {
    for (const typed of ['0012345678', '061234567', '06123456789', 'pas-un-numero']) {
      expect(credentialsError({ ...credentials, phone: typed })).toContain('téléphone')
    }
  })
})

describe('registration payload', () => {
  it('carries everything collected since screen 1 in a single submission', () => {
    expect(buildRegistrationPayload(onboarding, credentials)).toEqual({
      email: 'camille@exemple.fr',
      phone: null,
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
      contactRequest: null,
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

  it('carries the contact request of a journey that started on one, vendor and crush photo', () => {
    const contactRequest = {
      vendorId: '0198f0a1-0000-7000-8000-000000000001',
      serviceLabel: 'photographe',
      portfolioImageId: '0198f0a1-0000-7000-8000-0000000000aa',
    }
    const payload = buildRegistrationPayload({ ...onboarding, contactRequest }, credentials)

    expect(payload.contactRequest).toEqual({
      vendorId: '0198f0a1-0000-7000-8000-000000000001',
      portfolioImageId: '0198f0a1-0000-7000-8000-0000000000aa',
    })
  })

  // A contact request can start somewhere without a photo; the card then shows
  // no visual rather than the server rejecting the whole registration.
  it('sends a null crush photo when the journey did not start on one', () => {
    const contactRequest = { vendorId: '0198f0a1-0000-7000-8000-000000000001', serviceLabel: 'photographe' }
    const payload = buildRegistrationPayload({ ...onboarding, contactRequest }, credentials)

    expect(payload.contactRequest).toEqual({
      vendorId: '0198f0a1-0000-7000-8000-000000000001',
      portfolioImageId: null,
    })
  })

  it('keeps the service label out of the payload', () => {
    const contactRequest = { vendorId: '0198f0a1-0000-7000-8000-000000000001', serviceLabel: 'photographe' }
    const payload = buildRegistrationPayload({ ...onboarding, contactRequest }, credentials)

    expect(JSON.stringify(payload)).not.toContain('photographe')
  })

  it('carries no contact request for a couple that came from a pin', () => {
    expect(buildRegistrationPayload(onboarding, credentials).contactRequest).toBeNull()
  })

  it('trims what the couple typed around the first name and the town', () => {
    const payload = buildRegistrationPayload({ ...onboarding, firstName: ' Camille ', location: ' Lyon ' }, credentials)

    expect(payload.firstName).toBe('Camille')
    expect(payload.location).toBe('Lyon')
  })
})

describe('remontée du refus d’inscription', () => {
  function mockFetch(status: number, body: unknown) {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: status < 400,
      status,
      json: async () => body,
    })
    vi.stubGlobal('fetch', fetchMock)
    return fetchMock
  }

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('remonte le code machine d’un email déjà utilisé', async () => {
    mockFetch(409, { error: 'Cet email est déjà utilisé.', code: EMAIL_ALREADY_USED })

    const result = await registerCouple(buildRegistrationPayload(onboarding, credentials))

    // C'est sur ce code, et pas sur le message, que le parcours bascule vers
    // l'écran « vous avez déjà un compte » (WED-162).
    expect(result).toEqual({
      success: false,
      error: 'Cet email est déjà utilisé.',
      code: EMAIL_ALREADY_USED,
    })
  })

  it('laisse le code absent sur les refus que l’API ne nomme pas', async () => {
    mockFetch(422, { error: 'Données invalides.' })

    const result = await registerCouple(buildRegistrationPayload(onboarding, credentials))

    expect(result.success).toBe(false)
    expect(result).toMatchObject({ error: 'Données invalides.' })
    expect((result as { code?: string }).code).toBeUndefined()
  })
})
