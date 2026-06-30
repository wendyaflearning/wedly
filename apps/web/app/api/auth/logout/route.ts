import { NextRequest, NextResponse } from 'next/server';

function clearAuthCookie(response: NextResponse) {
  response.cookies.set('jwt_token', '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 0,
  });
}

export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL('/login', request.url));
  clearAuthCookie(response);

  return response;
}

export async function POST() {
  const response = NextResponse.json({ ok: true });
  clearAuthCookie(response);

  return response;
}
