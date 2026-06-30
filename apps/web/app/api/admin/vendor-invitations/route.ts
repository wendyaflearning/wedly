import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL
  if (!apiUrl) {
    return Response.json({ error: 'Configuration API manquante.' }, { status: 500 })
  }

  const scope = request.nextUrl.searchParams.get('scope') ?? 'active'
  const response = await fetch(`${apiUrl}/api/v1/admin/vendor-invitations?${new URLSearchParams({ scope })}`, {
    headers: {
      Cookie: request.headers.get('cookie') ?? '',
    },
    cache: 'no-store',
  }).catch(() => null)

  if (!response) {
    return Response.json({ error: 'API indisponible.' }, { status: 502 })
  }

  const data = await response.json().catch(() => ({}))
  return Response.json(data, { status: response.status })
}
