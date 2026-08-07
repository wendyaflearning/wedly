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
