import { cache } from 'react'
import { cookies } from 'next/headers'
import type { PortfolioImage } from '@/app/onboarding/[token]/types'

export type VendorDashboard = {
  id: string
  firstName: string
  lastName?: string
  email?: string
  status: 'pending' | 'under_review' | 'active' | 'rejected'
  createdAt: string
  vendorType: string
  bio?: string | null
  vendorServices?: string[]
  consent_granted: boolean | null
  sections_status: {
    general_info: boolean
    pricing_zone: boolean
    experiences: boolean
    matching_consent: boolean
    bio: boolean
    portfolio: boolean
    booking_blocker: boolean
  }
  portfolio_photos_count: number
  portfolio_has_cover: boolean
  booking_blockers_count: number
  booking_blockers_updated_at: string | null
  wedream_enabled: boolean
  is_published: boolean
}

export const fetchVendorDashboard = cache(async (): Promise<VendorDashboard | null> => {
  const cookieStore = await cookies()
  const token = cookieStore.get('jwt_token')
  if (!token) return null

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/vendors/me/dashboard`,
      {
        headers: { Cookie: `jwt_token=${token.value}` },
        cache: 'no-store',
      }
    )
    if (!res.ok) return null
    return res.json() as Promise<VendorDashboard>
  } catch {
    return null
  }
})

/**
 * Les sections qui conditionnent la publication, telles que renvoyées par
 * `GET /vendors/me/preview`. Le backend les produit avec `checkForPublish()` :
 * cette forme doit rester le miroir exact de sa sortie, `styles` exclus (WED-19).
 */
export type ProfileCompletion = {
  bio: boolean
  portfolio: boolean
  disponibilites: boolean
  zone: boolean
  tarifs: boolean
}

export type VendorPreview = {
  id: string
  brand_name: string
  bio: string | null
  description: string | null
  vendor_type: string
  services: string[]
  styles: string[]
  portfolio_images: { id: string; url: string; is_cover: boolean; sort_order: number }[]
  booking_blockers: { id: string; date_start: string; date_end: string }[]
  zones: { id: string; name: string }[]
  price_min_cents: number
  price_max_cents: number
  price_type: 'per_service' | 'per_person' | 'per_hour'
  completion: ProfileCompletion
  is_published: boolean
}

export const fetchVendorPreview = cache(async (): Promise<VendorPreview | null> => {
  const cookieStore = await cookies()
  const token = cookieStore.get('jwt_token')
  if (!token) return null

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/vendors/me/preview`,
      {
        headers: { Cookie: `jwt_token=${token.value}` },
        cache: 'no-store',
      }
    )
    if (!res.ok) return null
    return res.json() as Promise<VendorPreview>
  } catch {
    return null
  }
})

export async function fetchVendorPortfolio(): Promise<PortfolioImage[]> {
  const cookieStore = await cookies()
  const token = cookieStore.get('jwt_token')
  if (!token) return []

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/vendors/me/portfolio`,
      {
        headers: { Cookie: `jwt_token=${token.value}` },
        cache: 'no-store',
      }
    )
    if (!res.ok) return []
    return res.json() as Promise<PortfolioImage[]>
  } catch {
    return []
  }
}

/**
 * Les demandes de mise en relation reçues par le prestataire (WED-52).
 *
 * Le front ne masque rien : il lit la forme que le backend lui envoie. Avant
 * décision, l'objet n'a structurellement aucune propriété où le nom, l'e-mail ou
 * le téléphone du couple pourraient passer — la garantie est dans le DTO
 * (`MaskedVendorProviderLeadResponseDto`), pas dans une condition d'affichage.
 */
type BaseVendorProviderLead = {
  id: string
  status: VendorProviderLeadStatus
  firstName: string
  /** `YYYY-MM-DD` — la date du mariage, pas celle de la demande. */
  weddingDate: string
  guestCount: number
  weddingBudgetCents: number
  category: string | null
  specialtyTags: string[]
  /** ISO 8601 — quand le couple a envoyé la demande. */
  requestedAt: string
  /** La photo du portfolio d'où part la demande. Absente sur les leads anciens. */
  photoUrl: string | null
}

/**
 * `closed` et `unavailable` ne sont écrits par rien aujourd'hui — ils restent
 * dans l'enum backend pour les lignes historiques. `confirmed`/`contacted` sont
 * des acceptations d'avant WED-131.
 */
export type VendorProviderLeadStatus =
  | 'pending'
  | 'accepted'
  | 'refused'
  | 'closed'
  | 'confirmed'
  | 'contacted'
  | 'unavailable'

/** Avant décision — aucune coordonnée. */
export type MaskedVendorProviderLead = BaseVendorProviderLead

/** Après acceptation — les trois lignes que la forme masquée retient. */
export type UnlockedVendorProviderLead = BaseVendorProviderLead & {
  lastName: string | null
  email: string
  phone: string | null
}

export type VendorProviderLead = MaskedVendorProviderLead | UnlockedVendorProviderLead

/**
 * Le garde de type vit dans `vendor-leads.ts` : c'est une valeur, et ce
 * module-ci importe `next/headers`, donc un Client Component ne peut pas le
 * charger. Les *types* ci-dessus restent importables partout (`import type`
 * est effacé à la compilation).
 */

/**
 * `null` distingue « lecture impossible » de « aucune demande » (`[]`), comme
 * `fetchVendorDashboard` distingue déjà les deux. Le tri vient du backend
 * (`ProviderLeadRepository::findByVendor`, plus récent d'abord) : aucun tri ici.
 */
export const fetchVendorProviderLeads = cache(async (): Promise<VendorProviderLead[] | null> => {
  const cookieStore = await cookies()
  const token = cookieStore.get('jwt_token')
  if (!token) return null

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/vendors/me/provider-leads`,
      {
        headers: { Cookie: `jwt_token=${token.value}` },
        cache: 'no-store',
      }
    )
    if (!res.ok) return null

    const body = (await res.json()) as { items?: VendorProviderLead[] }
    return Array.isArray(body.items) ? body.items : []
  } catch {
    return null
  }
})
