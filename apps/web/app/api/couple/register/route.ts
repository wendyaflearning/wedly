import { NextRequest, NextResponse } from 'next/server';

/**
 * The API answers the registration with the JWT in a `jwt_token` cookie, but a
 * cookie set by the API host never reaches the browser through a cross-origin
 * fetch. This handler re-issues it same-origin, exactly as `/api/auth/login`
 * does after a vendor login.
 */
export async function POST(request: NextRequest) {
  const body = await request.json();

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let data: { error?: string; detail?: string; firstName?: string } | null = null;
  try {
    data = JSON.parse(text);
  } catch {
    console.error('[couple/register] réponse Symfony non-JSON :', res.status, text.slice(0, 500));
  }

  if (!res.ok) {
    if (data) console.error('[couple/register] erreur Symfony :', res.status, data);
    return NextResponse.json(
      { error: data?.error ?? data?.detail ?? 'Une erreur est survenue. Réessayez.' },
      { status: res.status },
    );
  }

  const setCookie = res.headers.get('set-cookie');
  const tokenMatch = setCookie?.match(/jwt_token=([^;]+)/);

  if (!tokenMatch) {
    return NextResponse.json({ error: 'no_token' }, { status: 500 });
  }

  const response = NextResponse.json({ ok: true, firstName: data?.firstName ?? null });

  response.cookies.set('jwt_token', tokenMatch[1], {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
  });

  return response;
}
