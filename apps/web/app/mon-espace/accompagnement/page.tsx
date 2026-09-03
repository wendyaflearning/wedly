import type { Metadata } from 'next'
import { AccompagnementZone } from '@/components/couple/accompagnement/AccompagnementZone'

export const metadata: Metadata = {
  title: 'Accompagnement | Mon espace Wedly',
  description: 'Découvrez bientôt le copilote Wedly : WedPlan, WedWallet et WedMatch.',
}

export default function CoupleAccompagnementPage() {
  return <AccompagnementZone />
}
