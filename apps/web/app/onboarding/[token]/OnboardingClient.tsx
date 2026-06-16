'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { OnboardingOverviewData } from './types'
import WelcomeScreen from './WelcomeScreen'
import OnboardingOverview from './OnboardingOverview'
import ProfessionsStep from './steps/professions/ProfessionsStep'
import ExperiencesStep from './steps/experiences/ExperiencesStep'
import VenueCharacteristicsStep from './steps/venue_characteristics/VenueCharacteristicsStep'
import CateringCharacteristicsStep from './steps/catering_characteristics/CateringCharacteristicsStep'
import ZonesPricingStep from './steps/zones-pricing/ZonesPricingStep'
import PortfolioStep from './steps/portfolio/PortfolioStep'
import LegalInfoStep from './steps/legal_info/LegalInfoStep'
import CredentialsStep from './steps/credentials/CredentialsStep'
import CompletionScreen from './CompletionScreen'

type Screen = 'welcome' | 'onboarding_overview' | 'professions' | 'experiences' | 'venue_characteristics' | 'catering_characteristics' | 'zones_pricing' | 'portfolio' | 'legal_info' | 'credentials' | 'completed'

export default function OnboardingClient({
  data,
  token,
}: {
  data: OnboardingOverviewData
  token: string
}) {
  const router = useRouter()
  const [screen, setScreen] = useState<Screen>('welcome')

  function navigate(next: Screen) {
    window.scrollTo({ top: 0, behavior: 'instant' })
    setScreen(next)
  }

  if (screen === 'welcome') {
    return (
      <WelcomeScreen
        firstname={data.firstname}
        onContinue={() => navigate('onboarding_overview')}
      />
    )
  }

  const navigateToStep = (stepKey: string) => navigate(stepKey as Screen)

  if (screen === 'professions') {
    return (
      <ProfessionsStep
        token={token}
        initialServices={data.steps_data?.professions?.services ?? []}
        steps={data.steps}
        currentStepKey="professions"
        onBack={() => navigate('onboarding_overview')}
        onNext={(nextStep) => {
          router.refresh()
          navigate(nextStep as Screen)
        }}
        onNavigate={navigateToStep}
      />
    )
  }

  if (screen === 'experiences') {
    return (
      <ExperiencesStep
        token={token}
        vendorType={data.vendor_type}
        initialExperiences={data.steps_data?.experiences ?? { confession_ids: [], culture_ids: [] }}
        steps={data.steps}
        currentStepKey="experiences"
        onBack={() => navigate('onboarding_overview')}
        onNext={(nextStep) => {
          router.refresh()
          navigate(nextStep as Screen)
        }}
        onNavigate={navigateToStep}
      />
    )
  }

  if (screen === 'catering_characteristics') {
    return (
      <CateringCharacteristicsStep
        token={token}
        initialData={data.steps_data?.catering_characteristics ?? null}
        steps={data.steps}
        currentStepKey="catering_characteristics"
        onBack={() => navigate('onboarding_overview')}
        onNext={(nextStep) => {
          router.refresh()
          navigate(nextStep as Screen)
        }}
        onNavigate={navigateToStep}
      />
    )
  }

  if (screen === 'venue_characteristics') {
    return (
      <VenueCharacteristicsStep
        token={token}
        initialVenueDetails={data.steps_data?.venue_characteristics ?? null}
        steps={data.steps}
        currentStepKey="venue_characteristics"
        onBack={() => navigate('onboarding_overview')}
        onNext={(nextStep) => {
          router.refresh()
          navigate(nextStep as Screen)
        }}
        onNavigate={navigateToStep}
      />
    )
  }

  if (screen === 'zones_pricing') {
    return (
      <ZonesPricingStep
        token={token}
        initialData={data.steps_data?.zones_pricing ?? null}
        vendorType={data.vendor_type}
        steps={data.steps}
        currentStepKey="zones_pricing"
        onBack={() => navigate('onboarding_overview')}
        onNext={(nextStep) => {
          router.refresh()
          navigate(nextStep as Screen)
        }}
        onNavigate={navigateToStep}
      />
    )
  }

  if (screen === 'portfolio') {
    return (
      <PortfolioStep
        token={token}
        initialData={data.steps_data?.portfolio ?? null}
        steps={data.steps}
        currentStepKey="portfolio"
        onBack={() => navigate('onboarding_overview')}
        onNext={(nextStep) => {
          router.refresh()
          navigate(nextStep as Screen)
        }}
        onNavigate={navigateToStep}
      />
    )
  }

  if (screen === 'legal_info') {
    return (
      <LegalInfoStep
        token={token}
        initialData={data.steps_data?.legal_info ?? null}
        steps={data.steps}
        currentStepKey="legal_info"
        onBack={() => navigate('onboarding_overview')}
        onNext={(nextStep) => {
          router.refresh()
          navigate(nextStep as Screen)
        }}
        onNavigate={navigateToStep}
      />
    )
  }

  if (screen === 'credentials') {
    return (
      <CredentialsStep
        token={token}
        initialEmail={data.steps_data?.credentials?.email ?? null}
        steps={data.steps}
        currentStepKey="credentials"
        onBack={() => navigate('onboarding_overview')}
        onComplete={() => navigate('completed')}
        onNavigate={navigateToStep}
      />
    )
  }

  if (screen === 'completed') {
    return <CompletionScreen />
  }

  return (
    <OnboardingOverview
      data={data}
      token={token}
      onStepClick={(stepKey) => navigate(stepKey as Screen)}
    />
  )
}
