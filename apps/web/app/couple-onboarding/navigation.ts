import type { CoupleOnboardingData } from '@/lib/couple-onboarding-store'

export type CoupleOnboardingScreen = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9

/**
 * The progress indicator counts the seven steps the couple actually fills in.
 * Screens 8 and 9 are the two ways out of the journey — the welcome screen once
 * the account exists (7bis in the deck), and the "you already have an account"
 * screen when the email turns out to be taken (WED-162). Both are past the
 * journey, so neither carries a step of its own.
 */
export const COUPLE_ONBOARDING_STEPS = 7

export type CoupleOnboardingContinueAction =
  | { type: 'show_wedding_profile' }
  | { type: 'show_sensitive_data_consent' }
  | { type: 'show_confessions' }
  | { type: 'show_cultures' }
  | { type: 'show_budget' }
  | { type: 'show_account_creation' }
  | { type: 'complete_onboarding'; data: CoupleOnboardingData }

/**
 * Stages A to C own screens 1 to 6. Screen 6 asks the exact wedding budget and
 * is shown on every path — the couple must be able to state it whether it came
 * from a direct signup or from a pin (WED-108). Only the sensitive-preference
 * screens stay conditional; screen 7 closes the journey by creating the account,
 * which is the single point where everything collected so far is persisted
 * (COUPLE-ONBOARDING-001).
 */
export function getContinueAction(
  screen: CoupleOnboardingScreen,
  data: CoupleOnboardingData,
): CoupleOnboardingContinueAction {
  switch (screen) {
    case 1:
      return { type: 'show_wedding_profile' }
    case 2:
      return { type: 'show_sensitive_data_consent' }
    case 3:
      return data.sensitiveDataConsent
        ? { type: 'show_confessions' }
        : { type: 'show_budget' }
    case 4:
      return { type: 'show_cultures' }
    case 5:
      return { type: 'show_budget' }
    case 6:
      return { type: 'show_account_creation' }
    case 7:
    case 8:
    // Screen 9 has no "Continuer" button of its own — it is an exit screen, and
    // its two ways out are links. The case exists because the switch is
    // exhaustive over the union, not because anything reaches it.
    case 9:
      return { type: 'complete_onboarding', data }
  }
}

/**
 * Screen 6 skipped screens 4 and 5 when the couple refused the sensitive-data
 * step, so walking back from it must land on the consent screen it really came
 * from rather than on a screen that was never shown.
 */
export function previousScreen(
  screen: CoupleOnboardingScreen,
  data: CoupleOnboardingData,
): CoupleOnboardingScreen {
  if (screen === 6 && !data.sensitiveDataConsent) return 3
  // Nothing to walk back to from either exit screen: screen 8 is reached once the
  // account exists, and screen 9 once it turns out to already exist. Without this
  // guard the arithmetic below would send screen 9 back to 8 — the "your account
  // is ready" screen, for an account that was never created (WED-162).
  if (screen === 8 || screen === 9) return screen

  return (screen - 1) as CoupleOnboardingScreen
}

/**
 * Two screens gate the progression, and both do so because a NOT NULL column
 * stands behind them — the account creation of screen 7 is the only write, so a
 * value missing here fails at the very end of the journey or not at all.
 *
 * Screen 1 gates on the first name (`app_user.first_name`, COUPLE-ONBOARDING-006).
 * Screen 2 gates on the wedding date and the town (`wedding.date`,
 * `wedding.location`): WED-106 had left every field of that screen optional, and
 * Denis reversed that on 23/08/2026 rather than making the two columns nullable —
 * a made-up date or town would be read back by Wedmatch as a real preference. The
 * budget and guest sliders stay unblocking: they always carry a value
 * (COUPLE-ONBOARDING-005), so nothing is left to gate on.
 */
export function canContinue(
  screen: CoupleOnboardingScreen,
  data: CoupleOnboardingData,
): boolean {
  if (screen === 1) return Boolean(data.firstName?.trim())
  if (screen === 2) return Boolean(data.weddingDate && data.location?.trim())

  return true
}
