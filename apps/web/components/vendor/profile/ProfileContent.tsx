'use client'

import { useState } from 'react'
import { ProfileSideNav } from './ProfileSideNav'
import { BioSection } from './BioSection'
import { BioPreviewPanel } from './BioPreviewPanel'

interface Steps {
  availability: boolean
  portfolio: boolean
  bio: boolean
  published: boolean
}

interface Props {
  firstName: string
  initialBio?: string | null
  vendorServices: string[]
  steps: Steps
}

export function ProfileContent({ firstName, initialBio, vendorServices, steps }: Props) {
  const [liveBio, setLiveBio] = useState(initialBio ?? '')

  return (
    <div className="px-5 py-8 md:px-[72px] md:py-12 flex gap-10 xl:gap-14 items-start">
      <ProfileSideNav steps={steps} />
      <BioSection initialBio={initialBio} vendorServices={vendorServices} onBioChange={setLiveBio} />
      <BioPreviewPanel firstName={firstName} bio={liveBio} />
    </div>
  )
}
