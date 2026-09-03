import type { Metadata } from 'next'
import CoupleZonePlaceholder from '@/components/couple/CoupleZonePlaceholder'

export const metadata: Metadata = {
  title: 'Épinglés | Mon espace Wedly',
  description: 'Retrouvez vos photos coup de cœur épinglées depuis WedDream.',
}

export default function CoupleEpinglesPage() {
  return (
    <CoupleZonePlaceholder
      title="Épinglés"
      description="Les photos que vous avez épinglées dans WedDream seront rassemblées ici pour y revenir en un clic."
      followUpTicket="US-6.6"
    />
  )
}
