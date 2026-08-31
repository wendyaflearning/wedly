import { cache } from 'react'
import { cookies } from 'next/headers'
import type { CoupleLead, CoupleLeadsResult } from './couple-leads'

/**
 * Lecture authentifiée de la zone « Demandes de contact » (US-6.5 / WED-134).
 * Server-only : suit le même schéma que `fetchCoupleSession` (`lib/couple.ts`)
 * — cookie JWT transféré tel quel, `no-store`.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL

export const fetchCoupleLeads = cache(async (): Promise<CoupleLeadsResult> => {
  if (!API_URL) return { ok: false }

  const cookieStore = await cookies()
  const token = cookieStore.get('jwt_token')
  if (!token) return { ok: false }

  try {
    const res = await fetch(`${API_URL}/api/v1/couples/me/provider-leads`, {
      headers: { Cookie: `jwt_token=${token.value}` },
      cache: 'no-store',
    })
    if (!res.ok) return { ok: false }

    const body = (await res.json()) as { items?: CoupleLead[] }
    return { ok: true, items: Array.isArray(body.items) ? body.items : [] }
  } catch {
    return { ok: false }
  }
})
