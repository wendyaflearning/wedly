import { NextRequest } from 'next/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const apiUrl = process.env.NEXT_PUBLIC_API_URL
  if (!apiUrl) {
    return Response.json({ error: 'Configuration API manquante.' }, { status: 500 })
  }

  const response = await fetch(`${apiUrl}/api/v1/admin/tag-values/${id}/deactivate`, {
    method: 'PATCH',
    headers: {
      Cookie: request.headers.get('cookie') ?? '',
    },
  }).catch(() => null)

  if (!response) {
    return Response.json({ error: 'API indisponible.' }, { status: 502 })
  }

  const data = await response.json().catch(() => ({}))
  return Response.json(data, { status: response.status })
}
