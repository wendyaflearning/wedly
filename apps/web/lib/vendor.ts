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

export async function fetchVendorPortfolio(vendorId: string): Promise<PortfolioImage[]> {
  const cookieStore = await cookies()
  const token = cookieStore.get('jwt_token')
  if (!token) return []

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/vendors/${vendorId}/portfolio`,
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
