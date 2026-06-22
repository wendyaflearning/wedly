import { NextRequest, NextResponse } from 'next/server';

const ADMIN_HOME = '/admin/prestataires';
const VENDOR_HOME = '/dashboard';
const REDIRECT_BASE_URL = 'http://wedly.local';

function isRouteInSection(value: string, section: string): boolean {
  return value === section || value.startsWith(`${section}/`) || value.startsWith(`${section}?`);
}

function safeRedirectForRole(value: unknown, isAdmin: boolean): string {
  const fallback = isAdmin ? ADMIN_HOME : VENDOR_HOME;

  if (typeof value !== 'string') {
    return fallback;
  }

  if (!value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
    return fallback;
  }

  let redirectUrl: URL;
  try {
    redirectUrl = new URL(value, REDIRECT_BASE_URL);
  } catch {
    return fallback;
  }

  if (redirectUrl.origin !== REDIRECT_BASE_URL) {
    return fallback;
  }

  const normalizedRedirect = `${redirectUrl.pathname}${redirectUrl.search}${redirectUrl.hash}`;

  if (isAdmin && isRouteInSection(normalizedRedirect, '/admin')) {
    return normalizedRedirect;
  }

  if (!isAdmin && isRouteInSection(normalizedRedirect, '/dashboard')) {
    return normalizedRedirect;
  }

  return fallback;
}

async function isAdminSession(token: string): Promise<boolean> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/admin/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });

    return response.ok;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { redirectTo: requestedRedirectTo, ...credentials } = body;

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });

  if (!res.ok) {
    return NextResponse.json({ error: 'invalid_credentials' }, { status: res.status });
  }

  const setCookie = res.headers.get('set-cookie');
  const tokenMatch = setCookie?.match(/jwt_token=([^;]+)/);

  if (!tokenMatch) {
    return NextResponse.json({ error: 'no_token' }, { status: 500 });
  }

  const isAdmin = await isAdminSession(tokenMatch[1]);
  const response = NextResponse.json({
    ok: true,
    redirectTo: safeRedirectForRole(requestedRedirectTo, isAdmin),
  });

  response.cookies.set('jwt_token', tokenMatch[1], {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
  });

  return response;
}
