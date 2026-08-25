import {
  Camera,
  ClipboardCheck,
  Disc3,
  Flower2,
  Heart,
  Landmark,
  Palette,
  Scissors,
  Shirt,
  Sparkles,
  UtensilsCrossed,
  Video,
  type LucideIcon,
} from 'lucide-react'
import type { PortfolioImage } from '@/app/onboarding/[token]/types'

/** Nombre de cases de la grille galerie (phase 3 de la maquette). */
export const GALLERY_CELL_COUNT = 4

/**
 * Valeurs reprises telles quelles de la maquette Claude Design
 * « WedDream - Liste des demandes », variante « Activé — vide ». Aucun token
 * équivalent n'existe dans le @theme de globals.css aujourd'hui.
 */
export const JOURNEY_TRADE_CIRCLE_BG = '#EDE1D3'
export const JOURNEY_STYLE_GRADIENT = 'linear-gradient(135deg,#E7BC9E,#D9A382,#C68F5F)'
export const JOURNEY_PLACEHOLDER_BG =
  'repeating-linear-gradient(135deg, color-mix(in srgb, var(--color-bordeaux) 10%, transparent) 0 6px, color-mix(in srgb, var(--color-bordeaux) 4%, transparent) 6px 12px)'

export type VendorTrade = {
  label: string
  icon: LucideIcon
}

/**
 * Le métier affiché vient des services du prestataire (`vendorServices`), pas de
 * `vendorType` : cet enum ne distingue que freelance / lieu / traiteur / createurs,
 * un photographe et un DJ y sont tous deux `freelance`. Les slugs ci-dessous sont
 * les 11 services racines de ServiceFixtures.php.
 *
 * TODO(WED-121) : les branches `createurs` (5 services) et `animations` (~20 services)
 * n'ont pas d'icône validée par la maquette et retombent sur FALLBACK_TRADE_ICON.
 * Compléter le mapping quand UX-Wedly aura tranché — P3, après lancement.
 */
const VENDOR_TRADES: Record<string, VendorTrade> = {
  'photographe':           { label: 'Photographe',       icon: Camera },
  'traiteur':              { label: 'Traiteur',          icon: UtensilsCrossed },
  'fleuriste':             { label: 'Fleuriste',         icon: Flower2 },
  'dj':                    { label: 'DJ',                icon: Disc3 },
  'videaste':              { label: 'Vidéaste',          icon: Video },
  'decoration':            { label: 'Décoration',        icon: Sparkles },
  'maquillage':            { label: 'Maquillage',        icon: Palette },
  'coiffure':              { label: 'Coiffure',          icon: Scissors },
  'coordinatrice-mariage': { label: 'Coordinatrice',     icon: ClipboardCheck },
  'lieu-de-reception':     { label: 'Lieu de réception', icon: Landmark },
  'tailleur-homme':        { label: 'Tailleur homme',    icon: Shirt },
}

export const FALLBACK_TRADE_ICON: LucideIcon = Heart

/** `costumier-tailleur-sur-mesure` → `Costumier tailleur sur mesure`. */
export function humanizeServiceSlug(slug: string): string {
  return slug.replace(/-/g, ' ').replace(/^\w/, (char) => char.toUpperCase())
}

/**
 * Premier service reconnu du prestataire. À défaut, son premier service quel qu'il
 * soit, avec le libellé dérivé du slug et l'icône de repli.
 */
export function resolveVendorTrade(vendorServices: string[]): VendorTrade | null {
  for (const slug of vendorServices) {
    const known = VENDOR_TRADES[slug]
    if (known) return known
  }

  const [firstSlug] = vendorServices
  if (!firstSlug) return null

  return { label: humanizeServiceSlug(firstSlug), icon: FALLBACK_TRADE_ICON }
}

/**
 * Le tag « style » mis en avant, sans appel API supplémentaire.
 *
 * TODO(WED-121) : approximation assumée. `GET /api/v1/vendors/me/portfolio` renvoie
 * les tags à plat (`{ id, label }`) sans leur TagType, donc sans le drapeau
 * `isPrimary` — il faudrait deux appels de plus (`/api/services` puis
 * `/services/{id}/tag-types`) pour le résoudre exactement, ce qui casserait le CA4.
 * On retient le libellé le plus fréquent : chaque photo porte exactement un tag
 * primaire (PortfolioTaggingModal l'impose), tous issus du même TagType, alors que
 * les tags optionnels varient d'une photo à l'autre. Rembourser en exposant
 * `isPrimary` dans PortfolioImageResponseDto — ticket backend séparé.
 */
export function resolvePrimaryTagLabel(photos: PortfolioImage[]): string | null {
  const occurrences = new Map<string, number>()

  for (const photo of photos) {
    for (const tag of photo.tags) {
      occurrences.set(tag.label, (occurrences.get(tag.label) ?? 0) + 1)
    }
  }

  let bestLabel: string | null = null
  let bestCount = 0

  // Map conserve l'ordre d'insertion : à égalité, le premier tag rencontré gagne.
  for (const [label, count] of occurrences) {
    if (count > bestCount) {
      bestLabel = label
      bestCount = count
    }
  }

  return bestLabel
}

/**
 * next.config.ts n'autorise que res.cloudinary.com : une URL hors Cloudinary ferait
 * planter next/image. Même garde que SpecialtyCard.tsx, dupliquée volontairement
 * pour ne pas toucher un fichier hors du scope de ce ticket.
 */
export function isCloudinaryUrl(url: string): boolean {
  try {
    return new URL(url).hostname === 'res.cloudinary.com'
  } catch {
    return false
  }
}

/** Photos réellement publiées dans WedDream : couverture d'abord, puis sort_order. */
export function pickWedreamPhotos(photos: PortfolioImage[], max: number): PortfolioImage[] {
  return photos
    .filter((photo) => photo.is_visible_in_wedream && isCloudinaryUrl(photo.url))
    .sort((a, b) => {
      if (a.is_cover !== b.is_cover) return a.is_cover ? -1 : 1
      return a.sort_order - b.sort_order
    })
    .slice(0, max)
}
