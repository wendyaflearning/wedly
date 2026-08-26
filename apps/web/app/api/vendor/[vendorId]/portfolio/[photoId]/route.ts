import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

const API = process.env.NEXT_PUBLIC_API_URL

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ vendorId: string; photoId: string }> }
) {
  const { photoId } = await params
  const cookieStore = await cookies()
  const token = cookieStore.get('jwt_token')
  if (!token) return Response.json({ error: 'Non authentifié.' }, { status: 401 })

  const res = await fetch(`${API}/api/v1/vendors/me/portfolio/${photoId}`, {
    method: 'DELETE',
    headers: { Cookie: `jwt_token=${token.value}` },
  })

  if (res.status === 204) return new Response(null, { status: 204 })
  const text = await res.text()
  try {
    return Response.json(JSON.parse(text), { status: res.status })
  } catch {
    return Response.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
