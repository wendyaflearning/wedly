import type { Metadata } from 'next'
import CoupleZonePlaceholder from '@/components/couple/CoupleZonePlaceholder'

export const metadata: Metadata = {
  title: 'Accompagnement | Mon espace Wedly',
  description: 'Découvrez bientôt le copilote Wedly : WedPlan, WedWallet et WedMatch.',
}

export default function CoupleAccompagnementPage() {
  return (
    <CoupleZonePlaceholder
      title="Accompagnement"
      description="WedPlan, WedWallet et WedMatch arriveront ici en teaser — votre copilote de mariage, sans paiement actif pendant la phase pilote."
      followUpTicket="US-6.7"
    />
  )
}
