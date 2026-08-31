import { NextRequest } from 'next/server'
import { forwardCoupleWrite } from '@/lib/coupleWriteProxy'

/** Épingler une photo depuis Wedream (WED-155 / US3b). */
export async function POST(request: NextRequest) {
  return forwardCoupleWrite(request, '/api/v1/couples/me/pins')
}
