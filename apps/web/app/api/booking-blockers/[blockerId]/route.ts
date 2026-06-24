import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ blockerId: string }> }
) {
  const { blockerId } = await params

  const cookieStore = await cookies()
  const token = cookieStore.get('jwt_token')
  if (!token) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/vendors/booking-blockers/${blockerId}`,
      {
        method: 'DELETE',
        headers: { Cookie: `jwt_token=${token.value}` },
      }
    )
    if (!res.ok) return NextResponse.json({ error: 'upstream_error' }, { status: res.status })
    return new NextResponse(null, { status: 204 })
  } catch {
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}
