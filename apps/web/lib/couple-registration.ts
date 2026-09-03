import {
  clampBudgetCents,
  clampGuestCount,
  DEFAULT_PLANNING_STAGE,
  type CoupleOnboardingData,
  type PlanningStage,
  weddingBudgetCents,
} from './couple-onboarding-store'

/**
 * The same floor as `PostResetPasswordAction`: the couple sets its password on
 * screen 7 and resets it later through that action, so a password accepted here
 * has to stay acceptable there.
 */
export const MIN_PASSWORD_LENGTH = 8

export interface CoupleCredentials {
  email: string
  password: string
  passwordConfirmation: string
}

/**
 * Everything the couple typed across screens 1 to 7, in the shape
 * `POST /api/v1/register` reads it. The contact request keeps the nested form the
 * store already holds, narrowed to the vendor alone — `RegisterCoupleRequestDto`
 * validates it as a whole, its presence deciding whether a lead is created
 * (PROVIDER-LEAD-001). The crush photo travels with it when the journey started
 * on one (PROVIDER-LEAD-004). The service label the journey shows the couple
 * stays in the browser: the server neither reads nor stores it.
 */
export interface CoupleRegistrationPayload {
  email: string
  password: string
  passwordConfirmation: string
  firstName: string
  planningStage: PlanningStage
  weddingDate: string
  location: string
  budgetCents: number
  guestCount: number
  sensitiveDataConsent: boolean
  confessionSlugs: string[]
  cultureSlugs: string[]
  contactRequest: { vendorId: string; portfolioImageId: string | null } | null
}

/**
 * Gates the "Créer mon compte" button. The message is the one shown under the
 * form, so it names the field that is not right yet rather than the whole form.
 * The backend re-runs all three checks: this state lives in the browser.
 */
export function credentialsError(credentials: CoupleCredentials): string | null {
  const email = credentials.email.trim()

  if (!email) return 'Renseignez votre adresse email.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Cette adresse email n’est pas valide.'
  if (credentials.password.length < MIN_PASSWORD_LENGTH) {
    return `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.`
  }
  if (credentials.password !== credentials.passwordConfirmation) {
    return 'Les mots de passe ne correspondent pas.'
  }

  return null
}

/**
 * The single payload of the journey (COUPLE-ONBOARDING-001). Values are bounded
 * once more on the way out — the onboarding state sat in a sessionStorage the
 * couple can rewrite — and the sensitive selections are dropped unless consent
 * was granted, so a refusal never reaches the server (RGPD-CONSENT-001).
 */
export function buildRegistrationPayload(
  data: CoupleOnboardingData,
  credentials: CoupleCredentials,
): CoupleRegistrationPayload {
  const consentGranted = data.sensitiveDataConsent === true

  return {
    email: credentials.email.trim(),
    password: credentials.password,
    passwordConfirmation: credentials.passwordConfirmation,
    firstName: data.firstName?.trim() ?? '',
    planningStage: data.planningStage ?? DEFAULT_PLANNING_STAGE,
    weddingDate: data.weddingDate ?? '',
    location: data.location?.trim() ?? '',
    budgetCents: clampBudgetCents(weddingBudgetCents(data)),
    guestCount: clampGuestCount(data.guestCount),
    sensitiveDataConsent: consentGranted,
    confessionSlugs: consentGranted ? data.confessionSlugs ?? [] : [],
    cultureSlugs: consentGranted ? data.cultureSlugs ?? [] : [],
    contactRequest: data.contactRequest
      ? {
          vendorId: data.contactRequest.vendorId,
          portfolioImageId: data.contactRequest.portfolioImageId ?? null,
        }
      : null,
  }
}

/**
 * Le code machine que l'API pose sur un email déjà porté par un compte
 * (WED-162). Le parcours teste cette constante, jamais le message : celui-ci est
 * de la copie et changera.
 */
export const EMAIL_ALREADY_USED = 'EMAIL_ALREADY_USED'

export type CoupleRegistrationResult =
  | { success: true; firstName: string }
  | { success: false; error: string; code?: string }

/**
 * Goes through the Next.js route handler rather than the API directly: the JWT
 * comes back as an httpOnly cookie, which only a same-origin response can set
 * for the browser — the same path `loginVendor` takes.
 */
export async function registerCouple(
  payload: CoupleRegistrationPayload,
): Promise<CoupleRegistrationResult> {
  try {
    const response = await fetch('/api/couple/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const body = await response.json().catch(() => null)

    if (!response.ok) {
      // `code` n'accompagne que les refus que l'API sait nommer : il reste
      // `undefined` sur tous les autres, et l'appelant retombe sur le message.
      return {
        success: false,
        error: body?.error ?? 'Une erreur est survenue. Réessayez.',
        code: body?.code,
      }
    }

    return { success: true, firstName: body?.firstName ?? payload.firstName }
  } catch {
    return { success: false, error: 'Une erreur réseau est survenue. Réessayez.' }
  }
}
