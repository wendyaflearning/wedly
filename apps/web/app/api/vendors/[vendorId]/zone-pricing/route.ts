import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ vendorId: string }> }
) {
  const { vendorId } = await params
  const cookieStore = await cookies()
  const token = cookieStore.get('jwt_token')
  if (!token) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/vendors/${vendorId}/zone-pricing`,
      {
        headers: { Cookie: `jwt_token=${token.value}` },
        cache: 'no-store',
      }
    )
    if (!res.ok) return NextResponse.json({ error: 'upstream_error' }, { status: res.status })
    return NextResponse.json(await res.json())
  } catch {
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ vendorId: string }> }
) {
  const { vendorId } = await params
  const body = await request.json()

  const cookieStore = await cookies()
  const token = cookieStore.get('jwt_token')
  if (!token) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/vendors/${vendorId}/zone-pricing`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `jwt_token=${token.value}`,
        },
        body: JSON.stringify(body),
      }
    )
    if (!res.ok) return NextResponse.json({ error: 'upstream_error' }, { status: res.status })
    return NextResponse.json(await res.json())
  } catch {
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}
