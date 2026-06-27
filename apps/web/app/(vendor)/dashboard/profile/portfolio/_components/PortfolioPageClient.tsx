'use client'

import type { PortfolioImage } from '@/app/onboarding/[token]/types'
import { usePortfolioUpload } from '@/hooks/usePortfolioUpload'
import PortfolioUploaderDashboard from '@/components/portfolio/PortfolioUploaderDashboard'

const MAX_PHOTOS = 10

interface Props {
  initialPhotos: PortfolioImage[]
  vendorId: string
}

export default function PortfolioPageClient({ initialPhotos, vendorId }: Props) {
  const hook = usePortfolioUpload({
    uploadFn: async (file: File) => {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch(`/api/vendor/${vendorId}/portfolio`, { method: 'POST', body: fd })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Erreur')
      return res.json() as Promise<PortfolioImage>
    },
    deleteFn: async (photoId: string) => {
      const res = await fetch(`/api/vendor/${vendorId}/portfolio/${photoId}`, { method: 'DELETE' })
      if (!res.ok && res.status !== 204) throw new Error('delete_failed')
    },
    setCoverFn: async (photoId: string) => {
      const res = await fetch(`/api/vendor/${vendorId}/portfolio/${photoId}/cover`, { method: 'PATCH' })
      if (!res.ok) throw new Error('cover_failed')
    },
    initialPhotos,
    maxPhotos: MAX_PHOTOS,
  })

  return <PortfolioUploaderDashboard {...hook} maxPhotos={MAX_PHOTOS} />
}
