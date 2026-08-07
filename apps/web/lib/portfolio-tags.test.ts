import { describe, it, expect } from 'vitest'
import { classifyTagSelection, mergeTagSelection, type TagType } from './portfolio-tags'

const tagTypes: TagType[] = [
  {
    id: 'type-primary',
    label: 'Ambiance',
    isPrimary: true,
    maxSelections: 1,
    tagValues: [
      { id: 'value-boheme', label: 'Bohème' },
      { id: 'value-chic', label: 'Chic' },
    ],
  },
  {
    id: 'type-optional',
    label: 'Style',
    isPrimary: false,
    maxSelections: null,
    tagValues: [
      { id: 'value-exterieur', label: 'Extérieur' },
      { id: 'value-interieur', label: 'Intérieur' },
    ],
  },
]

describe('classifyTagSelection', () => {
  it('range un tagValueId primary dans primaryId', () => {
    const result = classifyTagSelection(tagTypes, ['value-boheme'])
    expect(result).toEqual({ primaryId: 'value-boheme', optionalIds: [] })
  })

  it('range un tagValueId non-primary dans optionalIds', () => {
    const result = classifyTagSelection(tagTypes, ['value-exterieur'])
    expect(result).toEqual({ primaryId: null, optionalIds: ['value-exterieur'] })
  })

  it('sépare correctement un mélange primary + optional', () => {
    const result = classifyTagSelection(tagTypes, ['value-exterieur', 'value-boheme', 'value-interieur'])
    expect(result).toEqual({ primaryId: 'value-boheme', optionalIds: ['value-exterieur', 'value-interieur'] })
  })

  it('ignore un tagValueId inconnu', () => {
    const result = classifyTagSelection(tagTypes, ['value-inconnu'])
    expect(result).toEqual({ primaryId: null, optionalIds: [] })
  })

  it('retourne un résultat vide pour un tableau vide', () => {
    const result = classifyTagSelection(tagTypes, [])
    expect(result).toEqual({ primaryId: null, optionalIds: [] })
  })

  it('retourne un résultat vide pour un tagTypes vide', () => {
    const result = classifyTagSelection([], ['value-boheme'])
    expect(result).toEqual({ primaryId: null, optionalIds: [] })
  })
})

describe('mergeTagSelection', () => {
  it('retourne un tableau vide si primaryId est null et optionalIds vide', () => {
    expect(mergeTagSelection(null, [])).toEqual([])
  })

  it('retourne uniquement le primaryId si optionalIds est vide', () => {
    expect(mergeTagSelection('value-boheme', [])).toEqual(['value-boheme'])
  })

  it('retourne uniquement optionalIds si primaryId est null', () => {
    expect(mergeTagSelection(null, ['value-exterieur', 'value-interieur'])).toEqual([
      'value-exterieur',
      'value-interieur',
    ])
  })

  it('combine primaryId et optionalIds, primary en premier', () => {
    expect(mergeTagSelection('value-boheme', ['value-exterieur', 'value-interieur'])).toEqual([
      'value-boheme',
      'value-exterieur',
      'value-interieur',
    ])
  })
})
