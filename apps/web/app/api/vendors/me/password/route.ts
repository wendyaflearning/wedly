import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { upstreamError } from '@/lib/apiError'

export async function PATCH(request: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get('jwt_token')
  if (!token) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await request.json()

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/vendors/me/password`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `jwt_token=${token.value}`,
      },
      body: JSON.stringify(body),
    }
  )

  if (!res.ok) return upstreamError(res)

  return NextResponse.json(await res.json())
}
