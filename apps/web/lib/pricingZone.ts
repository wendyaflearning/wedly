import { cookies } from 'next/headers'

export type PricingZoneData = {
  price_min: number
  price_max: number
  price_type: string
  zones: string[]
}

export async function fetchPricingZone(vendorId: string): Promise<PricingZoneData | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('jwt_token')
  if (!token) return null

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/vendors/${vendorId}/zone-pricing`,
      {
        headers: { Cookie: `jwt_token=${token.value}` },
        cache: 'no-store',
      }
    )
    if (!res.ok) return null
    const json = await res.json()
    // L'API retourne [] si aucune donnée n'a encore été enregistrée
    if (Array.isArray(json) && json.length === 0) return null
    return json as PricingZoneData
  } catch {
    return null
  }
}
