import { NextRequest } from 'next/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ vendorId: string; imageId: string }> }
) {
  const { vendorId, imageId } = await params
  const apiUrl = process.env.NEXT_PUBLIC_API_URL
  if (!apiUrl) {
    return Response.json({ error: 'Configuration API manquante.' }, { status: 500 })
  }

  const body = await request.text()
  const response = await fetch(`${apiUrl}/api/v1/admin/vendors/${vendorId}/portfolio/${imageId}/tags`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
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
