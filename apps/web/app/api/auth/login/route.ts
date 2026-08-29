import { NextRequest, NextResponse } from 'next/server';
import { type LoginRole, safeRedirectForRole } from '@/lib/auth-redirect';

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

async function isCoupleSession(token: string): Promise<boolean> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/couples/me`, {
      headers: { Cookie: `jwt_token=${token}` },
      cache: 'no-store',
    });

    return response.ok;
  } catch {
    return false;
  }
}

async function resolveLoginRole(token: string): Promise<LoginRole> {
  if (await isAdminSession(token)) return 'admin';
  if (await isCoupleSession(token)) return 'couple';
  return 'vendor';
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

  const role = await resolveLoginRole(tokenMatch[1]);
  const response = NextResponse.json({
    ok: true,
    redirectTo: safeRedirectForRole(requestedRedirectTo, role),
  });

  response.cookies.set('jwt_token', tokenMatch[1], {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
  });

  return response;
}
