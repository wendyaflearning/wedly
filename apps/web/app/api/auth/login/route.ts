import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    return NextResponse.json({ error: 'invalid_credentials' }, { status: res.status });
  }

  const setCookie = res.headers.get('set-cookie');
  const tokenMatch = setCookie?.match(/jwt_token=([^;]+)/);

  if (!tokenMatch) {
    return NextResponse.json({ error: 'no_token' }, { status: 500 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set('jwt_token', tokenMatch[1], {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
  });

  return response;
}
