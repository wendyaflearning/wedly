import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

const API = process.env.NEXT_PUBLIC_API_URL

async function getAuthCookie() {
  const cookieStore = await cookies()
  const token = cookieStore.get('jwt_token')
  return token ? `jwt_token=${token.value}` : null
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ vendorId: string }> }
) {
  const { vendorId } = await params
  const cookieHeader = await getAuthCookie()
  if (!cookieHeader) return Response.json({ error: 'Non authentifié.' }, { status: 401 })

  const res = await fetch(`${API}/api/v1/vendors/${vendorId}/portfolio`, {
    headers: { Cookie: cookieHeader },
    cache: 'no-store',
  })

  const text = await res.text()
  try {
    return Response.json(JSON.parse(text), { status: res.status })
  } catch {
    return Response.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ vendorId: string }> }
) {
  const { vendorId } = await params
  const cookieHeader = await getAuthCookie()
  if (!cookieHeader) return Response.json({ error: 'Non authentifié.' }, { status: 401 })

  const contentType = request.headers.get('content-type') ?? ''
  const body = await request.arrayBuffer()

  const res = await fetch(`${API}/api/v1/vendors/${vendorId}/portfolio`, {
    method: 'POST',
    headers: { 'content-type': contentType, Cookie: cookieHeader },
    body,
  })

  const text = await res.text()
  try {
    return Response.json(JSON.parse(text), { status: res.status })
  } catch {
    return Response.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
