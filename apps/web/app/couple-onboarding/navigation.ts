import type { CoupleOnboardingData } from '@/lib/couple-onboarding-store'

export type CoupleOnboardingScreen = 1 | 2 | 3 | 4 | 5 | 6

export type CoupleOnboardingContinueAction =
  | { type: 'show_wedding_profile' }
  | { type: 'show_sensitive_data_consent' }
  | { type: 'show_confessions' }
  | { type: 'show_cultures' }
  | { type: 'show_provider_budget' }
  | { type: 'complete_onboarding'; data: CoupleOnboardingData }

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
        : { type: 'show_provider_budget' }
    case 4:
      return { type: 'show_cultures' }
    case 5:
      return { type: 'show_provider_budget' }
    case 6:
      return { type: 'complete_onboarding', data }
  }
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
