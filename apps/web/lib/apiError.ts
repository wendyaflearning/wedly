import { NextResponse } from 'next/server'

const FALLBACK = 'Une erreur est survenue.'

export async function upstreamError(res: Response): Promise<NextResponse> {
  const text = await res.text().catch(() => '')
  let error = FALLBACK
  try {
    const json = JSON.parse(text)
    error = json.error ?? json.detail ?? FALLBACK
  } catch { /* réponse non-JSON */ }
  return NextResponse.json({ error }, { status: res.status })
}
