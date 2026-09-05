import { beforeEach, describe, expect, it, vi } from 'vitest'

const { capture } = vi.hoisted(() => ({
  capture: vi.fn(),
}))

vi.mock('posthog-js', () => ({
  default: {
    __loaded: false,
    capture,
  },
}))

import posthog from 'posthog-js'
import { ANALYTICS_EVENTS, trackEvent } from './events'

type PostHogTestStub = {
  __loaded: boolean
  capture: typeof capture
}

describe('analytics events', () => {
  beforeEach(() => {
    capture.mockClear()
    ;(posthog as PostHogTestStub).__loaded = false
  })

  it('exports exactly five closed analytics event names', () => {
    expect(Object.values(ANALYTICS_EVENTS)).toHaveLength(5)
    expect(Object.values(ANALYTICS_EVENTS)).toEqual([
      'signup_started',
      'signup_completed',
      'photo_pinned',
      'connection_started',
      'connection_requested',
    ])
  })

  it('no-ops when PostHog is not initialized', () => {
    trackEvent('signup_started')
    trackEvent('photo_pinned')
    trackEvent('connection_requested')

    expect(capture).not.toHaveBeenCalled()
  })

  it('captures events when PostHog is initialized', () => {
    ;(posthog as PostHogTestStub).__loaded = true

    trackEvent('signup_started')
    expect(capture).toHaveBeenCalledWith('signup_started')

    trackEvent('signup_completed', {
      zone: 'Lyon',
      budget_range: '20 000 – 30 000 €',
      wedding_date_month: '2027-06',
      ceremony_type: 'catholique,laique',
    })
    expect(capture).toHaveBeenCalledWith('signup_completed', {
      zone: 'Lyon',
      budget_range: '20 000 – 30 000 €',
      wedding_date_month: '2027-06',
      ceremony_type: 'catholique,laique',
    })

    trackEvent('photo_pinned', { vendor_id: 'fleuriste-marie', category: 'bouquets' })
    expect(capture).toHaveBeenCalledWith('photo_pinned', {
      vendor_id: 'fleuriste-marie',
      category: 'bouquets',
    })

    trackEvent('connection_started', {
      vendor_id: 'fleuriste-marie',
      category: 'bouquets',
      from_pin: true,
    })
    expect(capture).toHaveBeenCalledWith('connection_started', {
      vendor_id: 'fleuriste-marie',
      category: 'bouquets',
      from_pin: true,
    })

    trackEvent('connection_requested', {})
    expect(capture).toHaveBeenCalledWith('connection_requested', {})

    trackEvent('photo_pinned')
    expect(capture).toHaveBeenCalledWith('photo_pinned')
  })
})
