import { COUPLE_SPACE_PATH } from './couple-space'

const ADMIN_HOME = '/admin/prestataires'
const VENDOR_HOME = '/dashboard'
const COUPLE_HOME = COUPLE_SPACE_PATH

export type LoginRole = 'admin' | 'couple' | 'vendor'

const REDIRECT_BASE_URL = 'http://wedly.local'

export function isRouteInSection(value: string, section: string): boolean {
  return value === section || value.startsWith(`${section}/`) || value.startsWith(`${section}?`)
}

export function isCoupleSpaceRedirect(value: string | undefined): boolean {
  if (!value) return false
  return isRouteInSection(value, COUPLE_SPACE_PATH)
}

export function safeRedirectForRole(value: unknown, role: LoginRole): string {
  const fallback =
    role === 'admin' ? ADMIN_HOME : role === 'couple' ? COUPLE_HOME : VENDOR_HOME

  if (typeof value !== 'string') {
    return fallback
  }

  if (!value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
    return fallback
  }

  let redirectUrl: URL
  try {
    redirectUrl = new URL(value, REDIRECT_BASE_URL)
  } catch {
    return fallback
  }

  if (redirectUrl.origin !== REDIRECT_BASE_URL) {
    return fallback
  }

  const normalizedRedirect = `${redirectUrl.pathname}${redirectUrl.search}${redirectUrl.hash}`

  if (role === 'admin' && isRouteInSection(normalizedRedirect, '/admin')) {
    return normalizedRedirect
  }

  if (role === 'vendor' && isRouteInSection(normalizedRedirect, '/dashboard')) {
    return normalizedRedirect
  }

  if (role === 'couple' && isRouteInSection(normalizedRedirect, COUPLE_SPACE_PATH)) {
    return normalizedRedirect
  }

  return fallback
}
