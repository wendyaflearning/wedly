import { NextRequest } from 'next/server'
import { forwardCoupleWrite } from '@/lib/coupleWriteProxy'

/** Demander une mise en relation depuis Wedream (WED-156 / US3c). */
export async function POST(request: NextRequest) {
  return forwardCoupleWrite(request, '/api/v1/couples/me/provider-leads')
}
