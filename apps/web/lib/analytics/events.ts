import posthog from 'posthog-js'

/**
 * Closed set of WedDream analytics events.
 * `landing_view` is emitted automatically via `$pageview` (see WED-203).
 */
export const ANALYTICS_EVENTS = {
  SIGNUP_STARTED: 'signup_started',
  SIGNUP_COMPLETED: 'signup_completed',
  PHOTO_PINNED: 'photo_pinned',
  CONNECTION_STARTED: 'connection_started',
  CONNECTION_REQUESTED: 'connection_requested',
} as const

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS]

export type EventProperties = {
  signup_started: undefined
  signup_completed: {
    zone: string
    budget_range: string
    wedding_date_month?: string
    ceremony_type?: string
  }
  photo_pinned: {
    vendor_id?: string
    category?: string
  }
  connection_started: {
    vendor_id: string
    category: string
    from_pin: boolean
  }
  connection_requested: {
    vendor_id?: string
    category?: string
  }
}

export function trackEvent(event: 'signup_started'): void
export function trackEvent(
  event: 'signup_completed',
  properties: EventProperties['signup_completed'],
): void
export function trackEvent(
  event: 'connection_started',
  properties: EventProperties['connection_started'],
): void
export function trackEvent(
  event: 'photo_pinned',
  properties?: EventProperties['photo_pinned'],
): void
export function trackEvent(
  event: 'connection_requested',
  properties?: EventProperties['connection_requested'],
): void
export function trackEvent(
  event: AnalyticsEventName,
  properties?: EventProperties[AnalyticsEventName],
): void {
  if (!posthog.__loaded) {
    return
  }

  if (properties === undefined) {
    posthog.capture(event)
    return
  }

  posthog.capture(event, properties)
}
