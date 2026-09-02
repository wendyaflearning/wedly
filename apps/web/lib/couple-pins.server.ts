import { cache } from 'react'
import { cookies } from 'next/headers'
import type { CouplePin, CouplePinsResult } from './couple-pins'

/**
 * Lecture authentifiée de la zone « Épinglés » (US-6.6 / WED-135).
 * Server-only : même schéma que `fetchCoupleLeads` (`lib/couple-leads.server.ts`)
 * — cookie JWT transféré tel quel, `no-store`.
 *
 * Aucun identifiant de couple ne transite par l'URL : l'API lit toujours le
 * couple dans le JWT (COUPLE-PIN-002).
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL

export const fetchCouplePins = cache(async (): Promise<CouplePinsResult> => {
  if (!API_URL) return { ok: false }

  const cookieStore = await cookies()
  const token = cookieStore.get('jwt_token')
  if (!token) return { ok: false }

  try {
    const res = await fetch(`${API_URL}/api/v1/couples/me/pins`, {
      headers: { Cookie: `jwt_token=${token.value}` },
      cache: 'no-store',
    })
    if (!res.ok) return { ok: false }

    const body = (await res.json()) as { items?: CouplePin[] }
    return { ok: true, items: Array.isArray(body.items) ? body.items : [] }
  } catch {
    return { ok: false }
  }
})
