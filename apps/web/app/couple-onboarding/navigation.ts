import type { CoupleOnboardingData } from '@/lib/couple-onboarding-store'

export type CoupleOnboardingScreen = 1 | 2 | 3 | 4 | 5 | 6

export type CoupleOnboardingContinueAction =
  | { type: 'show_wedding_profile' }
  | { type: 'show_sensitive_data_consent' }
  | { type: 'show_confessions' }
  | { type: 'show_cultures' }
  | { type: 'show_budget' }
  | { type: 'complete_onboarding'; data: CoupleOnboardingData }

/**
 * Stages A to C own screens 1 to 6. Screen 6 asks the exact wedding budget and
 * is shown on every path — the couple must be able to state it whether it came
 * from a direct signup or from a pin (WED-108). Only the sensitive-preference
 * screens stay conditional; the account creation screen belongs to Stage D
 * (WED-109) and does not exist in this flow yet.
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

  return (screen - 1) as CoupleOnboardingScreen
}

/**
 * The mockup gates screen 1 on the first name: `User.firstName` is NOT NULL, so
 * the flow cannot reach the final account creation without it. Screen 2 stays
 * unblocked on purpose — none of its fields may stop the couple (WED-106).
 */
export function canContinue(
  screen: CoupleOnboardingScreen,
  data: CoupleOnboardingData,
): boolean {
  return screen === 1 ? Boolean(data.firstName?.trim()) : true
}
