'use client'

import { useEffect, useState } from 'react'
import type { PortfolioImage } from '@/app/onboarding/[token]/types'
import type { ServiceOptionNode } from '@/lib/admin-types'
import { usePortfolioUpload } from '@/hooks/usePortfolioUpload'
import { useServiceTagTypes } from '@/hooks/useServiceTagTypes'
import { useToast } from '@/hooks/useToast'
import { Toast } from '@/components/ui/Toast'
import { PortfolioTaggingModal } from '@/components/portfolio/PortfolioTaggingModal'
import PortfolioUploaderDashboard from '@/components/portfolio/PortfolioUploaderDashboard'

const MAX_PHOTOS = 10

interface Props {
  initialPhotos: PortfolioImage[]
  vendorId: string
  vendorServices: string[]
}

function findServiceBySlug(nodes: ServiceOptionNode[], slug: string): ServiceOptionNode | null {
  for (const node of nodes) {
    if (node.slug === slug) return node
    const found = findServiceBySlug(node.children, slug)
    if (found) return found
  }
  return null
}

export default function PortfolioPageClient({ initialPhotos, vendorId, vendorServices }: Props) {
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

  const primarySlug = vendorServices[0] ?? null
  const [primaryService, setPrimaryService] = useState<ServiceOptionNode | null>(null)

  useEffect(() => {
    if (!primarySlug) return

    let cancelled = false
    fetch('/api/services', { cache: 'no-store' })
      .then(res => res.json() as Promise<ServiceOptionNode[]>)
      .then(services => {
        if (!cancelled) setPrimaryService(findServiceBySlug(services, primarySlug))
      })
      .catch(() => {})

    return () => { cancelled = true }
  }, [primarySlug])

  const { tagTypes, loading: tagTypesLoading, error: tagTypesFetchError } =
    useServiceTagTypes(primaryService?.id ?? null)
  const tagTypesError = primaryService === null
    ? "Impossible de déterminer votre métier pour charger les tags disponibles."
    : tagTypesFetchError

  const { toast, showToast } = useToast()

  return (
    <>
      <PortfolioUploaderDashboard {...hook} maxPhotos={MAX_PHOTOS} />

      {hook.taggingQueue.length > 0 && (() => {
        const activeId = hook.taggingQueue[0]
        const activeImage = hook.photos.find(p => p.id === activeId)
        if (!activeImage) return null

        return (
          <PortfolioTaggingModal
            key={activeId}
            photoUrl={activeImage.url}
            serviceLabel={primaryService?.name ?? 'métier non défini'}
            tagTypes={tagTypes}
            tagTypesLoading={tagTypesLoading}
            tagTypesError={tagTypesError}
            initialTagValueIds={activeImage.tags.map(t => t.id)}
            queuePosition={hook.completedCount + 1}
            queueTotal={hook.completedCount + hook.taggingQueue.length}
            theme="dark"
            onConfirm={async (tagValueIds) => {
              await hook.confirmTagging(activeId, vendorId, tagValueIds)
              showToast('success', 'Toutes vos photos sont taguées. Activez votre visibilité Wedream quand vous êtes prêt à participer.')
            }}
            onCancel={async () => hook.cancelTagging(activeId)}
          />
        )
      })()}

      <Toast toast={toast} />
    </>
  )
}
