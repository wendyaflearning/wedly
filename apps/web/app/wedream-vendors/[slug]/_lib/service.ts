import { fetchServiceTree } from '@/lib/admin'
import { fetchServiceTagTypes, findPrimaryTagType, findServiceBySlug } from '@/lib/specialties'

/**
 * Résout le service d'un slug et son TagType primaire (la sous-taxonomie couple).
 *
 * Vit ici plutôt que dans lib/specialties.ts : fetchServiceTree tire next/headers,
 * et contaminer specialties.ts avec du server-only casserait tout Client Component
 * qui viendrait y importer une des fonctions pures.
 */
export async function getService(slug: string) {
  const tree = await fetchServiceTree()
  const service = findServiceBySlug(tree, slug)
  if (!service) return null

  const primary = findPrimaryTagType(await fetchServiceTagTypes(service.id))

  return { service, primary }
}
