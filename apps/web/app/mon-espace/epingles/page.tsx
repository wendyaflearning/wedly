import type { Metadata } from 'next'
import { PinnedPhotosError } from '@/components/couple/pins/PinnedPhotosError'
import { PinnedPhotosZone } from '@/components/couple/pins/PinnedPhotosZone'
import { fetchInitialCtaStatuses } from '@/lib/couple-cta-status'
import { fetchCouplePins } from '@/lib/couple-pins.server'

export const metadata: Metadata = {
  title: 'Épinglés | Mon espace Wedly',
  description: 'Retrouvez vos photos coup de cœur épinglées depuis WedDream.',
}

export default async function CoupleEpinglesPage() {
  const [result, initialCtaStatuses] = await Promise.all([
    fetchCouplePins(),
    fetchInitialCtaStatuses(),
  ])

  if (!result.ok) return <PinnedPhotosError />

  return <PinnedPhotosZone pins={result.items} initialCtaStatuses={initialCtaStatuses} />
}
