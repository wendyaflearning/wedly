import { cookies } from 'next/headers'

export type BookingBlocker = {
  id: string
  date_start: string
  date_end: string
}

export async function fetchAvailability(): Promise<BookingBlocker[]> {
  const cookieStore = await cookies()
  const token = cookieStore.get('jwt_token')
  if (!token) return []

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/vendors/booking-blockers`,
      {
        headers: { Cookie: `jwt_token=${token.value}` },
        cache: 'no-store',
      }
    )
    if (!res.ok) return []
    return res.json() as Promise<BookingBlocker[]>
  } catch {
    return []
  }
}
