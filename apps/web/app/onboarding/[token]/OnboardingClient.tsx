'use client'
import { useState } from 'react'
import type { OnboardingData } from './types'
import WelcomeScreen from './WelcomeScreen'
import Dashboard from './Dashboard'

export default function OnboardingClient({
  data,
  token,
}: {
  data: OnboardingData
  token: string
}) {
  const [screen, setScreen] = useState<'welcome' | 'dashboard'>('welcome')

  if (screen === 'welcome') {
    return (
      <WelcomeScreen
        firstname={data.firstname}
        onContinue={() => setScreen('dashboard')}
      />
    )
  }

  return <Dashboard data={data} token={token} />
}
