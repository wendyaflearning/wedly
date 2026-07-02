import { expect, test } from '@playwright/test'
import { getCapturedRequests, resetMockApi } from './helpers/mock-api'

test.beforeEach(async ({ request }) => {
  await resetMockApi(request)
})

test('accepting consent submits granted=true and continues to experiences', async ({ page, request }) => {
  await page.goto('/onboarding/consent-token')
  await page.getByRole('button', { name: /je découvre mon profil/i }).click()
  await page.locator('span').filter({ hasText: 'Étape 2 — Consentement' }).click()

  await page.getByRole('button', { name: /j['’]accepte et je continue/i }).click()

  await expect(page.getByRole('heading', { name: /Quels univers de mariage connaissez-vous bien/i })).toBeVisible()

  const requests = await getCapturedRequests(request)
  expect(requests[0]).toEqual(expect.objectContaining({
    token: 'consent-token',
    body: {
      step: 'consent',
      data: { granted: true },
    },
  }))
})

test('skipping consent submits granted=false and skips the sensitive experiences step', async ({ page, request }) => {
  await page.goto('/onboarding/consent-token')
  await page.getByRole('button', { name: /je découvre mon profil/i }).click()
  await page.locator('span').filter({ hasText: 'Étape 2 — Consentement' }).click()

  await page.getByRole('button', { name: /je préfère passer/i }).click()

  await expect(page.getByRole('heading', { name: /Où intervenez-vous et à quel budget/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: /Quels univers de mariage connaissez-vous bien/i })).toBeHidden()

  const requests = await getCapturedRequests(request)
  expect(requests[0]).toEqual(expect.objectContaining({
    token: 'consent-token',
    body: {
      step: 'consent',
      data: { granted: false },
    },
  }))
})

test('skipping consent keeps catering characteristics available for catering vendors', async ({ page, request }) => {
  await page.goto('/onboarding/catering-consent-token')
  await page.getByRole('button', { name: /je découvre mon profil/i }).click()
  await page.locator('span').filter({ hasText: 'Étape 2 — Consentement' }).click()

  await page.getByRole('button', { name: /je préfère passer/i }).click()

  await expect(page.getByRole('heading', { name: /Parlez-nous de votre offre/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: /Quels univers de mariage connaissez-vous bien/i })).toBeHidden()

  const requests = await getCapturedRequests(request)
  expect(requests[0]).toEqual(expect.objectContaining({
    token: 'catering-consent-token',
    body: {
      step: 'consent',
      data: { granted: false },
    },
  }))
})
