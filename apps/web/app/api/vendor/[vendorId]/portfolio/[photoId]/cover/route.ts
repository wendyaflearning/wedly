import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

const API = process.env.NEXT_PUBLIC_API_URL

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ vendorId: string; photoId: string }> }
) {
  const { vendorId, photoId } = await params
  const cookieStore = await cookies()
  const token = cookieStore.get('jwt_token')
  if (!token) return Response.json({ error: 'Non authentifié.' }, { status: 401 })

  const res = await fetch(`${API}/api/v1/vendors/${vendorId}/portfolio/${photoId}/cover`, {
    method: 'PATCH',
    headers: { Cookie: `jwt_token=${token.value}` },
  })

  const text = await res.text()
  try {
    return Response.json(JSON.parse(text), { status: res.status })
  } catch {
    return Response.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
