import { describe, expect, it } from 'vitest'
import {
  COUPLE_SPACE_DEFAULT_TAB,
  COUPLE_SPACE_PATH,
  COUPLE_SPACE_TABS,
  coupleSpaceTabForPath,
  isCoupleSpaceTabPath,
} from './couple-space'

describe('couple space routes', () => {
  it('keeps the three US-6.4 tabs in the documented order', () => {
    expect(COUPLE_SPACE_TABS.map((tab) => tab.label)).toEqual([
      'Demandes de contact',
      'Épinglés',
      'Accompagnement',
    ])
  })

  it('defaults to demandes de contact', () => {
    expect(COUPLE_SPACE_DEFAULT_TAB.key).toBe('demandes')
    expect(COUPLE_SPACE_DEFAULT_TAB.href).toBe('/mon-espace/demandes')
  })

  it('recognises tab paths under the shell root', () => {
    expect(isCoupleSpaceTabPath('/mon-espace/epingles')).toBe(true)
    expect(isCoupleSpaceTabPath('/mon-espace')).toBe(false)
    expect(coupleSpaceTabForPath('/mon-espace/accompagnement')?.key).toBe('accompagnement')
  })

  it('keeps the owning tab on nested routes', () => {
    // L'Écran 4 vit sous l'onglet « Demandes de contact » : sans ça, la barre
    // d'onglets est entièrement grise sur /mon-espace/demandes/[leadId].
    expect(isCoupleSpaceTabPath('/mon-espace/demandes/abc-123')).toBe(true)
    expect(coupleSpaceTabForPath('/mon-espace/demandes/abc-123')?.key).toBe('demandes')
  })

  it('does not match a sibling route that merely shares a prefix', () => {
    expect(isCoupleSpaceTabPath('/mon-espace/demandes-archivees')).toBe(false)
    expect(coupleSpaceTabForPath('/mon-espace/demandes-archivees')).toBeUndefined()
  })

  it('anchors the shell on /mon-espace', () => {
    expect(COUPLE_SPACE_PATH).toBe('/mon-espace')
  })
})
