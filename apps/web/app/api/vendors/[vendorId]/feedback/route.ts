import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest, { params }: { params: Promise<{ vendorId: string }> }) {
  const cookieStore = await cookies()
  const token = cookieStore.get('jwt_token')
  if (!token) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { vendorId } = await params

  try {
    const body = await request.json()
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/vendors/${vendorId}/feedback`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `jwt_token=${token.value}`,
        },
        body: JSON.stringify(body),
        cache: 'no-store',
      }
    )

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch {
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}
