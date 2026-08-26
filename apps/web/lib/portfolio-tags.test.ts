import { describe, it, expect } from 'vitest'
import { classifyTagSelection, hasUsablePrimaryTagType, mergeTagSelection, type TagType } from './portfolio-tags'

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

describe('hasUsablePrimaryTagType', () => {
  it('est vrai quand l\u2019axe principal propose au moins une valeur', () => {
    expect(hasUsablePrimaryTagType(tagTypes)).toBe(true)
  })

  it('est faux quand le service n\u2019a aucun TagType', () => {
    expect(hasUsablePrimaryTagType([])).toBe(false)
  })

  it('est faux quand l\u2019axe principal existe mais n\u2019a aucune valeur', () => {
    // Cas constaté sur le métier « live sketching » : le TagType primaire
    // « Spécialités » existe et est actif, mais sans aucune TagValue — la modale
    // s\u2019ouvrait alors sur un axe vide, bouton de validation à jamais désactivé.
    const emptyPrimary: TagType[] = [
      { id: 'type-primary', label: 'Spécialités', isPrimary: true, maxSelections: 1, tagValues: [] },
      {
        id: 'type-optional',
        label: 'Ambiance',
        isPrimary: false,
        maxSelections: null,
        tagValues: [{ id: 'value-vibrant', label: 'Moment vibrant' }],
      },
    ]
    expect(hasUsablePrimaryTagType(emptyPrimary)).toBe(false)
  })

  it('est faux quand il n\u2019existe que des axes optionnels', () => {
    const optionalOnly: TagType[] = [
      {
        id: 'type-optional',
        label: 'Ambiance',
        isPrimary: false,
        maxSelections: null,
        tagValues: [{ id: 'value-vibrant', label: 'Moment vibrant' }],
      },
    ]
    expect(hasUsablePrimaryTagType(optionalOnly)).toBe(false)
  })
})
