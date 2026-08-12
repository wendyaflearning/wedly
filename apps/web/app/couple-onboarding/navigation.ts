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
