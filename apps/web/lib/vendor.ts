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
