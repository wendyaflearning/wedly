import { NextRequest, NextResponse } from 'next/server'

const PROTECTED_ROUTES = [
  '/dashboard',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isProtected = PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  )

  if (!isProtected) return NextResponse.next()

  const hasToken = request.cookies.has('jwt_token')

  if (!hasToken) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|login|forgot-password|onboarding|api/).*)',
  ],
}
