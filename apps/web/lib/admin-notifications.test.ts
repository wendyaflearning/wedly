import { describe, expect, it } from 'vitest'
import {
  mapAdminNotificationItem,
  mapAdminNotificationListResponse,
  mapAdminNotificationUnreadCountResponse,
} from './admin-notifications'

describe('admin notifications mappers', () => {
  it('mappe une notification snake_case vers camelCase', () => {
    const notification = mapAdminNotificationItem({
      id: 'notif-1',
      type: 'provider_pending_review',
      type_label: 'Nouveau prestataire en attente de validation',
      is_read: false,
      read_at: null,
      created_at: '2026-07-08T10:30:00+00:00',
      payload: {
        provider_id: 'vendor-1',
        provider_name: 'Studio Camille',
        provider_category: 'Traiteur',
        submitted_at: '2026-07-08T10:00:00+00:00',
      },
    })

    expect(notification).toEqual({
      id: 'notif-1',
      type: 'provider_pending_review',
      typeLabel: 'Nouveau prestataire en attente de validation',
      isRead: false,
      readAt: null,
      createdAt: '2026-07-08T10:30:00+00:00',
      payload: {
        providerId: 'vendor-1',
        providerName: 'Studio Camille',
        providerCategory: 'Traiteur',
        submittedAt: '2026-07-08T10:00:00+00:00',
      },
    })
  })

  it('mappe la réponse liste et le compteur non lu', () => {
    const list = mapAdminNotificationListResponse({
      items: [{
        id: 'notif-1',
        type: 'provider_pending_review',
        type_label: 'Nouveau prestataire en attente de validation',
        is_read: true,
        read_at: '2026-07-08T10:35:00+00:00',
        created_at: '2026-07-08T10:30:00+00:00',
        payload: {
          provider_id: 'vendor-1',
          provider_name: 'Studio Camille',
          provider_category: 'Traiteur',
          submitted_at: '2026-07-08T10:00:00+00:00',
        },
      }],
      page: 1,
      limit: 8,
      total: 1,
      unread_count: 0,
    })

    expect(list.unreadCount).toBe(0)
    expect(list.items[0]?.payload.providerId).toBe('vendor-1')
    expect(mapAdminNotificationUnreadCountResponse({ unread_count: 3 })).toEqual({ unreadCount: 3 })
  })
})
