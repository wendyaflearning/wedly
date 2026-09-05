import { expect, test } from '@playwright/test'
import { getCapturedRequests, resetMockApi } from './helpers/mock-api'
import {
  acceptConsent,
  completeCateringCharacteristics,
  completeCredentials,
  completeExperiences,
  completeLegalInfo,
  completeProfessions,
  completeVenueCharacteristics,
  completeZonesPricing,
  confirmPrefilledPortfolio,
  openOnboarding,
} from './helpers/onboarding-flow'

test.beforeEach(async ({ request }) => {
  await resetMockApi(request)
})

test('completes the freelance onboarding happy path', async ({ page, request }) => {
  await openOnboarding(page, 'full-flow-token')
  await completeProfessions(page)
  await acceptConsent(page)
  await completeExperiences(page)
  await completeZonesPricing(page)
  await confirmPrefilledPortfolio(page)
  await completeLegalInfo(page)
  await completeCredentials(page)

  const requests = await getCapturedRequests(request)
  expect(requests.map(item => item.body.step)).toEqual([
    'professions',
    'consent',
    'experiences',
    'zones_pricing',
    'legal_info',
    'credentials',
  ])
  expect(requests).toEqual([
    expect.objectContaining({
      body: { step: 'professions', data: { service_ids: ['service-photo'] } },
    }),
    expect.objectContaining({
      body: { step: 'consent', data: { granted: true } },
    }),
    expect.objectContaining({
      body: {
        step: 'experiences',
        data: {
          culture_ids: ['culture-france'],
          confession_ids: ['confession-laique'],
        },
      },
    }),
    expect.objectContaining({
      body: {
        step: 'zones_pricing',
        data: {
          zones: ['region-idf'],
          price_min: 120000,
          price_max: 250000,
          price_type: 'per_service',
        },
      },
    }),
    expect.objectContaining({
      body: {
        step: 'legal_info',
        data: {
          brand_name: 'Studio Lumiere',
          first_name: 'Marie',
          last_name: 'Durand',
          siret: '12345678901234',
          phone: '0612345678',
          address: '12 rue de la Paix',
          zipcode: '75001',
          city: 'Paris',
        },
      },
    }),
    expect.objectContaining({
      body: {
        step: 'credentials',
        data: {
          email: 'marie@example.test',
          password: 'Password!',
          password_confirmation: 'Password!',
        },
      },
    }),
  ])
})

test('completes the catering onboarding happy path', async ({ page, request }) => {
  await openOnboarding(page, 'catering-full-flow-token')
  await completeProfessions(page, 'Traiteur')
  await acceptConsent(page)
  await completeExperiences(page)
  await completeCateringCharacteristics(page)
  await completeZonesPricing(page)
  await confirmPrefilledPortfolio(page)
  await completeLegalInfo(page, 'Maison Saveurs')
  await completeCredentials(page, 'traiteur@example.test')

  const requests = await getCapturedRequests(request)
  expect(requests.map(item => item.body.step)).toEqual([
    'professions',
    'consent',
    'experiences',
    'catering_characteristics',
    'zones_pricing',
    'legal_info',
    'credentials',
  ])
})

test('completes the venue onboarding happy path', async ({ page, request }) => {
  await openOnboarding(page, 'venue-full-flow-token')
  await completeProfessions(page, 'Lieu de reception')
  await completeVenueCharacteristics(page)
  await completeZonesPricing(page, 'lieu')
  await confirmPrefilledPortfolio(page)
  await completeLegalInfo(page, 'Domaine Wedly')
  await completeCredentials(page, 'lieu@example.test')

  const requests = await getCapturedRequests(request)
  expect(requests.map(item => item.body.step)).toEqual([
    'professions',
    'venue_characteristics',
    'zones_pricing',
    'legal_info',
    'credentials',
  ])
})

test('completes the creator onboarding happy path', async ({ page, request }) => {
  await openOnboarding(page, 'creator-full-flow-token')
  await completeProfessions(page, 'Createur de robes')
  await acceptConsent(page)
  await completeExperiences(page)
  await completeZonesPricing(page, 'createurs')
  await confirmPrefilledPortfolio(page)
  await completeLegalInfo(page, 'Atelier Couture')
  await completeCredentials(page, 'createur@example.test')

  const requests = await getCapturedRequests(request)
  expect(requests.map(item => item.body.step)).toEqual([
    'professions',
    'consent',
    'experiences',
    'zones_pricing',
    'legal_info',
    'credentials',
  ])
})
