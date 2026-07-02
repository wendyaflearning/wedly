import { expect, test } from '@playwright/test'
import { getCapturedRequests, resetMockApi } from './helpers/mock-api'

test.beforeEach(async ({ request }) => {
  await resetMockApi(request)
})

test('completes the freelance onboarding happy path', async ({ page, request }) => {
  await page.goto('/onboarding/full-flow-token')
  await page.getByRole('button', { name: /je découvre mon profil/i }).click()

  await page.locator('span').filter({ hasText: 'Étape 1 — Professions' }).click()
  await page.getByRole('button', { name: 'Photographe' }).click()
  await page.getByRole('button', { name: /confirmer/i }).click()

  await expect(page.getByText('Pour vous connecter aux bons couples')).toBeVisible()
  await page.getByRole('button', { name: /j['’]accepte et je continue/i }).click()

  await expect(page.getByRole('heading', { name: /Quels univers de mariage connaissez-vous bien/i })).toBeVisible()
  await page.getByRole('button', { name: 'France' }).click()
  await page.getByRole('button', { name: /continuer/i }).click()
  await page.getByRole('button', { name: 'Laique' }).click()
  await page.getByRole('button', { name: /confirmer/i }).click()

  await expect(page.getByRole('heading', { name: /Où intervenez-vous et à quel budget/i })).toBeVisible()
  await page.getByRole('button', { name: /sélectionner vos régions/i }).click()
  await page.getByRole('button', { name: 'Ile-de-France' }).click()
  await page.locator('input[type="number"]').nth(0).fill('1200')
  await page.locator('input[type="number"]').nth(1).fill('2500')
  await page.locator('select').selectOption('per_service')
  await page.getByRole('button', { name: /confirmer/i }).click()

  await expect(page.getByRole('heading', { name: /Votre identité, en toute confiance/i })).toBeVisible()
  await page.getByPlaceholder('Ex : Atelier Lumière, Studio Mariage…').fill('Studio Lumiere')
  await page.getByPlaceholder('Marie').fill('Marie')
  await page.getByPlaceholder('Dupont').fill('Durand')
  await page.getByPlaceholder('+33 6 00 00 00 00').fill('0612345678')
  await page.getByPlaceholder('12 rue de la Paix').fill('12 rue de la Paix')
  await page.getByPlaceholder('75001').fill('75001')
  await page.getByPlaceholder('Paris').fill('Paris')
  await page.getByPlaceholder('000 000 000 00000').fill('12345678901234')
  await page.getByRole('button', { name: /confirmer/i }).click()

  await expect(page.getByRole('heading', { name: /Votre espace vous attend/i })).toBeVisible()
  await page.getByPlaceholder('votre@email.com').fill('marie@example.test')
  await page.getByPlaceholder('8 caractères minimum').fill('Password!')
  await page.getByPlaceholder('Répétez votre mot de passe').fill('Password!')
  await page.getByRole('button', { name: /créer mon profil/i }).click()

  await expect(page.getByRole('heading', { name: /Votre profil est en cours de validation/i })).toBeVisible()

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
