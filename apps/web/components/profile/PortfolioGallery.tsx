'use client'

import { useState } from 'react'
import Image from 'next/image'
import { AlertTriangle, ChevronLeft, ChevronRight, Loader2, Plus, X } from 'lucide-react'
import type { PortfolioImage } from '@/lib/admin-types'

type PendingUploadTile = {
  localId: string
  previewUrl: string
  status: 'uploading' | 'error'
}

type EditableProps = {
  onAddFiles: (files: FileList) => void
  onDelete: (imageId: string) => void
  onTileClick: (imageId: string) => void
  pendingUploads: PendingUploadTile[]
  onRetry: (localId: string) => void
}

export function PortfolioGallery({
  images,
  editable,
}: {
  images: PortfolioImage[]
  editable?: EditableProps
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  if (images.length === 0 && !editable) {
    return <p className="text-sm font-semibold text-texte/50">Non renseigné</p>
  }

  const activeImage = activeIndex === null ? null : images[activeIndex]

  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {images.map((image, index) => (
          <div
            key={image.id}
            className="relative aspect-[4/3] overflow-hidden rounded-lg border border-[#eaded2] bg-[#f7f3ee]"
          >
            <button
              type="button"
              onClick={() => {
                if (editable) {
                  editable.onTileClick(image.id)
                } else {
                  setActiveIndex(index)
                }
              }}
              className="absolute inset-0"
            >
              <Image src={image.url} alt="" fill sizes="(min-width: 768px) 25vw, 50vw" className="object-cover" unoptimized />
              {image.isCover && (
                <span className="absolute left-2 top-2 rounded-md bg-bordeaux px-2 py-1 text-xs font-semibold text-creme">
                  Couverture
                </span>
              )}
            </button>
            {editable && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  editable.onDelete(image.id)
                }}
                aria-label="Supprimer"
                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-texte/60 text-creme hover:bg-texte/80"
              >
                <X size={14} aria-hidden="true" />
              </button>
            )}
          </div>
        ))}

        {editable && (
          <>
            {editable.pendingUploads.map((pending) => (
              <div
                key={pending.localId}
                className="relative aspect-[4/3] overflow-hidden rounded-lg border border-[#eaded2] bg-[#f7f3ee]"
              >
                <Image src={pending.previewUrl} alt="" fill sizes="(min-width: 768px) 25vw, 50vw" className="object-cover" unoptimized />
                {pending.status === 'uploading' ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-texte/40">
                    <Loader2 size={24} className="animate-spin text-creme" aria-hidden="true" />
                  </div>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-texte/60">
                    <AlertTriangle size={18} className="text-creme" aria-hidden="true" />
                    <button
                      type="button"
                      onClick={() => editable.onRetry(pending.localId)}
                      className="rounded-md bg-creme px-2 py-1 text-[11px] font-semibold text-texte"
                    >
                      Réessayer
                    </button>
                  </div>
                )}
              </div>
            ))}

            <label className="relative flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-[#eaded2] bg-[#f7f3ee] text-texte/50 hover:bg-[#f0e9df]">
              <Plus size={22} aria-hidden="true" />
              <span className="text-xs font-semibold">Ajouter</span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    editable.onAddFiles(e.target.files)
                  }
                  e.target.value = ''
                }}
              />
            </label>
          </>
        )}
      </div>

      {activeImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-8">
          <button
            type="button"
            onClick={() => setActiveIndex(null)}
            className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-md bg-white text-texte"
            aria-label="Fermer"
          >
            <X size={20} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setActiveIndex((index) => (index === null ? null : (index + images.length - 1) % images.length))}
            className="absolute left-5 flex h-10 w-10 items-center justify-center rounded-md bg-white text-texte"
            aria-label="Image précédente"
          >
            <ChevronLeft size={22} aria-hidden="true" />
          </button>
          <div className="relative h-full max-h-[82vh] w-full max-w-5xl">
            <Image src={activeImage.url} alt="" fill sizes="90vw" className="rounded-lg object-contain" unoptimized />
          </div>
          <button
            type="button"
            onClick={() => setActiveIndex((index) => (index === null ? null : (index + 1) % images.length))}
            className="absolute right-5 flex h-10 w-10 items-center justify-center rounded-md bg-white text-texte"
            aria-label="Image suivante"
          >
            <ChevronRight size={22} aria-hidden="true" />
          </button>
        </div>
      )}
    </>
  )
}
