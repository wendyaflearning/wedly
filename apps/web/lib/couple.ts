import { cache } from 'react'
import { cookies } from 'next/headers'

export type CoupleSession = {
  id: string
  firstName: string
  lastName?: string | null
  email?: string
}

export const fetchCoupleSession = cache(async (): Promise<CoupleSession | null> => {
  const cookieStore = await cookies()
  const token = cookieStore.get('jwt_token')
  if (!token) return null

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/couples/me`, {
      headers: { Cookie: `jwt_token=${token.value}` },
      cache: 'no-store',
    })
    if (!res.ok) return null
    return res.json() as Promise<CoupleSession>
  } catch {
    return null
  }
})
