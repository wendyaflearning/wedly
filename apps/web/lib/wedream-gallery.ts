const API_URL = process.env.NEXT_PUBLIC_API_URL

/** Photo publique exposée par GET /api/v1/tag-values/{id}/portfolio-images. */
export type PublicPortfolioImage = {
  id: string
  url: string
  /** Clé = label du TagType, valeurs = labels des TagValue de la photo. */
  tagsByGroup: Record<string, string[]>
  /**
   * L'identifiant de corrélation du prestataire (WED-195, PROVIDER-LEAD-009) :
   * un UUID opaque, jamais un nom. C'est la seule chose qui dit que deux photos
   * viennent du même prestataire — sans lui, la galerie ne peut pas reconnaître
   * une demande de mise en relation déjà partie depuis une autre photo.
   */
  vendorId: string
}

export type PortfolioImagesPage = {
  items: PublicPortfolioImage[]
  nextCursor: string | null
  total: number
}

const EMPTY_PAGE: PortfolioImagesPage = { items: [], nextCursor: null, total: 0 }

export async function fetchTagValuePortfolioImages(
  tagValueId: string,
  params?: { limit?: number; cursor?: string }
): Promise<PortfolioImagesPage> {
  if (!API_URL) return EMPTY_PAGE

  const query = new URLSearchParams()
  if (params?.limit !== undefined) query.set('limit', String(params.limit))
  if (params?.cursor) query.set('cursor', params.cursor)
  const queryString = query.toString()

  const response = await fetch(
    `${API_URL}/api/v1/tag-values/${tagValueId}/portfolio-images${queryString ? `?${queryString}` : ''}`,
    { cache: 'no-store' }
  ).catch(() => null)

  if (!response?.ok) return EMPTY_PAGE

  return response.json() as Promise<PortfolioImagesPage>
}
