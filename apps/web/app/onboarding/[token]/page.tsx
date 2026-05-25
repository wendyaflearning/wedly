import { redirect } from 'next/navigation'
import type { OnboardingOverviewData } from './types'
import OnboardingClient from './OnboardingClient'
import CompletionScreen from './CompletionScreen'

export default async function OnboardingPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/onboarding/${token}`,
    { cache: 'no-store' },
  )
  if (!res.ok) {
    if (res.status === 410) return <CompletionScreen />
    redirect('/not-found')
  }
  const data: OnboardingOverviewData = await res.json()
  return <OnboardingClient data={data} token={token} />
}
