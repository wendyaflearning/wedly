import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { upstreamError } from '@/lib/apiError'

/**
 * Le prestataire accepte ou refuse une demande de mise en relation (WED-52).
 *
 * Proxy strict : le corps `{ decision }` est relayé tel quel, le backend le
 * valide (`VendorProviderLeadDecisionRequestDto` refuse en 422 toute valeur hors
 * liste). Le lead visé vient de l'URL, jamais du corps.
 *
 * Le 409 « demande déjà traitée » remonte via `upstreamError` avec le message
 * du backend, que l'écran affiche tel quel — aucune reformulation ici.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies()
  const token = cookieStore.get('jwt_token')
  if (!token) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json()

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/vendors/me/provider-leads/${id}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `jwt_token=${token.value}`,
      },
      body: JSON.stringify(body),
    }
  )

  if (!res.ok) return upstreamError(res)

  return NextResponse.json(await res.json())
}
