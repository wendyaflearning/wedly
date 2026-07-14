import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { upstreamError } from '@/lib/apiError'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ vendorId: string }> }) {
  const cookieStore = await cookies()
  const token = cookieStore.get('jwt_token')
  if (!token) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { vendorId } = await params

  try {
    const body = await request.json()
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/vendors/${vendorId}/bio`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `jwt_token=${token.value}`,
        },
        body: JSON.stringify(body),
        cache: 'no-store',
      }
    )
    if (!res.ok) return upstreamError(res)
    return NextResponse.json(await res.json())
  } catch {
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}
