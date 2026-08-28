import { NextRequest } from 'next/server'

// Endpoint public côté Symfony (PUBLIC_ACCESS) : aucun cookie de session à faire suivre,
// contrairement aux route handlers admin.
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ vendorId: string }> }
) {
  const { vendorId } = await params
  const apiUrl = process.env.NEXT_PUBLIC_API_URL
  if (!apiUrl) {
    return Response.json({ error: 'Configuration API manquante.' }, { status: 500 })
  }

  const response = await fetch(`${apiUrl}/api/v1/vendors/${vendorId}/unsubscribe`, {
    method: 'POST',
    cache: 'no-store',
  }).catch(() => null)

  if (!response) {
    return Response.json({ error: 'API indisponible.' }, { status: 502 })
  }

  const data = await response.json().catch(() => ({}))
  return Response.json(data, { status: response.status })
}
