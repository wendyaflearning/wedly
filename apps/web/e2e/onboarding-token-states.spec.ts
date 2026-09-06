import { expect, test } from '@playwright/test'
import { resetMockApi } from './helpers/mock-api'

test.beforeEach(async ({ request }) => {
  await resetMockApi(request)
})

test('valid token shows welcome screen and overview', async ({ page }) => {
  await page.goto('/onboarding/professions-token')

  await expect(page.getByRole('heading', { name: /Marie, votre profil vous attend/i })).toBeVisible()
  await page.getByRole('button', { name: /je découvre mon profil/i }).click()

  await expect(page.locator('span').filter({ hasText: 'Étape 1 — Professions' })).toBeVisible()
  await expect(page.locator('span').filter({ hasText: 'Étape 2 — Consentement' })).toBeVisible()
})

test('expired token shows the expired invitation screen', async ({ page }) => {
  await page.goto('/onboarding/expired-token')

  await expect(page.getByText('Invitation expirée')).toBeVisible()
  await expect(page.getByRole('heading', { name: /Ce lien d’invitation n’est plus utilisable/i })).toBeVisible()
})

test('completed token shows the completion screen', async ({ page }) => {
  await page.goto('/onboarding/completed-token')

  await expect(page.getByRole('heading', { name: /Votre profil est en cours de validation/i })).toBeVisible()
  await expect(page.getByText(/Notre équipe revient vers vous sous 48 à 72h/i)).toBeVisible()
})
