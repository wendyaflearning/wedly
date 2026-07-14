import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { upstreamError } from '@/lib/apiError'

export async function GET() {
  const cookieStore = await cookies()
  const token = cookieStore.get('jwt_token')
  if (!token) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/vendors/booking-blockers`,
      {
        headers: { Cookie: `jwt_token=${token.value}` },
        cache: 'no-store',
      }
    )
    if (!res.ok) return upstreamError(res)
    return NextResponse.json(await res.json())
  } catch {
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { date_start, date_end } = body

  const cookieStore = await cookies()
  const token = cookieStore.get('jwt_token')
  if (!token) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/vendors/booking-blockers`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `jwt_token=${token.value}`,
        },
        body: JSON.stringify({ date_start, date_end }),
      }
    )
    if (!res.ok) return upstreamError(res)
    return NextResponse.json(await res.json())
  } catch {
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}
