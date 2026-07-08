'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Loader2 } from 'lucide-react'
import { mapAdminNotificationListResponse, type AdminNotificationApiListResponse, type AdminNotificationUnreadCountApiResponse } from '@/lib/admin-notifications'
import type { AdminNotificationItem } from '@/lib/admin-types'

const POLL_INTERVAL_MS = 30_000

type AdminNotificationsBellProps = {
  initialNotifications: AdminNotificationItem[]
  initialUnreadCount: number
}

function formatSubmittedAt(value: string): string {
  const date = new Date(value)
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

export function AdminNotificationsBell({
  initialNotifications,
  initialUnreadCount,
}: AdminNotificationsBellProps) {
  const router = useRouter()
  const panelRef = useRef<HTMLDivElement | null>(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [notifications, setNotifications] = useState(initialNotifications)
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount)
  const [error, setError] = useState<string | null>(null)

  async function refreshNotifications() {
    setLoading(true)
    setError(null)

    const response = await fetch('/api/admin/notifications?limit=8', { cache: 'no-store' }).catch(() => null)
    if (!response?.ok) {
      setLoading(false)
      setError('Chargement impossible.')
      return
    }

    const data = mapAdminNotificationListResponse(
      (await response.json()) as AdminNotificationApiListResponse
    )
    setNotifications(data.items)
    setUnreadCount(data.unreadCount)
    setLoading(false)
  }

  async function refreshUnreadCount() {
    const response = await fetch('/api/admin/notifications/unread-count', { cache: 'no-store' }).catch(() => null)
    if (!response?.ok) {
      return
    }

    const data = (await response.json()) as AdminNotificationUnreadCountApiResponse
    setUnreadCount(data.unread_count)
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (document.visibilityState !== 'visible') {
        return
      }

      if (open) {
        void refreshNotifications()
        return
      }

      void refreshUnreadCount()
    }, POLL_INTERVAL_MS)

    return () => window.clearInterval(interval)
  }, [open])

  async function openNotification(notification: AdminNotificationItem) {
    if (!notification.isRead) {
      const response = await fetch(`/api/admin/notifications/${notification.id}/read`, { method: 'POST' }).catch(() => null)
      if (response?.ok) {
        setNotifications((current) =>
          current.map((item) =>
            item.id === notification.id
              ? {
                  ...item,
                  isRead: true,
                  readAt: new Date().toISOString(),
                }
              : item
          )
        )
        setUnreadCount((current) => Math.max(0, current - 1))
      }
    }

    setOpen(false)
    router.push(`/admin/prestataires/${notification.payload.providerId}`)
    router.refresh()
  }

  function togglePanel() {
    const nextOpen = !open
    setOpen(nextOpen)

    if (nextOpen) {
      void refreshNotifications()
    }
  }

  return (
    <div ref={panelRef} className="relative">
      <button
        type="button"
        onClick={togglePanel}
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-bordeaux/12 bg-white text-bordeaux shadow-sm transition-colors hover:bg-[#fbf7f2]"
        aria-label="Ouvrir les notifications admin"
        aria-expanded={open}
      >
        <Bell size={18} aria-hidden="true" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-highlight px-1 text-[11px] font-bold text-creme">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-14 z-50 w-[340px] overflow-hidden rounded-2xl border border-bordeaux/10 bg-white shadow-[0_18px_45px_rgba(67,28,38,0.18)]">
          <div className="flex items-center justify-between border-b border-bordeaux/8 px-4 py-3">
            <div>
              <p className="text-sm font-bold text-bordeaux">Notifications</p>
              <p className="text-xs text-gris">{unreadCount} non lue{unreadCount > 1 ? 's' : ''}</p>
            </div>
            {loading ? <Loader2 size={16} className="animate-spin text-bordeaux/55" aria-hidden="true" /> : null}
          </div>

          {error ? (
            <div className="px-4 py-5 text-sm text-danger">{error}</div>
          ) : notifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-gris">Aucune notification pour le moment.</div>
          ) : (
            <ul className="max-h-[420px] overflow-y-auto">
              {notifications.map((notification) => (
                <li key={notification.id} className="border-b border-bordeaux/6 last:border-b-0">
                  <button
                    type="button"
                    onClick={() => void openNotification(notification)}
                    className={[
                      'flex w-full flex-col gap-2 px-4 py-4 text-left transition-colors hover:bg-[#fbf7f2]',
                      notification.isRead ? 'bg-white' : 'bg-highlight/5',
                    ].join(' ')}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-semibold text-bordeaux">{notification.typeLabel}</p>
                      {!notification.isRead ? <span className="mt-1 h-2.5 w-2.5 rounded-full bg-highlight" /> : null}
                    </div>
                    <p className="text-sm text-texte">
                      <span className="font-semibold">{notification.payload.providerName}</span>
                      {' · '}
                      {notification.payload.providerCategory}
                    </p>
                    <p className="text-xs text-gris">
                      Soumis le {formatSubmittedAt(notification.payload.submittedAt)}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  )
}
