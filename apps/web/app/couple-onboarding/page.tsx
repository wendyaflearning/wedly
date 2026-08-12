import type { Metadata } from 'next'
import CoupleOnboarding from './CoupleOnboarding'

export const metadata: Metadata = {
  title: 'Votre mariage | Wedly',
  description: 'Dites-nous où vous en êtes dans l’organisation de votre mariage.',
}

export default function CoupleOnboardingPage() {
  return <CoupleOnboarding />
}
