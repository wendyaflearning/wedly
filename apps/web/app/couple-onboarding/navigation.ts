import type { CoupleOnboardingData } from '@/lib/couple-onboarding-store'

export type CoupleOnboardingScreen = 1 | 2

export type CoupleOnboardingContinueAction =
  | { type: 'show_wedding_profile' }
  | { type: 'complete_stage_a'; data: CoupleOnboardingData }

export function getContinueAction(
  screen: CoupleOnboardingScreen,
  data: CoupleOnboardingData,
): CoupleOnboardingContinueAction {
  return screen === 1
    ? { type: 'show_wedding_profile' }
    : { type: 'complete_stage_a', data }
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
