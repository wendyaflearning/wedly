import type {
  AdminNotificationItem,
  AdminNotificationListResponse,
  AdminNotificationUnreadCountResponse,
} from '@/lib/admin-types'

export type AdminNotificationApiItem = {
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

export type AdminNotificationApiListResponse = {
  items: AdminNotificationApiItem[]
  page: number
  limit: number
  total: number
  unread_count: number
}

export type AdminNotificationUnreadCountApiResponse = {
  unread_count: number
}

export function mapAdminNotificationItem(item: AdminNotificationApiItem): AdminNotificationItem {
  return {
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
  }
}

export function mapAdminNotificationListResponse(
  response: AdminNotificationApiListResponse
): AdminNotificationListResponse {
  return {
    items: response.items.map(mapAdminNotificationItem),
    page: response.page,
    limit: response.limit,
    total: response.total,
    unreadCount: response.unread_count,
  }
}

export function mapAdminNotificationUnreadCountResponse(
  response: AdminNotificationUnreadCountApiResponse
): AdminNotificationUnreadCountResponse {
  return {
    unreadCount: response.unread_count,
  }
}
