import type { ServiceOptionNode } from '@/lib/admin-types'

const API_URL = process.env.NEXT_PUBLIC_API_URL

/** Valeur de sous-catégorie exposée par GET /api/v1/services/{id}/tag-types. */
export type PublicTagValue = {
  id: string
  label: string
  vignetteUrl: string | null
}

export type PublicTagType = {
  id: string
  label: string
  isPrimary: boolean
  maxSelections: number | null
  tagValues: PublicTagValue[]
}

/**
 * L'API renvoie un arbre de services : le métier cherché peut être une racine
 * (lieu-de-reception) comme un enfant (creatrice-robe-de-mariee sous createurs).
 */
export function findServiceBySlug(
  nodes: ServiceOptionNode[],
  slug: string
): ServiceOptionNode | null {
  for (const node of nodes) {
    if (node.slug === slug) return node

    const match = findServiceBySlug(node.children, slug)
    if (match) return match
  }

  return null
}

export async function fetchServiceTagTypes(serviceId: string): Promise<PublicTagType[]> {
  if (!API_URL) return []

  const response = await fetch(`${API_URL}/api/v1/services/${serviceId}/tag-types`, {
    cache: 'no-store',
  }).catch(() => null)

  if (!response?.ok) return []

  return response.json() as Promise<PublicTagType[]>
}

/**
 * La sous-taxonomie couple = l'unique TagType marqué isPrimary du métier
 * (« Type de lieu » pour lieu-de-reception). Les TagTypes optionnels
 * (Univers, Caractéristiques…) servent au filtrage prestataire, pas à cet écran.
 */
export function findPrimaryTagType(tagTypes: PublicTagType[]): PublicTagType | null {
  return tagTypes.find((tagType) => tagType.isPrimary && tagType.tagValues.length > 0) ?? null
}
