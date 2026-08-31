import { describe, expect, it } from 'vitest'
import { isCoupleSpaceRedirect, safeRedirectForRole } from './auth-redirect'

describe('auth redirect helpers', () => {
  it('detects couple-space login redirects', () => {
    expect(isCoupleSpaceRedirect('/mon-espace')).toBe(true)
    expect(isCoupleSpaceRedirect('/mon-espace/demandes')).toBe(true)
    expect(isCoupleSpaceRedirect('/dashboard')).toBe(false)
  })

  it('allows mon-espace redirect only for couple logins', () => {
    expect(safeRedirectForRole('/mon-espace/demandes', 'couple')).toBe('/mon-espace/demandes')
    expect(safeRedirectForRole('/mon-espace/demandes', 'vendor')).toBe('/dashboard')
    expect(safeRedirectForRole('/dashboard/profile', 'vendor')).toBe('/dashboard/profile')
    expect(safeRedirectForRole('/dashboard/profile', 'couple')).toBe('/mon-espace')
  })
})
