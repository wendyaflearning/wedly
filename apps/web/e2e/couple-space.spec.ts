import { expect, test } from '@playwright/test'
import { loginAsCouple } from './helpers/couple-space'
import { resetMockApi } from './helpers/mock-api'

test.beforeEach(async ({ request }) => {
  await resetMockApi(request)
})

test('authenticated couple visits Mon espace tabs with empty states and accompagnement teasers', async ({
  page,
}) => {
  await loginAsCouple(page)

  await expect(page).toHaveURL(/\/mon-espace\/demandes/)
  await expect(page.getByRole('heading', { name: /Bonjour/ })).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Aucune demande de contact pour l’instant' }),
  ).toBeVisible()

  await page.getByRole('link', { name: 'Épinglés' }).click()
  await expect(page).toHaveURL(/\/mon-espace\/epingles/)
  await expect(
    page.getByRole('heading', { name: 'Aucune photo épinglée pour l’instant' }),
  ).toBeVisible()

  await page.getByRole('link', { name: 'Accompagnement' }).click()
  await expect(page).toHaveURL(/\/mon-espace\/accompagnement/)

  await expect(page.getByRole('heading', { name: 'WedPlan', level: 3 })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'WedWallet', level: 3 })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'WedMatch', level: 3 })).toBeVisible()

  await expect(page.getByText('Débloquer')).toHaveCount(0)
  await expect(page.getByText('99€')).toHaveCount(0)
  await expect(page.getByRole('link', { name: /checkout/i })).toHaveCount(0)
})
