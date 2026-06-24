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
  photos:      PortfolioImage[]
  addPhoto:    (file: File, isCover?: boolean) => Promise<PortfolioImage>
  deletePhoto: (photoId: string) => Promise<void>
  setCover:    (photoId: string) => Promise<void>
  isUploading: boolean
  count:       number
  isFull:      boolean
}

export function usePortfolioUpload({
  uploadFn,
  deleteFn,
  setCoverFn,
  initialPhotos,
  maxPhotos,
}: UsePortfolioUploadOptions): UsePortfolioUploadReturn {
  const [photos, setPhotos]           = useState<PortfolioImage[]>(initialPhotos)
  const [uploadCount, setUploadCount] = useState(0)

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

  return {
    photos,
    addPhoto,
    deletePhoto,
    setCover,
    isUploading: uploadCount > 0,
    count:       photos.length,
    isFull:      photos.length >= maxPhotos,
  }
}
