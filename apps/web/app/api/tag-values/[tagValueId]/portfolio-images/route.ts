import { NextRequest } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tagValueId: string }> }
) {
  const { tagValueId } = await params
  const apiUrl = process.env.NEXT_PUBLIC_API_URL
  if (!apiUrl) {
    return Response.json({ error: 'Configuration API manquante.' }, { status: 500 })
  }

  const query = new URLSearchParams()
  for (const key of ['limit', 'cursor'] as const) {
    const value = request.nextUrl.searchParams.get(key)
    if (value !== null) {
      query.set(key, value)
    }
  }
  const queryString = query.toString()

  const response = await fetch(
    `${apiUrl}/api/v1/tag-values/${encodeURIComponent(tagValueId)}/portfolio-images${queryString ? `?${queryString}` : ''}`,
    {
      cache: 'no-store',
    }
  ).catch(() => null)

  if (!response) {
    return Response.json({ error: 'API indisponible.' }, { status: 502 })
  }

  const data = await response.json().catch(() => ({}))
  return Response.json(data, { status: response.status })
}
