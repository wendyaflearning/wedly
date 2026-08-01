'use client'
import { useCallback, useState } from 'react'
import type { PortfolioImage, TagOption } from '@/lib/admin-types'
import { compressPortfolioImage } from '@/lib/compressPortfolioImage'

export type PendingUpload = {
  localId: string
  file: File
  status: 'uploading' | 'error'
}

export interface UseAdminPortfolioUploadOptions {
  initialImages: PortfolioImage[]
}

export interface UseAdminPortfolioUploadReturn {
  images: PortfolioImage[]
  pendingUploads: PendingUpload[]
  addFiles: (files: FileList, ensureVendorId: () => Promise<string | null>) => Promise<void>
  retryUpload: (localId: string, vendorId: string) => Promise<void>
  deleteImage: (imageId: string, vendorId: string) => Promise<void>
  taggingQueue: string[]
  openTagging: (imageId: string) => void
  confirmTagging: (imageId: string, vendorId: string, styleIds: string[], specialtyIds: string[]) => Promise<void>
  cancelTagging: (imageId: string, vendorId: string) => Promise<void>
}

export function useAdminPortfolioUpload({
  initialImages,
}: UseAdminPortfolioUploadOptions): UseAdminPortfolioUploadReturn {
  const [images, setImages] = useState<PortfolioImage[]>(initialImages)
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([])
  const [taggingQueue, setTaggingQueue] = useState<string[]>([])

  const uploadOne = useCallback(async (localId: string, file: File, vendorId: string) => {
    setPendingUploads(prev => prev.map(p => (p.localId === localId ? { ...p, status: 'uploading' } : p)))

    try {
      const compressed = await compressPortfolioImage(file)

      const formData = new FormData()
      formData.append('photo', compressed)

      const response = await fetch(`/api/admin/vendors/${vendorId}/portfolio`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('upload_failed')
      }

      const data = (await response.json()) as { id: string; url: string }

      setImages(prev => [...prev, { id: data.id, url: data.url, isCover: false, styles: [], specialties: [] }])
      setTaggingQueue(prev => [...prev, data.id])
      setPendingUploads(prev => prev.filter(p => p.localId !== localId))
    } catch {
      setPendingUploads(prev => prev.map(p => (p.localId === localId ? { ...p, status: 'error' } : p)))
    }
  }, [])

  const addFiles = useCallback(async (files: FileList, ensureVendorId: () => Promise<string | null>) => {
    const entries: PendingUpload[] = Array.from(files).map(file => ({
      localId: crypto.randomUUID(),
      file,
      status: 'uploading',
    }))

    setPendingUploads(prev => [...prev, ...entries])

    const vendorId = await ensureVendorId()
    if (!vendorId) {
      const localIds = new Set(entries.map(e => e.localId))
      setPendingUploads(prev => prev.map(p => (localIds.has(p.localId) ? { ...p, status: 'error' } : p)))
      return
    }

    for (const entry of entries) {
      await uploadOne(entry.localId, entry.file, vendorId)
    }
  }, [uploadOne])

  const retryUpload = useCallback(async (localId: string, vendorId: string) => {
    const entry = pendingUploads.find(p => p.localId === localId)
    if (!entry) return

    await uploadOne(localId, entry.file, vendorId)
  }, [pendingUploads, uploadOne])

  const deleteImage = useCallback(async (imageId: string, vendorId: string) => {
    const snapshot = images
    setImages(prev => prev.filter(img => img.id !== imageId))

    try {
      const response = await fetch(`/api/admin/vendors/${vendorId}/portfolio/${imageId}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        throw new Error('delete_failed')
      }
    } catch (error) {
      setImages(snapshot)
      throw error
    }
  }, [images])

  const openTagging = useCallback((imageId: string) => {
    // La modale de tagging est un overlay plein écran : on ne peut jamais cliquer
    // une tuile existante pendant qu'une queue est déjà active, donc la queue est
    // toujours vide quand openTagging est appelé depuis un clic utilisateur.
    setTaggingQueue([imageId])
  }, [])

  const confirmTagging = useCallback(async (
    imageId: string,
    vendorId: string,
    styleIds: string[],
    specialtyIds: string[],
  ) => {
    const response = await fetch(`/api/admin/vendors/${vendorId}/portfolio/${imageId}/tags`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ styleIds, specialtyIds }),
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      throw new Error(typeof data.error === 'string' ? data.error : 'La mise à jour des tags a échoué.')
    }

    const data = (await response.json()) as { id: string; styles: TagOption[]; specialties: TagOption[] }

    setImages(prev => prev.map(img => (
      img.id === imageId ? { ...img, styles: data.styles, specialties: data.specialties } : img
    )))
    setTaggingQueue(prev => prev.filter(id => id !== imageId))
  }, [])

  const cancelTagging = useCallback(async (imageId: string, vendorId: string) => {
    const image = images.find(img => img.id === imageId)

    if (image && image.specialties.length === 0) {
      await deleteImage(imageId, vendorId)
    }

    setTaggingQueue(prev => prev.filter(id => id !== imageId))
  }, [images, deleteImage])

  return {
    images,
    pendingUploads,
    addFiles,
    retryUpload,
    deleteImage,
    taggingQueue,
    openTagging,
    confirmTagging,
    cancelTagging,
  }
}
