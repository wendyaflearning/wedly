import { NextRequest } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const apiUrl = process.env.NEXT_PUBLIC_API_URL
  if (!apiUrl) {
    return Response.json({ error: 'Configuration API manquante.' }, { status: 500 })
  }

  const contentType = request.headers.get('content-type') ?? ''
  const body = await request.arrayBuffer()

  const response = await fetch(`${apiUrl}/api/v1/admin/vendors/${id}/portfolio`, {
    method: 'POST',
    headers: {
      'content-type': contentType,
      Cookie: request.headers.get('cookie') ?? '',
    },
    body,
  }).catch(() => null)

  if (!response) {
    return Response.json({ error: 'API indisponible.' }, { status: 502 })
  }

  const data = await response.json().catch(() => ({}))
  return Response.json(data, { status: response.status })
}
