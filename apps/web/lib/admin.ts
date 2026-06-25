import { cookies } from 'next/headers'
import type {
  AdminSession,
  AdminVendorFilter,
  AdminVendorListResponse,
  AdminVendorProfile,
} from '@/lib/admin-types'

type AdminFetchResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; message: string }

type AdminSessionResponse = {
  email: string
  first_name: string
  last_name: string | null
  roles: string[]
}

const API_URL = process.env.NEXT_PUBLIC_API_URL

async function adminFetch(path: string, init?: RequestInit): Promise<Response | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('jwt_token')
  if (!token || !API_URL) return null

  const headers = new Headers(init?.headers)
  headers.set('Cookie', `jwt_token=${token.value}`)

  try {
    return await fetch(`${API_URL}${path}`, {
      ...init,
      headers,
      cache: 'no-store',
    })
  } catch {
    return null
  }
}

async function parseResult<T>(response: Response | null): Promise<AdminFetchResult<T>> {
  if (!response) {
    return { ok: false, status: 401, message: 'Authentification requise.' }
  }

  if (!response.ok) {
    return { ok: false, status: response.status, message: 'Chargement impossible.' }
  }

  return { ok: true, data: (await response.json()) as T }
}

export async function fetchAdminSession(): Promise<boolean> {
  return (await fetchCurrentAdmin()) !== null
}

export async function fetchCurrentAdmin(): Promise<AdminSession | null> {
  const result = await parseResult<AdminSessionResponse>(await adminFetch('/api/v1/admin/me'))
  if (!result.ok) return null

  return {
    email: result.data.email,
    firstName: result.data.first_name,
    lastName: result.data.last_name,
    roles: result.data.roles,
  }
}

export async function fetchAdminVendors(
  status: AdminVendorFilter
): Promise<AdminFetchResult<AdminVendorListResponse>> {
  const params = new URLSearchParams({ status })
  return parseResult(await adminFetch(`/api/v1/admin/vendors?${params.toString()}`))
}

export async function fetchAdminVendor(id: string): Promise<AdminFetchResult<AdminVendorProfile>> {
  return parseResult(await adminFetch(`/api/v1/admin/vendors/${id}`))
}
