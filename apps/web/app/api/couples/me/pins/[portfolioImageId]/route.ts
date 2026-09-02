import { NextRequest } from 'next/server'
import { forwardCoupleWrite } from '@/lib/coupleWriteProxy'

/**
 * Dé-épingler une photo depuis Wedream (WED-183 / US3b).
 *
 * Segment dynamique et non `DELETE` dans `../route.ts` : la photo est dans le
 * chemin côté Symfony comme côté client, et un handler posé sur le segment
 * parent ne répondrait qu'à `/api/couples/me/pins` — sans identifiant, donc
 * jamais appelé.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ portfolioImageId: string }> }
) {
  const { portfolioImageId } = await params

  return forwardCoupleWrite(
    request,
    `/api/v1/couples/me/pins/${encodeURIComponent(portfolioImageId)}`,
    'DELETE'
  )
}
