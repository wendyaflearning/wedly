'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { OnboardingOverviewData } from './types'
import WelcomeScreen from './WelcomeScreen'
import OnboardingOverview from './OnboardingOverview'
import ProfessionsStep from './steps/professions/ProfessionsStep'

type Screen = 'welcome' | 'onboarding_overview' | 'professions' | 'experiences' | 'zones_pricing' | 'portfolio' | 'legal_info' | 'credentials'

export default function OnboardingClient({
  data,
  token,
}: {
  data: OnboardingOverviewData
  token: string
}) {
  const router = useRouter()
  const [screen, setScreen] = useState<Screen>('welcome')

  if (screen === 'welcome') {
    return (
      <WelcomeScreen
        firstname={data.firstname}
        onContinue={() => setScreen('onboarding_overview')}
      />
    )
  }

  if (screen === 'professions') {
    return (
      <ProfessionsStep
        token={token}
        initialServices={data.steps_data?.professions?.services ?? []}
        onBack={() => setScreen('onboarding_overview')}
        onNext={(nextStep) => {
          router.refresh()
          setScreen(nextStep as Screen)
        }}
      />
    )
  }

  return (
    <OnboardingOverview
      data={data}
      token={token}
      onStepClick={(stepKey) => setScreen(stepKey as Screen)}
    />
  )
}
