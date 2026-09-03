'use client'

import { useState } from 'react'
import type { PortfolioImage } from '@/lib/admin-types'
import { hasUsablePrimaryTagType } from '@/lib/portfolio-tags'
import { useServiceTagTypes } from '@/hooks/useServiceTagTypes'
import { PortfolioTaggingModal } from '@/components/portfolio/PortfolioTaggingModal'
import { PortfolioGallery } from './PortfolioGallery'

interface PortfolioTagViewerProps {
  images: PortfolioImage[]
  /** Métier principal du prestataire — sert à charger la taxonomie de tags. */
  serviceId: string | null
  serviceLabel: string
}

/**
 * Fiche prestataire admin : rend la galerie portfolio et, au clic sur une photo
 * taguée, ouvre `PortfolioTaggingModal` en lecture seule pour montrer le libellé
 * du tag primaire et des tags optionnels. Aucune écriture — pur affichage.
 *
 * Photo non taguée ou taxonomie du métier inexploitable → la galerie retombe sur
 * sa lightbox, comportement inchangé.
 */
export function PortfolioTagViewer({ images, serviceId, serviceLabel }: PortfolioTagViewerProps) {
  const { tagTypes, loading, error } = useServiceTagTypes(serviceId)
  const [activeImageId, setActiveImageId] = useState<string | null>(null)

  // Même garde que le tagging côté prestataire : sans axe principal proposant au
  // moins une valeur, la modale ne rendrait rien. On n'arme alors pas le clic.
  const tagDetailAvailable = !loading && !error && hasUsablePrimaryTagType(tagTypes)

  const activeImage =
    activeImageId === null ? null : images.find((image) => image.id === activeImageId) ?? null

  return (
    <>
      <PortfolioGallery
        images={images}
        onTileClick={tagDetailAvailable ? (imageId) => setActiveImageId(imageId) : undefined}
      />

      {activeImage && (
        <PortfolioTaggingModal
          key={activeImage.id}
          readOnly
          photoUrl={activeImage.url}
          serviceLabel={serviceLabel}
          tagTypes={tagTypes}
          initialTagValueIds={activeImage.tags.map((tag) => tag.id)}
          queuePosition={1}
          queueTotal={1}
          onClose={() => setActiveImageId(null)}
        />
      )}
    </>
  )
}
