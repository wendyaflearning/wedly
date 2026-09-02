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
 * Le nombre de gestes que le rejeu de la file a rattachés au compte (WED-162),
 * transporté par l'URL d'entrée dans l'espace.
 *
 * Défini ici et non dans `QueueFlushBanner`, qui n'en est que le lecteur : trois
 * endroits connaissent ce nom — l'inscription qui l'écrit, la connexion qui
 * l'écrit aussi, la bannière qui le relit. Un renommage qui n'en toucherait que
 * deux ne casserait rien que TypeScript sache voir : le build passe, les tests
 * passent, et la bannière cesse simplement d'apparaître.
 */
export const QUEUE_FLUSH_COUNT_PARAM = 'coups-de-coeur'

/**
 * L'adresse d'entrée dans l'espace couple après un rejeu de file.
 *
 * Une fonction et pas seulement la constante ci-dessus : exporter le nom ne
 * suffit pas à le centraliser tant que chaque appelant peut réécrire son gabarit
 * à la main. Ici, c'est le seul chemin pour fabriquer cette adresse.
 *
 * Le premier onglet plutôt que `/mon-espace`, qui n'est qu'une redirection vers
 * lui : un aller-retour serveur de moins.
 *
 * ⚠️ `flushed <= 0` rend l'onglet nu — on ne promet pas au couple des coups de
 * cœur qu'il ne retrouverait pas. Ce cas ne dit surtout pas « voici où aller
 * quand il n'y a rien à annoncer » : `LoginForm` a sa propre destination de
 * repli, résolue depuis le rôle côté serveur, et c'est à lui de choisir entre
 * les deux AVANT d'appeler. Cette fonction construit une adresse, elle ne décide
 * pas d'une destination.
 */
export function buildCoupleSpaceEntryUrl(flushed: number): string {
  if (flushed <= 0) return COUPLE_SPACE_DEFAULT_TAB.href

  return `${COUPLE_SPACE_DEFAULT_TAB.href}?${QUEUE_FLUSH_COUNT_PARAM}=${flushed}`
}

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
