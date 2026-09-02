import { describe, expect, it } from 'vitest'
import { canPublishProfile, missingSections } from './vendor-publish'
import type { ProfileCompletion } from './vendor'

const COMPLETE: ProfileCompletion = {
  bio: true,
  portfolio: true,
  disponibilites: true,
  zone: true,
  tarifs: true,
}

describe('éligibilité à la publication', () => {
  it('autorise la publication quand toutes les sections sont remplies', () => {
    expect(canPublishProfile(COMPLETE)).toBe(true)
  })

  it('refuse dès qu’une seule section manque', () => {
    for (const key of Object.keys(COMPLETE) as (keyof ProfileCompletion)[]) {
      expect(canPublishProfile({ ...COMPLETE, [key]: false })).toBe(false)
    }
  })

  /**
   * Le bug WED-190 : le frontend jugeait sur une liste de sections qui n'était
   * plus celle du backend. On dérive des valeurs reçues, donc une section
   * ajoutée côté API est prise en compte sans toucher au frontend.
   */
  it('tient compte d’une section que le frontend ne connaît pas', () => {
    const withNewSection = { ...COMPLETE, verification: false } as unknown as ProfileCompletion

    expect(canPublishProfile(withNewSection)).toBe(false)
  })

  it('ne réintroduit pas les styles dans le calcul', () => {
    const withoutStyles = { ...COMPLETE, styles: false } as unknown as ProfileCompletion

    // `styles` ne fait pas partie du contrat : s'il réapparaissait dans la
    // réponse, il bloquerait à nouveau la publication — d'où ce garde-fou.
    expect(Object.keys(COMPLETE)).not.toContain('styles')
    expect(canPublishProfile(withoutStyles)).toBe(false)
  })
})

describe('sections manquantes', () => {
  it('ne renvoie rien sur un profil complet', () => {
    expect(missingSections(COMPLETE)).toEqual([])
  })

  it('nomme la section manquante et où la remplir', () => {
    expect(missingSections({ ...COMPLETE, bio: false })).toEqual([
      { label: 'Biographie', href: '/dashboard/profile/bio' },
    ])
  })

  it('renvoie zone et tarifs vers la même page, qui porte les deux', () => {
    const missing = missingSections({ ...COMPLETE, zone: false, tarifs: false })

    expect(missing.map((s) => s.label)).toEqual(["Zone d'intervention", 'Tarifs'])
    expect(new Set(missing.map((s) => s.href))).toEqual(new Set(['/dashboard/profile/pricing-zone']))
  })
})
