import type { Page } from '@playwright/test'

/** Mirrors the couple account seeded in `e2e/mock-api.mjs`. */
export const COUPLE_E2E_EMAIL = 'couple@example.test'
export const COUPLE_E2E_PASSWORD = 'couple-password'

export async function loginAsCouple(
  page: Page,
  options: { redirectTo?: string } = {},
): Promise<void> {
  const redirectTo = options.redirectTo ?? '/mon-espace'
  await page.goto(`/login?redirect=${encodeURIComponent(redirectTo)}`)

  await page.getByLabel('Adresse email').fill(COUPLE_E2E_EMAIL)
  await page.locator('#password').fill(COUPLE_E2E_PASSWORD)
  await page.getByRole('button', { name: 'Accéder à mon espace' }).click()

  await page.waitForURL(/\/mon-espace/)
}
