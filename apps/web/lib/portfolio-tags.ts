export type TagValueOption = {
  id: string
  label: string
}

export type TagType = {
  id: string
  label: string
  isPrimary: boolean
  maxSelections: number | null
  tagValues: TagValueOption[]
}

/**
 * Le tagging n'est exploitable que s'il existe un axe principal proposant au
 * moins une valeur : la modale n'active son bouton de validation qu'une fois un
 * tag primaire choisi. Un service sans aucun TagType, ou dont le TagType
 * primaire n'a aucune TagValue active, produit donc une modale sans issue.
 */
export function hasUsablePrimaryTagType(tagTypes: TagType[]): boolean {
  const primary = tagTypes.find(t => t.isPrimary)
  return primary !== undefined && primary.tagValues.length > 0
}

export function classifyTagSelection(
  tagTypes: TagType[],
  tagValueIds: string[]
): { primaryId: string | null; optionalIds: string[] } {
  let primaryId: string | null = null
  const optionalIds: string[] = []

  for (const tagValueId of tagValueIds) {
    const tagType = tagTypes.find(t => t.tagValues.some(v => v.id === tagValueId))
    if (!tagType) continue

    if (tagType.isPrimary) {
      primaryId = tagValueId
    } else {
      optionalIds.push(tagValueId)
    }
  }

  return { primaryId, optionalIds }
}

export function mergeTagSelection(
  primaryId: string | null,
  optionalIds: string[]
): string[] {
  return [primaryId, ...optionalIds].filter((id): id is string => id !== null)
}
