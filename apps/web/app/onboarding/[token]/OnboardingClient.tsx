'use client'
import { useState } from 'react'
import type { OnboardingOverviewData } from './types'
import WelcomeScreen from './WelcomeScreen'
import OnboardingOverview from './OnboardingOverview'

export default function OnboardingClient({
  data,
  token,
}: {
  data: OnboardingOverviewData
  token: string
}) {
  const [screen, setScreen] = useState<'welcome' | 'onboarding_overview'>('welcome')

  if (screen === 'welcome') {
    return (
      <WelcomeScreen
        firstname={data.firstname}
        onContinue={() => setScreen('onboarding_overview')}
      />
    )
  }

  return <OnboardingOverview data={data} token={token} />
}
