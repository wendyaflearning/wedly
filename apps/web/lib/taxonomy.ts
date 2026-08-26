import type { ServiceOptionNode } from '@/lib/admin-types'

export type LeafService = {
  id: string
  name: string
  slug?: string
  category?: string
}

export function flattenLeafServices(nodes: ServiceOptionNode[]): LeafService[] {
  const result: LeafService[] = []

  for (const node of nodes) {
    if (node.children.length === 0) {
      result.push({ id: node.id, name: node.name, slug: node.slug, category: node.category })
    } else {
      result.push(...flattenLeafServices(node.children))
    }
  }

  return result
}
