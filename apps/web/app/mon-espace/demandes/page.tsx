import type { Metadata } from 'next'
import CoupleZonePlaceholder from '@/components/couple/CoupleZonePlaceholder'

export const metadata: Metadata = {
  title: 'Demandes de contact | Mon espace Wedly',
  description: 'Suivez vos demandes de contact avec les prestataires Wedly.',
}

export default function CoupleDemandesPage() {
  return (
    <CoupleZonePlaceholder
      title="Demandes de contact"
      description="Vos demandes envoyées depuis la galerie WedDream apparaîtront ici, avec leur statut et la photo coup de cœur associée."
      followUpTicket="US-6.5"
    />
  )
}
