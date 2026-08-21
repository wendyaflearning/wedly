import { expect, test } from '@playwright/test'
import { getCapturedRequests, resetMockApi } from './helpers/mock-api'

test.beforeEach(async ({ request }) => {
  await resetMockApi(request)
})

test('requires a service selection and submits the professions payload', async ({ page, request }) => {
  await page.goto('/onboarding/professions-token')
  await page.getByRole('button', { name: /je découvre mon profil/i }).click()
  await page.locator('span').filter({ hasText: 'Étape 1 — Professions' }).click()

  const confirmButton = page.getByRole('button', { name: /confirmer/i })
  await expect(page.getByRole('heading', { name: /Qu['’]est-ce que vous proposez/i })).toBeVisible()
  await expect(confirmButton).toBeDisabled()

  await page.getByRole('button', { name: 'Photographe' }).click()
  await expect(confirmButton).toBeEnabled()
  await confirmButton.click()

  await expect(page.getByText('Pour vous connecter aux bons couples')).toBeVisible()

  const requests = await getCapturedRequests(request)
  expect(requests).toEqual([
    expect.objectContaining({
      token: 'professions-token',
      body: {
        step: 'professions',
        data: { service_ids: ['service-photo'] },
      },
    }),
  ])
})
