import { expect, test } from '@playwright/test'
import { getCapturedRequests, resetMockApi } from './helpers/mock-api'

test.beforeEach(async ({ request }) => {
  await resetMockApi(request)
})

test('requires culture and confession selections before submitting experiences', async ({ page, request }) => {
  await page.goto('/onboarding/experiences-token')
  await page.getByRole('button', { name: /je découvre mon profil/i }).click()
  await page.locator('span').filter({ hasText: 'Étape 3 — Experiences' }).click()

  const continueButton = page.getByRole('button', { name: /continuer/i })
  await expect(page.getByRole('heading', { name: /Quels univers de mariage connaissez-vous bien/i })).toBeVisible()
  await expect(continueButton).toBeDisabled()

  await page.getByRole('button', { name: 'France' }).click()
  await expect(continueButton).toBeEnabled()
  await continueButton.click()

  const confirmButton = page.getByRole('button', { name: /confirmer/i })
  await expect(page.getByRole('heading', { name: /Quels types de cérémonies religieuses/i })).toBeVisible()
  await expect(confirmButton).toBeDisabled()

  await page.getByRole('button', { name: 'Laique' }).click()
  await expect(confirmButton).toBeEnabled()
  await confirmButton.click()

  await expect(page.getByRole('heading', { name: /Où intervenez-vous et à quel budget/i })).toBeVisible()

  const requests = await getCapturedRequests(request)
  expect(requests[0]).toEqual(expect.objectContaining({
    token: 'experiences-token',
    body: {
      step: 'experiences',
      data: {
        culture_ids: ['culture-france'],
        confession_ids: ['confession-laique'],
      },
    },
  }))
})
