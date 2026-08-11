'use client'
import { useState, useCallback } from 'react'
import type { PortfolioImage } from '@/app/onboarding/[token]/types'
import { compressPortfolioImage } from '@/lib/compressPortfolioImage'

export interface UsePortfolioUploadOptions {
  uploadFn:      (file: File, isCover?: boolean) => Promise<PortfolioImage>
  deleteFn:      (photoId: string) => Promise<void>
  setCoverFn:    (photoId: string) => Promise<void>
  initialPhotos: PortfolioImage[]
  maxPhotos:     number
}

export interface UsePortfolioUploadReturn {
  photos:         PortfolioImage[]
  addPhoto:       (file: File, isCover?: boolean) => Promise<PortfolioImage>
  deletePhoto:    (photoId: string) => Promise<void>
  setCover:       (photoId: string) => Promise<void>
  isUploading:    boolean
  count:          number
  isFull:         boolean
  taggingQueue:   string[]
  openTagging:    (photoId: string) => void
  confirmTagging: (photoId: string, vendorId: string, tagValueIds: string[]) => Promise<void>
  cancelTagging:  (photoId: string) => void
  completedCount: number
}

export function usePortfolioUpload({
  uploadFn,
  deleteFn,
  setCoverFn,
  initialPhotos,
  maxPhotos,
}: UsePortfolioUploadOptions): UsePortfolioUploadReturn {
  const [photos, setPhotos]             = useState<PortfolioImage[]>(initialPhotos)
  const [uploadCount, setUploadCount]   = useState(0)
  const [taggingQueue, setTaggingQueue] = useState<string[]>([])
  const [completedCount, setCompletedCount] = useState(0)

  const addPhoto = useCallback(async (file: File, isCover?: boolean): Promise<PortfolioImage> => {
    setUploadCount(c => c + 1)
    try {
      const compressed = await compressPortfolioImage(file)
      const newPhoto   = await uploadFn(compressed, isCover)
      setPhotos(prev => {
        const base = newPhoto.is_cover ? prev.map(p => ({ ...p, is_cover: false })) : prev
        return [...base, newPhoto]
      })
      return newPhoto
    } finally {
      setUploadCount(c => c - 1)
    }
  }, [uploadFn])

  const deletePhoto = useCallback(async (photoId: string) => {
    const snapshot = photos
    setPhotos(p => p.filter(ph => ph.id !== photoId))
    try {
      await deleteFn(photoId)
    } catch {
      setPhotos(snapshot)
      throw new Error('delete_failed')
    }
  }, [photos, deleteFn])

  const setCover = useCallback(async (photoId: string) => {
    const snapshot = photos
    setPhotos(p => p.map(ph => ({ ...ph, is_cover: ph.id === photoId })))
    try {
      await setCoverFn(photoId)
    } catch {
      setPhotos(snapshot)
      throw new Error('cover_failed')
    }
  }, [photos, setCoverFn])

  const openTagging = useCallback((photoId: string) => {
    // Un clic sur une pastille ne concerne toujours qu'une seule photo déjà
    // existante dans le portfolio — jamais un lot, contrairement au flux admin.
    setTaggingQueue([photoId])
    setCompletedCount(0)
  }, [])

  const confirmTagging = useCallback(async (
    photoId: string,
    vendorId: string,
    tagValueIds: string[],
  ) => {
    const response = await fetch(`/api/vendor/${vendorId}/portfolio/${photoId}/tags`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tagValueIds }),
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      throw new Error(typeof data.error === 'string' ? data.error : 'La mise à jour des tags a échoué.')
    }

    // Cette route renvoie du camelCase (isVisibleInWedream) alors que le GET qui
    // alimente l'état initial renvoie du snake_case (is_visible_in_wedream) — les
    // deux endpoints ne partagent pas le même DTO côté backend.
    const data = (await response.json()) as { id: string; tags: PortfolioImage['tags']; isVisibleInWedream: boolean }

    setPhotos(prev => prev.map(ph => (
      ph.id === photoId ? { ...ph, tags: data.tags, is_visible_in_wedream: data.isVisibleInWedream } : ph
    )))
    setTaggingQueue(prev => prev.filter(id => id !== photoId))
    setCompletedCount(c => c + 1)
  }, [])

  const cancelTagging = useCallback((photoId: string) => {
    // Contrairement au flux admin, une photo entrant dans la queue est toujours
    // déjà persistée dans le portfolio : annuler ferme juste la modale, on ne
    // supprime jamais la photo.
    setTaggingQueue(prev => prev.filter(id => id !== photoId))
  }, [])

  return {
    photos,
    addPhoto,
    deletePhoto,
    setCover,
    isUploading: uploadCount > 0,
    count:       photos.length,
    isFull:      photos.length >= maxPhotos,
    taggingQueue,
    openTagging,
    confirmTagging,
    cancelTagging,
    completedCount,
  }
}
