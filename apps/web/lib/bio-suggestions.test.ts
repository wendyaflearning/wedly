import { describe, it, expect } from 'vitest'
import { getSuggestionsForVendorServices } from './bio-suggestions'

describe('getSuggestionsForVendorServices', () => {
  it('retourne les suggestions Photographe pour le slug photographe', () => {
    const result = getSuggestionsForVendorServices(['photographe'])
    expect(result.style).toContain('documentaire')
  })

  it('retourne les suggestions Traiteur pour le slug traiteur', () => {
    const result = getSuggestionsForVendorServices(['traiteur'])
    expect(result.style).toContain('cuisine')
  })

  it('retourne les suggestions Lieu pour le slug lieu-de-reception', () => {
    const result = getSuggestionsForVendorServices(['lieu-de-reception'])
    expect(result.unique).toContain('week-end')
  })

  it('retourne les suggestions Createur pour le slug createurs', () => {
    const result = getSuggestionsForVendorServices(['createurs'])
    expect(result.style).toContain('silhouettes')
  })

  it('retourne les suggestions Createur pour le slug fleuriste', () => {
    const result = getSuggestionsForVendorServices(['fleuriste'])
    expect(result.style).toContain('silhouettes')
  })

  it('retourne les suggestions Animateur pour le slug animations', () => {
    const result = getSuggestionsForVendorServices(['animations'])
    expect(result.style).toContain('salle')
  })

  it('retourne Photographe par défaut si aucun slug ne matche', () => {
    const result = getSuggestionsForVendorServices(['slug-inconnu'])
    expect(result.style).toContain('documentaire')
  })

  it('retourne Photographe par défaut pour un tableau vide', () => {
    const result = getSuggestionsForVendorServices([])
    expect(result.style).toContain('documentaire')
  })

  it('prend le premier slug qui matche quand plusieurs slugs sont fournis', () => {
    const result = getSuggestionsForVendorServices(['traiteur', 'photographe'])
    expect(result.style).toContain('cuisine')
  })

  it('ignore la casse et les espaces dans les slugs', () => {
    const result = getSuggestionsForVendorServices([' Traiteur '])
    expect(result.style).toContain('cuisine')
  })

  it('le total des 3 textes combinés ne dépasse pas 300 caractères', () => {
    const slugs = ['photographe', 'traiteur', 'lieu-de-reception', 'createurs', 'animations', 'fleuriste']
    for (const slug of slugs) {
      const { style, mariage, unique } = getSuggestionsForVendorServices([slug])
      const total = style.length + 1 + mariage.length + 1 + unique.length
      expect(total, `${slug}: total ${total} dépasse 300`).toBeLessThanOrEqual(300)
    }
  })
})
