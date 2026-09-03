import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { upstreamError } from '@/lib/apiError'

export async function POST() {
  const cookieStore = await cookies()
  const token = cookieStore.get('jwt_token')
  if (!token) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/vendors/me/publish`,
    {
      method: 'POST',
      headers: { Cookie: `jwt_token=${token.value}` },
      cache: 'no-store',
    }
  )

  /**
   * Le 422 porte `missing_sections`, la seule liste qui fasse autorité sur ce qui
   * manque. `upstreamError` réduit tout corps à `{ error }` : il l'effacerait.
   */
  if (res.status === 422) {
    return NextResponse.json(await res.json(), { status: 422 })
  }

  if (!res.ok) return upstreamError(res)

  return NextResponse.json(await res.json())
}
