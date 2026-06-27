'use client'

import { useState } from 'react'
import { BioSection } from '@/components/vendor/profile/BioSection'
import { BioPreviewPanel } from '@/components/vendor/profile/BioPreviewPanel'

interface Props {
  vendorId: string
  firstName: string
  initialBio?: string | null
  vendorServices: string[]
}

export default function BioPageClient({ vendorId, firstName, initialBio, vendorServices }: Props) {
  const [bio, setBio] = useState(initialBio ?? '')

  return (
    <div className="flex gap-8 pt-10 px-6 md:px-0">
      <BioSection
        vendorId={vendorId}
        initialBio={initialBio}
        vendorServices={vendorServices}
        onBioChange={setBio}
      />
      <BioPreviewPanel firstName={firstName} bio={bio} />
    </div>
  )
}
