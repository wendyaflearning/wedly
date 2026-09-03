import type { ProfileCompletion } from './vendor'

/**
 * Le libellé et la destination de chaque section, pour l'indice affiché avant
 * soumission. Miroir de SECTION_LABELS côté API — en cas de 422, c'est la liste
 * renvoyée par le backend qui fait foi, pas celle-ci.
 */
const SECTIONS: { key: keyof ProfileCompletion; label: string; href: string }[] = [
  { key: 'bio', label: 'Biographie', href: '/dashboard/profile/bio' },
  { key: 'portfolio', label: 'Portfolio', href: '/dashboard/profile/portfolio' },
  { key: 'disponibilites', label: 'Disponibilités', href: '/dashboard/profile/booking-blocker' },
  { key: 'zone', label: "Zone d'intervention", href: '/dashboard/profile/pricing-zone' },
  { key: 'tarifs', label: 'Tarifs', href: '/dashboard/profile/pricing-zone' },
]

/**
 * On dérive l'état du bouton des valeurs renvoyées par l'API, sans jamais
 * réénumérer les sections attendues. Si le backend en ajoute ou en retire une,
 * le frontend suit tout seul — c'est ce qui rend un écart front/back impossible
 * (WED-190). Ne jamais remplacer par une liste de clés en dur.
 */
export function canPublishProfile(completion: ProfileCompletion): boolean {
  return Object.values(completion).every(Boolean)
}

/** Les sections encore à remplir, dans l'ordre du parcours profil. */
export function missingSections(
  completion: ProfileCompletion
): { label: string; href: string }[] {
  return SECTIONS.filter(({ key }) => completion[key] === false).map(({ label, href }) => ({
    label,
    href,
  }))
}
