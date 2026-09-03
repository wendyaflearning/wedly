import { describe, expect, it } from 'vitest'
import {
  buildCoupleSpaceEntryUrl,
  COUPLE_SPACE_DEFAULT_TAB,
  COUPLE_SPACE_PATH,
  COUPLE_SPACE_TABS,
  coupleSpaceTabForPath,
  isCoupleSpaceTabPath,
  QUEUE_FLUSH_COUNT_PARAM,
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

describe('couple space entry url', () => {
  it('carries the replayed-action count into the default tab', () => {
    expect(buildCoupleSpaceEntryUrl(3)).toBe('/mon-espace/demandes?coups-de-coeur=3')
  })

  it('leaves the url bare when the replay attached nothing', () => {
    expect(buildCoupleSpaceEntryUrl(0)).toBe('/mon-espace/demandes')
    expect(buildCoupleSpaceEntryUrl(-1)).toBe('/mon-espace/demandes')
  })

  it('pins the parameter name QueueFlushBanner reads', () => {
    // Le seul garde-fou du renommage : la bannière lit ce nom depuis l'URL, un
    // canal que TypeScript ne suit pas. Sans cette assertion, le renommer fait
    // disparaître la confirmation « N coups de cœur » sans qu'un build échoue.
    expect(QUEUE_FLUSH_COUNT_PARAM).toBe('coups-de-coeur')
  })
})
