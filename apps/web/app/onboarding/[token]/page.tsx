import { redirect } from 'next/navigation'
import type { OnboardingOverviewData } from './types'
import OnboardingClient from './OnboardingClient'
import CompletionScreen from './CompletionScreen'

function ExpiredInvitationScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-creme px-6 text-center text-texte">
      <div className="max-w-lg">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-highlight">Invitation expirée</p>
        <h1 className="mt-4 font-cormorant text-[34px] font-semibold leading-tight text-bordeaux">
          Ce lien d’invitation n’est plus utilisable.
        </h1>
        <p className="mt-4 text-base leading-7 text-gris">
          Contacte l’équipe Wedly pour recevoir une nouvelle invitation et finaliser ton profil.
        </p>
      </div>
    </div>
  )
}

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
    if (res.status === 410) {
      const data = await res.json().catch(() => ({}))
      if (data?.error === 'Token expiré') return <ExpiredInvitationScreen />

      return <CompletionScreen />
    }
    redirect('/not-found')
  }
  const data: OnboardingOverviewData = await res.json()
  return <OnboardingClient data={data} token={token} />
}
