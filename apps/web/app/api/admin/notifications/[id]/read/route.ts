import { NextRequest } from 'next/server'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL
  if (!apiUrl) {
    return Response.json({ error: 'Configuration API manquante.' }, { status: 500 })
  }

  const { id } = await context.params
  const response = await fetch(`${apiUrl}/api/v1/admin/notifications/${id}/read`, {
    method: 'POST',
    headers: {
      Cookie: request.headers.get('cookie') ?? '',
    },
  }).catch(() => null)

  if (!response) {
    return Response.json({ error: 'API indisponible.' }, { status: 502 })
  }

  if (response.status === 204) {
    return new Response(null, { status: 204 })
  }

  const data = await response.json().catch(() => ({}))
  return Response.json(data, { status: response.status })
}
