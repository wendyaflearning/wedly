import { expect, test } from '@playwright/test'
import { getCapturedRequests, resetMockApi } from './helpers/mock-api'

test.beforeEach(async ({ request }) => {
  await resetMockApi(request)
})

test('blocks final submission when previous required steps are incomplete', async ({ page }) => {
  await page.goto('/onboarding/credentials-incomplete-token')
  await page.getByRole('button', { name: /je découvre mon profil/i }).click()
  await page.locator('span').filter({ hasText: 'Étape 6 — Connexion' }).click()

  await expect(page.getByRole('heading', { name: /Votre profil est presque prêt/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /créer mon profil/i }).first()).toBeDisabled()

  await page.locator('.fixed').getByRole('button', { name: 'Professions', exact: true }).click()

  await expect(page.getByRole('heading', { name: /Qu['’]est-ce que vous proposez/i })).toBeVisible()
})

test('keeps credentials submission disabled until email and password are valid', async ({ page }) => {
  await page.goto('/onboarding/credentials-complete-token')
  await page.getByRole('button', { name: /je découvre mon profil/i }).click()
  await page.locator('span').filter({ hasText: 'Étape 6 — Connexion' }).click()

  const submitButton = page.getByRole('button', { name: /créer mon profil/i })
  await expect(submitButton).toBeDisabled()

  await page.getByPlaceholder('votre@email.com').fill('invalid')
  await page.getByPlaceholder('8 caractères minimum').fill('password')
  await page.getByPlaceholder('Répétez votre mot de passe').fill('different')
  await expect(page.getByText('Les mots de passe ne correspondent pas.')).toBeVisible()
  await expect(submitButton).toBeDisabled()

  await page.getByPlaceholder('votre@email.com').fill('marie@example.test')
  await page.getByPlaceholder('8 caractères minimum').fill('Password!')
  await page.getByPlaceholder('Répétez votre mot de passe').fill('Password!')
  await expect(submitButton).toBeEnabled()
})

test('shows an email conflict error returned by the backend', async ({ page, request }) => {
  await page.goto('/onboarding/credentials-complete-token')
  await page.getByRole('button', { name: /je découvre mon profil/i }).click()
  await page.locator('span').filter({ hasText: 'Étape 6 — Connexion' }).click()

  await page.getByPlaceholder('votre@email.com').fill('conflict@example.test')
  await page.getByPlaceholder('8 caractères minimum').fill('Password!')
  await page.getByPlaceholder('Répétez votre mot de passe').fill('Password!')
  await page.getByRole('button', { name: /créer mon profil/i }).click()

  await expect(page.getByText('Cet email est déjà utilisé.')).toBeVisible()

  const requests = await getCapturedRequests(request)
  expect(requests[0]).toEqual(expect.objectContaining({
    token: 'credentials-complete-token',
    body: {
      step: 'credentials',
      data: {
        email: 'conflict@example.test',
        password: 'Password!',
        password_confirmation: 'Password!',
      },
    },
  }))
})

test('submits valid credentials and shows the completion screen', async ({ page, request }) => {
  await page.goto('/onboarding/credentials-complete-token')
  await page.getByRole('button', { name: /je découvre mon profil/i }).click()
  await page.locator('span').filter({ hasText: 'Étape 6 — Connexion' }).click()

  await page.getByPlaceholder('votre@email.com').fill('marie@example.test')
  await page.getByPlaceholder('8 caractères minimum').fill('Password!')
  await page.getByPlaceholder('Répétez votre mot de passe').fill('Password!')
  await page.getByRole('button', { name: /créer mon profil/i }).click()

  await expect(page.getByRole('heading', { name: /Votre profil est en cours de validation/i })).toBeVisible()

  const requests = await getCapturedRequests(request)
  expect(requests[0]).toEqual(expect.objectContaining({
    token: 'credentials-complete-token',
    body: {
      step: 'credentials',
      data: {
        email: 'marie@example.test',
        password: 'Password!',
        password_confirmation: 'Password!',
      },
    },
  }))
})
