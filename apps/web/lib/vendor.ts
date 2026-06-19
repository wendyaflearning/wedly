import { cookies } from 'next/headers'

export type VendorDashboard = {
  firstName: string
  lastName?: string
  email?: string
  createdAt: string
  steps: {
    availability: boolean
    portfolio: boolean
    bio: boolean
    published: boolean
  }
}

export async function fetchVendorDashboard(): Promise<VendorDashboard | null> {
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
}
