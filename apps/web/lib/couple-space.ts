export const COUPLE_SPACE_PATH = '/mon-espace'

export const WEDDREAM_GALLERY_PATH = '/wedream-vendors'

export type CoupleSpaceTabKey = 'demandes' | 'epingles' | 'accompagnement'

export type CoupleSpaceTab = {
  key: CoupleSpaceTabKey
  href: string
  label: string
}

/** Tab order matches US-6.4 acceptance criteria. */
export const COUPLE_SPACE_TABS: CoupleSpaceTab[] = [
  { key: 'demandes', href: '/mon-espace/demandes', label: 'Demandes de contact' },
  { key: 'epingles', href: '/mon-espace/epingles', label: 'Épinglés' },
  { key: 'accompagnement', href: '/mon-espace/accompagnement', label: 'Accompagnement' },
]

export const COUPLE_SPACE_DEFAULT_TAB = COUPLE_SPACE_TABS[0]

/**
 * Le tab qui possède `pathname`, sous-routes comprises : l'Écran 4
 * (`/mon-espace/demandes/[leadId]`) appartient à « Demandes de contact ».
 * Le `/` du préfixe est délibéré : `/mon-espace/demandes-archivees` ne doit pas
 * matcher `demandes`.
 */
export function coupleSpaceTabForPath(pathname: string): CoupleSpaceTab | undefined {
  return COUPLE_SPACE_TABS.find(
    (tab) => pathname === tab.href || pathname.startsWith(`${tab.href}/`),
  )
}

export function isCoupleSpaceTabPath(pathname: string): boolean {
  return coupleSpaceTabForPath(pathname) !== undefined
}
