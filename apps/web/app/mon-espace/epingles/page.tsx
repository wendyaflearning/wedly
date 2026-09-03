import type { Metadata } from 'next'
import { PinnedPhotosError } from '@/components/couple/pins/PinnedPhotosError'
import { PinnedPhotosZone } from '@/components/couple/pins/PinnedPhotosZone'
import { fetchCouplePins } from '@/lib/couple-pins.server'

export const metadata: Metadata = {
  title: 'Épinglés | Mon espace Wedly',
  description: 'Retrouvez vos photos coup de cœur épinglées depuis WedDream.',
}

export default async function CoupleEpinglesPage() {
  const result = await fetchCouplePins()

  if (!result.ok) return <PinnedPhotosError />

  return <PinnedPhotosZone pins={result.items} />
}
