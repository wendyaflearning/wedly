import { expect, type Page } from '@playwright/test'

export async function openOnboarding(page: Page, token: string) {
  await page.goto(`/onboarding/${token}`)
  await page.getByRole('button', { name: /je découvre mon profil/i }).click()
}

export async function completeProfessions(page: Page, serviceName = 'Photographe') {
  await page.locator('span').filter({ hasText: 'Étape 1 — Professions' }).click()
  await page.getByRole('button', { name: serviceName, exact: true }).click()
  await page.getByRole('button', { name: /confirmer/i }).click()
}

export async function acceptConsent(page: Page) {
  await expect(page.getByText('Pour vous connecter aux bons couples')).toBeVisible()
  await page.getByRole('button', { name: /j['’]accepte et je continue/i }).click()
}

export async function completeExperiences(page: Page) {
  await expect(page.getByRole('heading', { name: /Quels univers de mariage connaissez-vous bien/i })).toBeVisible()
  await page.getByRole('button', { name: 'France' }).click()
  await page.getByRole('button', { name: /continuer/i }).click()
  await page.getByRole('button', { name: 'Laique' }).click()
  await page.getByRole('button', { name: /confirmer/i }).click()
}

export async function completeCateringCharacteristics(page: Page) {
  await expect(page.getByRole('heading', { name: /Parlez-nous de votre offre/i })).toBeVisible()
  await page.locator('input[type="number"]').nth(0).fill('40')
  await page.locator('input[type="number"]').nth(1).fill('180')
  await page.getByRole('button', { name: 'Service à table' }).click()
  await page.getByRole('button', { name: 'Halal' }).click()
  await page.getByText('Vaisselle fournie').locator('..').getByRole('button', { name: 'Oui' }).click()
  await page.getByText('Mobilier fourni').locator('..').getByRole('button', { name: 'Non' }).click()
  await page.getByRole('button', { name: /confirmer/i }).click()
}

export async function completeVenueCharacteristics(page: Page) {
  await expect(page.getByRole('heading', { name: /Parlez-nous de votre lieu/i })).toBeVisible()
  await page.locator('input[type="number"]').nth(0).fill('80')
  await page.locator('input[type="number"]').nth(1).fill('250')
  await page.getByRole('button', { name: 'Domaine' }).click()
  await chooseBoolean(page, 'Traiteur inclus', 'Oui')
  await chooseBoolean(page, 'Couchages sur place', 'Non')
  await chooseBoolean(page, 'Espace extérieur disponible', 'Oui')
  await chooseBoolean(page, 'Accessible PMR', 'Oui')
  await page.getByRole('button', { name: /confirmer/i }).click()
}

export async function completeZonesPricing(page: Page, vendorType: 'freelance' | 'lieu' | 'createurs' = 'freelance') {
  await expect(page.getByRole('heading', { name: /Où .*budget/i })).toBeVisible()

  if (vendorType === 'lieu') {
    await page.getByPlaceholder('Ex : Paris, Lyon…').fill('Paris')
    await page.getByRole('button', { name: /sélectionner une région/i }).click()
    await page.getByRole('button', { name: 'Ile-de-France' }).click()
    await page.getByPlaceholder('30').fill('25')
    await page.getByPlaceholder('Ville de référence').fill('Versailles')
  } else if (vendorType === 'createurs') {
    await page.getByPlaceholder('Ex : Paris, Lyon…').fill('Paris')
    await page.getByRole('button', { name: /sélectionner une région/i }).click()
    await page.getByRole('button', { name: 'Ile-de-France' }).click()
  } else {
    await page.getByRole('button', { name: /sélectionner vos régions/i }).click()
    await page.getByRole('button', { name: 'Ile-de-France' }).click()
  }

  await page.locator('input[type="number"]').nth(vendorType === 'lieu' ? 1 : 0).fill('1200')
  await page.locator('input[type="number"]').nth(vendorType === 'lieu' ? 2 : 1).fill('2500')
  if (vendorType === 'lieu' || vendorType === 'createurs') {
    await page.getByRole('button', { name: 'Par prestation' }).click()
  } else {
    await page.locator('select').selectOption('per_service')
  }
  await page.getByRole('button', { name: /confirmer/i }).click()
}

export async function confirmPrefilledPortfolio(page: Page) {
  await expect(page.getByRole('heading', { name: /Votre travail, en images/i })).toBeVisible()
  await page.getByRole('button', { name: /confirmer/i }).click()
}

export async function completeLegalInfo(page: Page, brandName = 'Studio Lumiere') {
  await expect(page.getByRole('heading', { name: /Votre identité, en toute confiance/i })).toBeVisible()
  await page.getByPlaceholder('Ex : Atelier Lumière, Studio Mariage…').fill(brandName)
  await page.getByPlaceholder('Marie').fill('Marie')
  await page.getByPlaceholder('Dupont').fill('Durand')
  await page.getByPlaceholder('+33 6 00 00 00 00').fill('0612345678')
  await page.getByPlaceholder('12 rue de la Paix').fill('12 rue de la Paix')
  await page.getByPlaceholder('75001').fill('75001')
  await page.getByPlaceholder('Paris').fill('Paris')
  await page.getByPlaceholder('000 000 000 00000').fill('12345678901234')
  await page.getByRole('button', { name: /confirmer/i }).click()
}

export async function completeCredentials(page: Page, email = 'marie@example.test') {
  await expect(page.getByRole('heading', { name: /Votre espace vous attend/i })).toBeVisible()
  await page.getByPlaceholder('votre@email.com').fill(email)
  await page.getByPlaceholder('8 caractères minimum').fill('Password!')
  await page.getByPlaceholder('Répétez votre mot de passe').fill('Password!')
  await page.getByRole('button', { name: /créer mon profil/i }).click()
  await expect(page.getByRole('heading', { name: /Votre profil est en cours de validation/i })).toBeVisible()
}

async function chooseBoolean(page: Page, label: string, choice: 'Oui' | 'Non') {
  await page.getByText(label).locator('..').getByRole('button', { name: choice }).click()
}
