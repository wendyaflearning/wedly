import { cookies } from 'next/headers'
import type {
  AdminNotificationListResponse,
  AdminNotificationUnreadCountResponse,
  AdminSession,
  AdminVendorDraft,
  AdminVendorDraftListResponse,
  AdminVendorInvitationListResponse,
  AdminVendorInvitationScope,
  AdminVendorFilter,
  AdminVendorListResponse,
  AdminVendorProfile,
  ConfessionOption,
  CultureOption,
  RegionOption,
  ServiceOptionNode,
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

type AdminVendorFormOptions = {
  services: ServiceOptionNode[]
  regions: RegionOption[]
  cultures: CultureOption[]
  confessions: ConfessionOption[]
}

type AdminNotificationApiItem = {
  id: string
  type: 'provider_pending_review'
  type_label: string
  is_read: boolean
  read_at: string | null
  created_at: string
  payload: {
    provider_id: string
    provider_name: string
    provider_category: string
    submitted_at: string
  }
}

type AdminNotificationApiListResponse = {
  items: AdminNotificationApiItem[]
  page: number
  limit: number
  total: number
  unread_count: number
}

type AdminNotificationUnreadCountApiResponse = {
  unread_count: number
}

const API_URL = process.env.NEXT_PUBLIC_API_URL

async function publicFetch<T>(path: string): Promise<T[]> {
  if (!API_URL) return []

  const response = await fetch(`${API_URL}${path}`, { cache: 'no-store' }).catch(() => null)
  if (!response?.ok) return []

  return response.json() as Promise<T[]>
}

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

export async function fetchAdminVendorInvitations(
  scope: AdminVendorInvitationScope
): Promise<AdminFetchResult<AdminVendorInvitationListResponse>> {
  const params = new URLSearchParams({ scope })
  return parseResult(await adminFetch(`/api/v1/admin/vendor-invitations?${params.toString()}`))
}

export async function fetchAdminVendorDrafts(): Promise<AdminFetchResult<AdminVendorDraftListResponse>> {
  return parseResult(await adminFetch('/api/v1/admin/vendors/drafts'))
}

export async function fetchAdminVendorDraft(id: string): Promise<AdminFetchResult<AdminVendorDraft>> {
  return parseResult(await adminFetch(`/api/v1/admin/vendors/${id}/draft`))
}

export async function fetchAdminNotifications(limit = 8): Promise<AdminFetchResult<AdminNotificationListResponse>> {
  const params = new URLSearchParams({ limit: String(limit) })
  const result = await parseResult<AdminNotificationApiListResponse>(
    await adminFetch(`/api/v1/admin/notifications?${params.toString()}`)
  )

  if (!result.ok) {
    return result
  }

  return {
    ok: true,
    data: {
      items: result.data.items.map((item) => ({
        id: item.id,
        type: item.type,
        typeLabel: item.type_label,
        isRead: item.is_read,
        readAt: item.read_at,
        createdAt: item.created_at,
        payload: {
          providerId: item.payload.provider_id,
          providerName: item.payload.provider_name,
          providerCategory: item.payload.provider_category,
          submittedAt: item.payload.submitted_at,
        },
      })),
      page: result.data.page,
      limit: result.data.limit,
      total: result.data.total,
      unreadCount: result.data.unread_count,
    },
  }
}

export async function fetchAdminNotificationsUnreadCount(): Promise<AdminFetchResult<AdminNotificationUnreadCountResponse>> {
  const result = await parseResult<AdminNotificationUnreadCountApiResponse>(
    await adminFetch('/api/v1/admin/notifications/unread-count')
  )

  if (!result.ok) {
    return result
  }

  return {
    ok: true,
    data: {
      unreadCount: result.data.unread_count,
    },
  }
}

export async function fetchAdminVendorFormOptions(): Promise<AdminVendorFormOptions> {
  const [services, regions, cultures, confessions] = await Promise.all([
    publicFetch<ServiceOptionNode>('/api/v1/services'),
    publicFetch<RegionOption>('/api/v1/regions'),
    publicFetch<CultureOption>('/api/v1/cultures'),
    publicFetch<ConfessionOption>('/api/v1/confessions'),
  ])

  return { services, regions, cultures, confessions }
}
