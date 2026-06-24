'use client'
import { useRef } from 'react'
import type { OnboardingStep, PortfolioData, PortfolioImage } from '../../types'
import { usePortfolioUpload } from '@/hooks/usePortfolioUpload'
import PortfolioUploaderOnboarding from './PortfolioUploaderOnboarding'

export default function PortfolioStep({ token, initialData, steps, currentStepKey, onBack, onNext, onNavigate }: {
  token:          string
  initialData:    PortfolioData | null
  steps:          OnboardingStep[]
  currentStepKey: string
  onBack:         () => void
  onNext:         (nextStep: string) => void
  onNavigate:     (stepKey: string) => void
}) {
  // Tracks all photo IDs known at call time, to identify new secondary from batch response
  const knownIdsRef = useRef<Set<string>>(
    new Set((initialData?.images ?? []).map(img => img.id))
  )

  const uploadFn = async (file: File, isCover?: boolean): Promise<PortfolioImage> => {
    const fd = new FormData()
    if (isCover) fd.append('cover_photo', file)
    else         fd.append('photos[]', file)
    const res = await fetch(`/api/onboarding/${token}/portfolio`, { method: 'POST', body: fd })
    if (!res.ok) throw new Error((await res.json()).error ?? 'Erreur')
    const { images } = await res.json() as { images: PortfolioImage[] }
    if (isCover) {
      const img = images.find(i => i.is_cover)!
      knownIdsRef.current.add(img.id)
      return img
    }
    const img = images.find(i => !i.is_cover && !knownIdsRef.current.has(i.id))!
    if (img) knownIdsRef.current.add(img.id)
    return img
  }

  const hook = usePortfolioUpload({
    uploadFn,
    deleteFn:   async (id) => {
      await fetch(`/api/onboarding/${token}/portfolio/${id}`, { method: 'DELETE' })
    },
    setCoverFn: async () => { /* non supporté en onboarding */ },
    initialPhotos: initialData?.images ?? [],
    maxPhotos: 5,
  })

  return (
    <PortfolioUploaderOnboarding
      {...hook}
      steps={steps}
      currentStepKey={currentStepKey}
      onBack={onBack}
      onNext={onNext}
      onNavigate={onNavigate}
    />
  )
}
